from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.schemas import Citizen, CitizenProfile

router = APIRouter()

@router.post("/register", response_model=CitizenProfile)
async def register_user(profile: CitizenProfile, db: AsyncSession = Depends(get_db)):
    """Stores a registered citizen into the Supabase database table."""
    try:
        if db is None:
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
        return profile
    except Exception as e:
        print(f"Warning: Failed to store user in database: {e}")
        try:
            if db:
                await db.rollback()
        except Exception:
            pass
        return profile

@router.get("/users", response_model=list[CitizenProfile])
async def get_registered_users(db: AsyncSession = Depends(get_db)):
    """Retrieves all registered citizens from the database."""
    try:
        if db is None:
            return []
        result = await db.execute(select(Citizen))
        citizens = result.scalars().all()
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
        return []
