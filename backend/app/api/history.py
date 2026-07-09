from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.models.schemas import ChatHistory

router = APIRouter()


class ChatHistoryResponse(BaseModel):
    session_id: str
    query: str
    response: str
    language: str = "en"
    confidence: float = 1.0
    citations: List[Any] = Field(default_factory=list)
    created_at: str


async def _fetch_supabase(session_id: str) -> List[ChatHistoryResponse]:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        return []
    try:
        async with httpx.AsyncClient() as client:
            url = (
                f"{settings.SUPABASE_URL}/rest/v1/chat_history"
                f"?session_id=eq.{session_id}&select=*&order=created_at.asc&limit=100"
            )
            res = await client.get(
                url,
                headers={
                    "apikey": settings.SUPABASE_KEY,
                    "Authorization": f"Bearer {settings.SUPABASE_KEY}",
                },
                timeout=5.0,
            )
            if res.status_code == 200:
                rows = res.json()
                return [
                    ChatHistoryResponse(
                        session_id=r.get("session_id", ""),
                        query=r.get("query", ""),
                        response=r.get("response", ""),
                        language=r.get("language", "en"),
                        confidence=r.get("confidence", 1.0),
                        citations=r.get("citations") or [],
                        created_at=str(r.get("created_at", ""))[:19].replace("T", " "),
                    )
                    for r in rows
                    if r.get("session_id")
                ]
    except Exception as e:
        print(f"Warning: Supabase chat_history fetch failed: {e}")
    return []


@router.get("/chat-history/{session_id}", response_model=List[ChatHistoryResponse])
async def get_chat_history(session_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves chat history for a given session from DB or Supabase."""
    try:
        if db is not None:
            result = await db.execute(
                select(ChatHistory)
                .where(ChatHistory.session_id == session_id)
                .order_by(ChatHistory.created_at.asc())
                .limit(100)
            )
            rows = result.scalars().all()
            if rows:
                return [
                    ChatHistoryResponse(
                        session_id=r.session_id,
                        query=r.query,
                        response=r.response,
                        language=r.language or "en",
                        confidence=r.confidence or 1.0,
                        citations=r.citations or [],
                        created_at=str(r.created_at or "")[:19].replace("T", " "),
                    )
                    for r in rows
                ]
    except Exception as e:
        print(f"Warning: DB chat_history fetch failed: {e}")

    return await _fetch_supabase(session_id)
