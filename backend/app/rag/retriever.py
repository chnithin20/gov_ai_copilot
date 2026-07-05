from typing import List, Tuple, Optional
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import DocumentChunk, Document
from app.rag.vector_store import VectorStore

class HybridRetriever:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.vector_store = VectorStore(session)

    async def fts_search(
        self,
        query: str,
        limit: int = 6,
        department: Optional[str] = None,
        document_type: Optional[str] = None
    ) -> List[Tuple[DocumentChunk, float]]:
        """Queries the database using PostgreSQL's native Full Text Search (FTS)."""
        # Clean the query slightly for standard FTS parsing
        cleaned_words = [w for w in query.split() if w.isalnum()]
        cleaned_query = " ".join(cleaned_words) if cleaned_words else query

        ts_vector = func.to_tsvector('english', DocumentChunk.content)
        ts_query = func.plainto_tsquery('english', cleaned_query)
        rank = func.ts_rank(ts_vector, ts_query).label("rank")

        stmt = select(DocumentChunk, rank).where(ts_vector.op("@@")(ts_query))

        if department or document_type:
            stmt = stmt.join(Document, DocumentChunk.document_id == Document.id)
            filters = []
            if department:
                filters.append(Document.department == department)
            if document_type:
                filters.append(Document.document_type == document_type)
            stmt = stmt.where(and_(*filters))

        stmt = stmt.order_by(rank.desc()).limit(limit)
        
        try:
            result = await self.session.execute(stmt)
            return [(row[0], float(row[1])) for row in result.all()]
        except Exception as e:
            # Safe fallback if tsquery execution fails (e.g. syntax)
            print(f"Postgres FTS search execution warning: {e}")
            return []

    async def retrieve(
        self,
        query: str,
        limit: int = 5,
        department: Optional[str] = None,
        document_type: Optional[str] = None
    ) -> List[Tuple[DocumentChunk, float]]:
        """Hybrid search combining Vector Search and FTS using Reciprocal Rank Fusion (RRF)."""
        # Fetch vector candidate list
        vector_candidates = await self.vector_store.similarity_search(
            query=query, limit=limit * 2, department=department, document_type=document_type
        )
        
        # Fetch keyword FTS candidate list
        fts_candidates = await self.fts_search(
            query=query, limit=limit * 2, department=department, document_type=document_type
        )

        # RRF logic: constant k is standard set to 60
        k = 60
        rrf_scores = {}
        chunk_map = {}

        for rank, (chunk, similarity) in enumerate(vector_candidates):
            cid = chunk.id
            chunk_map[cid] = (chunk, similarity)
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (k + rank + 1))

        for rank, (chunk, rank_score) in enumerate(fts_candidates):
            cid = chunk.id
            if cid not in chunk_map:
                # Default similarity score if only found in FTS
                chunk_map[cid] = (chunk, 0.5)
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (k + rank + 1))

        # Sort candidates by combined RRF score descending
        sorted_cids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)

        final_chunks = []
        for cid in sorted_cids[:limit]:
            chunk, similarity = chunk_map[cid]
            final_chunks.append((chunk, similarity))

        return final_chunks
