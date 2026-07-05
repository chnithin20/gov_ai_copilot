import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import Document, DocumentChunk
from app.rag.chunking import DocumentChunker
from app.rag.embeddings import embedding_service
from app.rag.vector_store import VectorStore

class IngestionService:
    @staticmethod
    async def ingest_document(
        session: AsyncSession,
        file_bytes: bytes,
        filename: str,
        department: Optional[str] = None,
        document_type: Optional[str] = None,
        meta_data: Optional[Dict[str, Any]] = None
    ) -> Document:
        """Parses, chunks, embeds, and stores a document and its chunks in the database."""
        if meta_data is None:
            meta_data = {}

        # 1. Extract text using the document chunker parser
        text_content = DocumentChunker.parse_document(file_bytes, filename)
        
        # 2. Chunk text
        chunks = DocumentChunker.split_text(text_content)
        if not chunks:
            chunks = [f"No readable content extracted from document: {filename}"]

        # 3. Create document record
        document_id = uuid.uuid4()
        doc = Document(
            id=document_id,
            filename=filename,
            department=department,
            document_type=document_type,
            uploaded_at=datetime.utcnow(),
            version=1,
            meta_data=meta_data
        )
        session.add(doc)
        await session.flush()  # Populates relational ID

        # 4. Batch generate embeddings for performance
        embeddings = await embedding_service.get_embeddings(chunks)

        # 5. Create chunk models
        chunk_models = []
        for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_models.append(
                DocumentChunk(
                    id=uuid.uuid4(),
                    document_id=document_id,
                    chunk_index=i,
                    content=chunk_text,
                    embedding=embedding,
                    meta_data={
                        "source": filename,
                        "department": department,
                        "document_type": document_type,
                        **meta_data
                    }
                )
            )

        # 6. Save chunks
        vector_store = VectorStore(session)
        await vector_store.add_chunks(chunk_models)
        await session.commit()

        return doc
