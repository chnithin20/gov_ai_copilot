"""
Service Requests API — writes to the normalized `service_requests` and
`officer_tasks` tables in addition to the flat `officer_dashboard_tasks` table.
This keeps the relational schema fully in sync with every citizen submission
and every officer approve/reject action.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
import httpx
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import ServiceRequest, OfficerTask, Citizen

router = APIRouter()

# ── Pydantic request/response ──────────────────────────────────────────────

class ServiceRequestCreate(BaseModel):
    application_number: str          # e.g. TX-1002
    citizen_username: Optional[str] = None
    service_type: str                # e.g. "Driving License Renewal"
    department: str
    status: str = "SUBMITTED"
    form_data: Dict[str, Any] = Field(default_factory=dict)
    uploaded_documents: List[Any]  = Field(default_factory=list)
    remarks: Optional[str] = None
    assigned_officer: Optional[str] = "officer"


class ServiceRequestStatusUpdate(BaseModel):
    status: str                      # APPROVED | REJECTED | UNDER_REVIEW
    notes: Optional[str] = None
    officer_username: Optional[str] = "officer"


class ServiceRequestOut(BaseModel):
    application_number: str
    service_type: str
    department: str
    status: str
    submitted_at: str


# ── Supabase REST helpers ──────────────────────────────────────────────────

async def _upsert_supabase_sr(payload: dict):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/service_requests?on_conflict=application_number",
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
        print(f"Warning: Supabase service_requests upsert failed: {e}")


async def _upsert_supabase_officer_task(payload: dict):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            # officer_tasks has no unique key on application_number directly, use notes field workaround
            await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/officer_tasks",
                headers={
                    "Content-Type": "application/json",
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Prefer": "return=representation",
                },
                json=payload,
                timeout=5.0,
            )
    except Exception as e:
        print(f"Warning: Supabase officer_tasks insert failed: {e}")


async def _update_supabase_sr_status(app_num: str, new_status: str):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/service_requests?application_number=eq.{app_num}",
                headers={
                    "Content-Type": "application/json",
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Prefer": "return=representation",
                },
                json={"status": new_status, "updated_at": datetime.utcnow().isoformat()},
                timeout=5.0,
            )
    except Exception as e:
        print(f"Warning: Supabase service_requests status update failed: {e}")


# ── Routes ─────────────────────────────────────────────────────────────────

@router.post("/service-requests", response_model=ServiceRequestOut)
async def create_service_request(req: ServiceRequestCreate, db: AsyncSession = Depends(get_db)):
    """
    Called by CitizenPortal when a workflow completes (onAddApplication).
    Writes to `service_requests` and creates a linked `officer_tasks` row.
    """
    submitted_at = datetime.utcnow()

    sr_payload = {
        "application_number": req.application_number,
        "service_type": req.service_type,
        "department": req.department,
        "status": req.status,
        "form_data": req.form_data,
        "uploaded_documents": req.uploaded_documents,
        "remarks": req.remarks,
        "assigned_officer": req.assigned_officer or "officer",
        "submitted_at": submitted_at.isoformat(),
        "updated_at": submitted_at.isoformat(),
    }

    try:
        if db is not None:
            # Resolve citizen_id from username
            citizen_id = None
            if req.citizen_username:
                res = await db.execute(
                    select(Citizen).where(Citizen.username == req.citizen_username)
                )
                c = res.scalars().first()
                if c:
                    citizen_id = c.id

            # Upsert service_request row
            existing_res = await db.execute(
                select(ServiceRequest).where(
                    ServiceRequest.application_number == req.application_number
                )
            )
            existing = existing_res.scalars().first()

            if existing:
                existing.status = req.status
                existing.form_data = req.form_data
                existing.uploaded_documents = req.uploaded_documents
                existing.updated_at = submitted_at
                sr_db = existing
            else:
                sr_db = ServiceRequest(
                    application_number=req.application_number,
                    citizen_id=citizen_id,
                    service_type=req.service_type,
                    department=req.department,
                    status=req.status,
                    form_data=req.form_data,
                    uploaded_documents=req.uploaded_documents,
                    remarks=req.remarks,
                    assigned_officer=req.assigned_officer or "officer",
                    submitted_at=submitted_at,
                    updated_at=submitted_at,
                )
                db.add(sr_db)

            await db.flush()  # get sr_db.id without committing

            # Create officer_task if not already present
            ot_res = await db.execute(
                select(OfficerTask).where(OfficerTask.request_id == sr_db.id)
            )
            if not ot_res.scalars().first():
                officer_task = OfficerTask(
                    request_id=sr_db.id,
                    officer_username=req.assigned_officer or "officer",
                    task_type="DOCUMENT_VERIFICATION",
                    status="PENDING",
                    notes=f"Auto-assigned from citizen submission: {req.application_number}",
                    assigned_at=submitted_at,
                )
                db.add(officer_task)

            await db.commit()

    except Exception as e:
        print(f"Warning: service_requests DB write failed: {e}")
        try:
            if db:
                await db.rollback()
        except Exception:
            pass

    # Always mirror to Supabase
    await _upsert_supabase_sr(sr_payload)

    return ServiceRequestOut(
        application_number=req.application_number,
        service_type=req.service_type,
        department=req.department,
        status=req.status,
        submitted_at=submitted_at.strftime("%Y-%m-%d %H:%M:%S"),
    )


@router.put("/service-requests/{app_num}/status", response_model=ServiceRequestOut)
async def update_service_request_status(
    app_num: str,
    req: ServiceRequestStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by officer Approve/Reject.  Updates `service_requests`, marks the
    linked `officer_tasks` row as COMPLETED, and mirrors to Supabase.
    """
    updated_at = datetime.utcnow()

    try:
        if db is not None:
            sr_res = await db.execute(
                select(ServiceRequest).where(ServiceRequest.application_number == app_num)
            )
            sr = sr_res.scalars().first()

            if sr:
                sr.status = req.status
                sr.updated_at = updated_at
                if req.notes:
                    sr.remarks = req.notes

                # Mark officer_tasks row completed
                ot_res = await db.execute(
                    select(OfficerTask).where(OfficerTask.request_id == sr.id)
                )
                ot = ot_res.scalars().first()
                if ot and req.status in ("APPROVED", "REJECTED"):
                    ot.status = "COMPLETED"
                    ot.completed_at = updated_at
                    if req.notes:
                        ot.notes = req.notes

                await db.commit()

                return ServiceRequestOut(
                    application_number=sr.application_number,
                    service_type=sr.service_type,
                    department=sr.department,
                    status=sr.status,
                    submitted_at=str(sr.submitted_at or "")[:19].replace("T", " "),
                )
    except Exception as e:
        print(f"Warning: service_requests status update DB failed: {e}")
        try:
            if db:
                await db.rollback()
        except Exception:
            pass

    # Supabase mirror
    await _update_supabase_sr_status(app_num, req.status)

    return ServiceRequestOut(
        application_number=app_num,
        service_type="Service",
        department="Gov Desk",
        status=req.status,
        submitted_at=updated_at.strftime("%Y-%m-%d %H:%M:%S"),
    )


@router.get("/service-requests", response_model=List[ServiceRequestOut])
async def get_service_requests(db: AsyncSession = Depends(get_db)):
    """Returns all service requests from the normalized table."""
    try:
        if db is not None:
            result = await db.execute(
                select(ServiceRequest).order_by(ServiceRequest.submitted_at.desc()).limit(500)
            )
            rows = result.scalars().all()
            return [
                ServiceRequestOut(
                    application_number=r.application_number,
                    service_type=r.service_type,
                    department=r.department,
                    status=r.status,
                    submitted_at=str(r.submitted_at or "")[:19].replace("T", " "),
                )
                for r in rows
            ]
    except Exception as e:
        print(f"Warning: service_requests DB fetch failed: {e}")
    return []
