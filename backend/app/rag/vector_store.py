from typing import List, Tuple, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import DocumentChunk, Document
from app.rag.embeddings import embedding_service

class VectorStore:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def add_chunks(self, chunks: List[DocumentChunk]) -> None:
        """Saves document chunks to pgvector store."""
        self.session.add_all(chunks)
        await self.session.flush()

    async def similarity_search(
        self,
        query: str,
        limit: int = 6,
        department: Optional[str] = None,
        document_type: Optional[str] = None
    ) -> List[Tuple[DocumentChunk, float]]:
        """Queries pgvector database using cosine similarity."""
        query_vector = await embedding_service.get_embedding(query)
        
        # Using pgvector's cosine distance operator (represented as <=> in pgvector/sqlalchemy)
        # Cosine distance = 1 - Cosine similarity.
        # So Similarity = 1 - Cosine Distance
        distance = DocumentChunk.embedding.cosine_distance(query_vector)
        similarity = (1.0 - distance).label("similarity")
        
        stmt = select(DocumentChunk, similarity)
        
        # Apply filters (joining Document table if metadata filters are active)
        if department or document_type:
            stmt = stmt.join(Document, DocumentChunk.document_id == Document.id)
            filters = []
            if department:
                filters.append(Document.department == department)
            if document_type:
                filters.append(Document.document_type == document_type)
            stmt = stmt.where(and_(*filters))
            
        stmt = stmt.order_by(distance.asc()).limit(limit)
        
        result = await self.session.execute(stmt)
        return [(row[0], float(row[1])) for row in result.all()]
