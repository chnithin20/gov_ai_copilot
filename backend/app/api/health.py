from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Verifies backend database connectivity."""
    overall_status = "healthy"
    db_status = "unreachable"

    # 1. Test database ping
    if db is not None:
        try:
            await db.execute(text("SELECT 1"))
            db_status = "healthy"
        except Exception as e:
            overall_status = "degraded"
            db_status = f"error: {str(e)}"
    else:
        overall_status = "degraded"
        db_status = "unreachable (degraded mode)"

    return {
        "status": overall_status,
        "database": db_status,
        "redis": "disabled (in-memory rate limiting active)",
        "cache": "in-memory (active)"
    }
