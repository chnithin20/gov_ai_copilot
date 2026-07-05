from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import httpx
import json

from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import OfficerDashboardTask

router = APIRouter()

class ApplicationModel(BaseModel):
    id: str
    name: str
    service: str
    timestamp: Optional[str] = ""
    status: Optional[str] = "Pending"
    language: Optional[str] = "English"
    fields: Optional[Dict[str, Any]] = Field(default_factory=dict)
    attachments: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    summary: Optional[str] = ""

class StatusUpdateRequest(BaseModel):
    status: str

def _app_to_payload(app_data: ApplicationModel) -> dict:
    fields = app_data.fields or {}
    if not isinstance(fields, dict):
        fields = {}
    attachments = app_data.attachments or []
    if not isinstance(attachments, list):
        attachments = []
        
    doc1_name, doc1_size, doc1_status = None, None, None
    doc2_name, doc2_size, doc2_status = None, None, None
    if len(attachments) > 0 and isinstance(attachments[0], dict):
        doc1_name = attachments[0].get("name")
        doc1_size = attachments[0].get("size")
        doc1_status = attachments[0].get("type") or "Verified"
    if len(attachments) > 1 and isinstance(attachments[1], dict):
        doc2_name = attachments[1].get("name")
        doc2_size = attachments[1].get("size")
        doc2_status = attachments[1].get("type") or "Verified"
        
    age_val = None
    if "Age" in fields:
        try:
            age_val = int(str(fields["Age"]).split()[0])
        except Exception:
            pass

    return {
        "case_id": app_data.id,
        "citizen_name": app_data.name or "Citizen",
        "service_name": app_data.service or "General Service",
        "language": app_data.language or "English",
        "status": app_data.status or "Pending",
        "full_name": fields.get("Full Name", app_data.name),
        "age": age_val,
        "document_number": fields.get("DL Number") or fields.get("Aadhaar Number") or fields.get("Pattadar ID") or fields.get("Document Number") or "DOC-1001",
        "office_authority": fields.get("Office Authority") or fields.get("District / Mandal") or fields.get("Update Selected") or "Government Authority",
        "document_hash": fields.get("Document Hashing") or "sha256:verified_hash_2026",
        "physical_verification": fields.get("Physical Verification") or "Verified",
        "document_1_name": doc1_name,
        "document_1_size": doc1_size,
        "document_1_status": doc1_status,
        "document_2_name": doc2_name,
        "document_2_size": doc2_size,
        "document_2_status": doc2_status,
        "assigned_officer": "officer"
    }

def _row_to_app(r: dict) -> ApplicationModel:
    fields = {}
    if r.get("full_name"):
        fields["Full Name"] = r.get("full_name")
    if r.get("age"):
        fields["Age"] = str(r.get("age"))
    if r.get("document_number"):
        fields["DL Number"] = r.get("document_number")
        fields["Document Number"] = r.get("document_number")
    if r.get("office_authority"):
        fields["Office Authority"] = r.get("office_authority")
    if r.get("document_hash"):
        fields["Document Hashing"] = r.get("document_hash")
    if r.get("physical_verification"):
        fields["Physical Verification"] = r.get("physical_verification")
        
    attachments = []
    if r.get("document_1_name"):
        attachments.append({
            "name": r.get("document_1_name"),
            "size": r.get("document_1_size") or "1 MB",
            "type": r.get("document_1_status") or "Verified"
        })
    if r.get("document_2_name"):
        attachments.append({
            "name": r.get("document_2_name"),
            "size": r.get("document_2_size") or "1 MB",
            "type": r.get("document_2_status") or "Verified"
        })
        
    ts_str = str(r.get("created_at") or r.get("updated_at") or "")[:19].replace('T', ' ')
    if not ts_str:
        ts_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        
    return ApplicationModel(
        id=r.get("case_id") or "",
        name=r.get("citizen_name") or "Citizen",
        service=r.get("service_name") or "Service Request",
        timestamp=ts_str,
        status=r.get("status") or "Pending",
        language=r.get("language") or "English",
        fields=fields,
        attachments=attachments,
        summary=f"Case {r.get('case_id')}: {r.get('service_name')} for {r.get('citizen_name')}. Authority: {r.get('office_authority') or 'Gov Desk'}."
    )

async def _save_supabase_rest(app_data: ApplicationModel):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return
    try:
        payload = _app_to_payload(app_data)
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/officer_dashboard_tasks?on_conflict=case_id",
                headers={
                    "Content-Type": "application/json",
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Prefer": "resolution=merge-duplicates,return=representation"
                },
                json=payload,
                timeout=5.0
            )
    except Exception as e:
        print(f"Warning: Supabase REST officer_dashboard_tasks saving failed: {e}")

async def _update_supabase_rest(app_id: str, new_status: str):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{settings.SUPABASE_URL}/rest/v1/officer_dashboard_tasks?case_id=eq.{app_id}",
                headers={
                    "Content-Type": "application/json",
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Prefer": "return=representation"
                },
                json={"status": new_status, "updated_at": datetime.utcnow().isoformat()},
                timeout=5.0
            )
    except Exception as e:
        print(f"Warning: Supabase REST officer_dashboard_tasks status update failed: {e}")

