from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import hashlib
import json
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import AuditLedger

router = APIRouter()


class LedgerEntryRequest(BaseModel):
    txId: str
    event: str
    dept: str
    timestamp: Optional[str] = None
    hash: Optional[str] = None
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)


class LedgerEntryResponse(BaseModel):
    tx_id: str
    department: str
    event_type: str
    details: Dict[str, Any] = Field(default_factory=dict)
    status: str = "VERIFIED"
    integrity_hash: str
    created_at: str


def _generate_hash(tx_id: str, event: str, timestamp: str) -> str:
    raw = f"{tx_id}:{event}:{timestamp}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _make_unique_tx_id(tx_id: str, event: str) -> str:
    """Ensure tx_id is unique by appending a short event suffix."""
    suffix = hashlib.md5(event.encode()).hexdigest()[:8]
    return f"{tx_id}-{suffix}"


async def _save_supabase(payload: dict):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/audit_ledger?on_conflict=tx_id",
                headers={
                    "Content-Type": "application/json",
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Prefer": "resolution=merge-duplicates,return=representation",
                },
                json=payload,
                timeout=5.0,
            )
    except Exception as e:
        print(f"Warning: Supabase audit_ledger save failed: {e}")


async def _fetch_supabase() -> List[LedgerEntryResponse]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return []
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/audit_ledger?select=*&order=created_at.desc&limit=200",
                headers={
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                },
                timeout=5.0,
            )
            if res.status_code == 200:
                rows = res.json()
                return [
                    LedgerEntryResponse(
                        tx_id=r.get("tx_id", ""),
                        department=r.get("department", ""),
                        event_type=r.get("event_type", ""),
                        details=r.get("details") or {},
                        status=r.get("status", "VERIFIED"),
                        integrity_hash=r.get("integrity_hash", ""),
                        created_at=str(r.get("created_at", ""))[:19].replace("T", " "),
                    )
                    for r in rows
                    if r.get("tx_id")
                ]
    except Exception as e:
        print(f"Warning: Supabase audit_ledger fetch failed: {e}")
    return []


@router.post("/ledger", response_model=LedgerEntryResponse)
async def create_ledger_entry(entry: LedgerEntryRequest, db: AsyncSession = Depends(get_db)):
    """Persists an audit ledger entry to the database and Supabase."""
    timestamp = entry.timestamp or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    unique_tx_id = _make_unique_tx_id(entry.txId, entry.event)
    integrity_hash = entry.hash or _generate_hash(entry.txId, entry.event, timestamp)

    details = entry.details or {}
    details.update({"original_tx_id": entry.txId, "event_label": entry.event})

    payload = {
        "tx_id": unique_tx_id,
        "department": entry.dept,
        "event_type": entry.event,
        "details": details,
        "status": "VERIFIED",
        "integrity_hash": integrity_hash,
    }

    try:
        if db is not None:
            # Check for duplicate tx_id before inserting
            existing = await db.execute(
                select(AuditLedger).where(AuditLedger.tx_id == unique_tx_id)
            )
            if not existing.scalars().first():
                record = AuditLedger(
                    tx_id=unique_tx_id,
                    department=entry.dept,
                    event_type=entry.event,
                    details=details,
                    status="VERIFIED",
                    integrity_hash=integrity_hash,
                )
                db.add(record)
                await db.commit()
    except Exception as e:
        print(f"Warning: DB audit_ledger insert failed: {e}")
        try:
            if db:
                await db.rollback()
        except Exception:
            pass

    await _save_supabase(payload)

    return LedgerEntryResponse(
        tx_id=unique_tx_id,
        department=entry.dept,
        event_type=entry.event,
        details=details,
        status="VERIFIED",
        integrity_hash=integrity_hash,
        created_at=timestamp,
    )


@router.get("/ledger", response_model=List[LedgerEntryResponse])
async def get_ledger_entries(db: AsyncSession = Depends(get_db)):
    """Retrieves all audit ledger entries ordered by most recent first."""
    try:
        if db is not None:
            result = await db.execute(
                select(AuditLedger).order_by(AuditLedger.created_at.desc()).limit(500)
            )
            rows = result.scalars().all()
            if rows:
                return [
                    LedgerEntryResponse(
                        tx_id=r.tx_id,
                        department=r.department,
                        event_type=r.event_type,
                        details=r.details or {},
                        status=r.status or "VERIFIED",
                        integrity_hash=r.integrity_hash,
                        created_at=str(r.created_at or "")[:19].replace("T", " "),
                    )
                    for r in rows
                ]
    except Exception as e:
        print(f"Warning: DB audit_ledger fetch failed: {e}")

    return await _fetch_supabase()
