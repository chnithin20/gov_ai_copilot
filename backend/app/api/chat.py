from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import SecurityService
from app.models.schemas import ChatRequest, ChatResponse, CitationInfo, ChatHistory
from app.workflows.government_graph import app_graph

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: Request, body: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Executes the AI orchestration workflow on the user's message query."""
    # 1. Rate Limiting Check
    client_ip = request.client.host if request.client else "unknown"
    if not SecurityService.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please slow down requests."
        )

    # 2. Sanitize inputs
    sanitized_message = SecurityService.sanitize_input(body.message)
    if not sanitized_message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query message cannot be empty."
        )

    # 3. Prevent Jailbreaking/Injections
    if SecurityService.detect_prompt_injection(sanitized_message):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security Alert: Potential prompt injection or system override detected."
        )

    # 4. Execute LangGraph workflow
    inputs = {
        "session_id": body.session_id,
        "original_query": sanitized_message,
        "preferred_language": body.language,
        "retry_count": 0,
        "error": None
    }
    
    try:
        results = await app_graph.ainvoke(inputs)
    except Exception as e:
        print(f"Workflow execution failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to orchestrate workflow agent nodes: {str(e)}"
        )

    # 5. Process outputs
    response_text = results.get("final_response", "Failed to generate response.")
    citations_raw = results.get("citations", [])
    confidence = results.get("confidence", 0.50)
    
    citations = []
    sources = set()
    
    for citation in citations_raw:
        source_name = citation.get("source", "Official Portal")
        citations.append(
            CitationInfo(
                source=source_name,
                content=citation.get("content", ""),
                confidence=citation.get("confidence", 0.90),
                page=None
            )
        )
        sources.add(source_name)

    # 6. Save interaction to database for audit logging & memory retention
    if db is not None:
        try:
            history = ChatHistory(
                session_id=body.session_id,
                query=sanitized_message,
                translated_query=results.get("translated_query"),
                response=response_text,
                citations=citations_raw,
                confidence=confidence,
                language=results.get("detected_language", "en")
            )
            db.add(history)
            await db.commit()
        except Exception as db_err:
            print(f"Warning: Failed to save chat history to database: {db_err}")
            try:
                await db.rollback()
            except Exception:
                pass

    return ChatResponse(
        response=response_text,
        citations=citations,
        confidence=confidence,
        sources=list(sources)
    )
