from app.core.database import async_session_maker
from app.rag.retriever import HybridRetriever
from app.rag.reranker import reranker

class RAGAgent:
    async def process(self, state: dict) -> dict:
        """Node execution: Performs hybrid search and LLM reranking."""
        query = state.get("translated_query", "")
        
        formatted_chunks = []
        rag_confidence = 0.0
        
        try:
            async with async_session_maker() as session:
                retriever = HybridRetriever(session)
                
                # 1. Perform combined Vector & Full-Text Search
                candidates = await retriever.retrieve(query, limit=6)
                
                # 2. Re-rank results using LLM
                reranked = await reranker.rerank(query, candidates, top_k=3)
                
            # Compute dynamic RAG confidence (average similarity score of top results)
            if reranked:
                rag_confidence = sum([score for _, score in reranked]) / len(reranked)
            else:
                rag_confidence = 0.0
                
            # Format database models into transportable dictionaries for state serialization
            for chunk, score in reranked:
                formatted_chunks.append({
                    "content": chunk.content,
                    "source": chunk.meta_data.get("source", "Official Document"),
                    "department": chunk.meta_data.get("department", "General"),
                    "document_type": chunk.meta_data.get("document_type", "Policy"),
                    "score": score
                })
        except Exception as e:
            print(f"Warning: RAGAgent database search failed: {e}. Falling back to empty RAG chunks.")
            
        return {
            "rag_chunks": formatted_chunks,
            "rag_confidence": rag_confidence
        }

rag_agent = RAGAgent()
