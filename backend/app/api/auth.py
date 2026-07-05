from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import Citizen, CitizenProfile

router = APIRouter()

async def _save_supabase_rest(profile: CitizenProfile):
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.SUPABASE_URL}/rest/v1/citizens",
                headers={
                    "Content-Type": "application/json",
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                    "Prefer": "return=representation"
                },
                json={
                    "username": profile.username,
                    "full_name": profile.full_name,
                    "phone": profile.phone or "+91-0000000000",
                    "email": profile.email or f"{profile.username}@citizen.gov.in",
                    "preferred_language": profile.preferred_language or "en",
                    "aadhaar_masked": profile.aadhaar_masked or "XXXXXXXX1234"
                },
                timeout=5.0
            )
    except Exception as e:
        print(f"Warning: Supabase REST saving failed: {e}")

async def _get_supabase_rest() -> list[CitizenProfile]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return []
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{settings.SUPABASE_URL}/rest/v1/citizens?select=*",
                headers={
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}"
                },
                timeout=5.0
            )
            if res.status_code == 200:
                citizens_data = res.json()
                return [
                    CitizenProfile(
                        username=c.get("username", ""),
                        full_name=c.get("full_name", ""),
                        phone=c.get("phone"),
                        email=c.get("email"),
                        preferred_language=c.get("preferred_language", "en"),
                        aadhaar_masked=c.get("aadhaar_masked"),
                        is_verified=c.get("is_verified", True)
                    ) for c in citizens_data if c.get("username")
                ]
    except Exception as e:
        print(f"Warning: Supabase REST fetching failed: {e}")
    return []

@router.post("/register", response_model=CitizenProfile)
async def register_user(profile: CitizenProfile, db: AsyncSession = Depends(get_db)):
    """Stores a registered citizen into the Supabase database table."""
    try:
        if db is None:
            await _save_supabase_rest(profile)
            return profile
        
        # Check if username already exists
        result = await db.execute(select(Citizen).where(Citizen.username == profile.username))
        existing = result.scalars().first()
        if existing:
            # Update existing record if needed
            existing.full_name = profile.full_name
            if profile.phone:
                existing.phone = profile.phone
            if profile.email:
                existing.email = profile.email
            if profile.aadhaar_masked:
                existing.aadhaar_masked = profile.aadhaar_masked
            await db.commit()
            await _save_supabase_rest(profile)
            return profile
            
        citizen_db = Citizen(
            username=profile.username,
            full_name=profile.full_name,
            phone=profile.phone or "+91-0000000000",
            email=profile.email or f"{profile.username}@citizen.gov.in",
            preferred_language=profile.preferred_language or "en",
            aadhaar_masked=profile.aadhaar_masked or "XXXXXXXX1234",
            is_verified=profile.is_verified
        )
        db.add(citizen_db)
        await db.commit()
        await db.refresh(citizen_db)
        await _save_supabase_rest(profile)
        return profile
    except Exception as e:
        print(f"Warning: Failed to store user in database: {e}")
        try:
            if db:
                await db.rollback()
        except Exception:
            pass
        await _save_supabase_rest(profile)
        return profile

@router.get("/users", response_model=list[CitizenProfile])
async def get_registered_users(db: AsyncSession = Depends(get_db)):
    """Retrieves all registered citizens from the database."""
    try:
        if db is None:
            return await _get_supabase_rest()
        result = await db.execute(select(Citizen))
        citizens = result.scalars().all()
        if not citizens:
            return await _get_supabase_rest()
        return [
            CitizenProfile(
                username=c.username,
                full_name=c.full_name,
                phone=c.phone,
                email=c.email,
                preferred_language=c.preferred_language or "en",
                aadhaar_masked=c.aadhaar_masked,
                is_verified=c.is_verified
            ) for c in citizens
        ]
    except Exception as e:
        print(f"Warning: Failed to retrieve users from database: {e}")
        return await _get_supabase_rest()