async def _get_supabase_rest() -> List[ApplicationModel]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return []
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/officer_dashboard_tasks?select=*&order=case_id.asc",
                headers={
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                },
                timeout=5.0
            )
            if res.status_code == 200:
                rows = res.json()
                return [_row_to_app(r) for r in rows if r.get("case_id")]
    except Exception as e:
        print(f"Warning: Supabase REST officer_dashboard_tasks fetching failed: {e}")
    return []

@router.get("/applications", response_model=List[ApplicationModel])
async def get_applications(db: AsyncSession = Depends(get_db)):
    """Retrieves all service applications from officer_dashboard_tasks table in DB or Supabase REST fallback."""
    try:
        if db is None:
            return await _get_supabase_rest()
        result = await db.execute(select(OfficerDashboardTask).order_by(OfficerDashboardTask.case_id.asc()))
        tasks = result.scalars().all()
        if not tasks:
            rest_apps = await _get_supabase_rest()
            if rest_apps:
                return rest_apps
            return []
        
        apps = []
        for t in tasks:
            r_dict = {
                "case_id": t.case_id,
                "citizen_name": t.citizen_name,
                "service_name": t.service_name,
                "language": t.language,
                "status": t.status,
                "full_name": t.full_name,
                "age": t.age,
                "document_number": t.document_number,
                "office_authority": t.office_authority,
                "document_hash": t.document_hash,
                "physical_verification": t.physical_verification,
                "document_1_name": t.document_1_name,
                "document_1_size": t.document_1_size,
                "document_1_status": t.document_1_status,
                "document_2_name": t.document_2_name,
                "document_2_size": t.document_2_size,
                "document_2_status": t.document_2_status,
                "created_at": str(t.created_at or "")
            }
            apps.append(_row_to_app(r_dict))
        return apps
    except Exception as e:
        print(f"Warning: Failed to retrieve officer dashboard tasks from database: {e}")
        return await _get_supabase_rest()

@router.post("/applications", response_model=ApplicationModel)
async def create_or_update_application(app_data: ApplicationModel, db: AsyncSession = Depends(get_db)):
    """Stores a new or updated application into officer_dashboard_tasks table in DB and Supabase."""
    try:
        if db is None:
            await _save_supabase_rest(app_data)
            return app_data
        
        result = await db.execute(select(OfficerDashboardTask).where(OfficerDashboardTask.case_id == app_data.id))
        existing = result.scalars().first()
        payload = _app_to_payload(app_data)
        
        if existing:
            existing.citizen_name = payload["citizen_name"]
            existing.service_name = payload["service_name"]
            existing.language = payload["language"]
            existing.status = payload["status"]
            existing.full_name = payload["full_name"]
            existing.age = payload["age"]
            existing.document_number = payload["document_number"]
            existing.office_authority = payload["office_authority"]
            existing.document_hash = payload["document_hash"]
            existing.physical_verification = payload["physical_verification"]
            existing.document_1_name = payload["document_1_name"]
            existing.document_1_size = payload["document_1_size"]
            existing.document_1_status = payload["document_1_status"]
            existing.document_2_name = payload["document_2_name"]
            existing.document_2_size = payload["document_2_size"]
            existing.document_2_status = payload["document_2_status"]
            await db.commit()
            await db.refresh(existing)
        else:
            new_task = OfficerDashboardTask(**payload)
            db.add(new_task)
            await db.commit()
            await db.refresh(new_task)
            
        await _save_supabase_rest(app_data)
        return app_data
    except Exception as e:
        print(f"Warning: Failed to save officer task in database: {e}")
        try:
            if db:
                await db.rollback()
        except Exception:
            pass
        await _save_supabase_rest(app_data)
        return app_data

@router.put("/applications/{app_id}/status", response_model=ApplicationModel)
async def update_application_status(app_id: str, req: StatusUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Updates the status of an officer task in the database and Supabase."""
    try:
        await _update_supabase_rest(app_id, req.status)
        if db is None:
            return ApplicationModel(id=app_id, name="Updated", service="Updated", status=req.status)
            
        result = await db.execute(select(OfficerDashboardTask).where(OfficerDashboardTask.case_id == app_id))
        existing = result.scalars().first()
        if existing:
            existing.status = req.status
            await db.commit()
            await db.refresh(existing)
            
            r_dict = {
                "case_id": existing.case_id,
                "citizen_name": existing.citizen_name,
                "service_name": existing.service_name,
                "language": existing.language,
                "status": existing.status,
                "full_name": existing.full_name,
                "age": existing.age,
                "document_number": existing.document_number,
                "office_authority": existing.office_authority,
                "document_hash": existing.document_hash,
                "physical_verification": existing.physical_verification,
                "document_1_name": existing.document_1_name,
                "document_1_size": existing.document_1_size,
                "document_1_status": existing.document_1_status,
                "document_2_name": existing.document_2_name,
                "document_2_size": existing.document_2_size,
                "document_2_status": existing.document_2_status,
                "created_at": str(existing.created_at or "")
            }
            return _row_to_app(r_dict)
        else:
            return ApplicationModel(id=app_id, name="Citizen", service="General", status=req.status)
    except Exception as e:
        print(f"Warning: Failed to update status in database: {e}")
        try:
            if db:
                await db.rollback()
        except Exception:
            pass
        return ApplicationModel(id=app_id, name="Citizen", service="General", status=req.status)
