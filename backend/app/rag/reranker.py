import json
from typing import List, Tuple
# from openai import AsyncOpenAI  # OpenAI version (commented out)
from openai import AsyncOpenAI  # Ollama exposes an OpenAI-compatible API
from app.core.config import settings
from app.models.schemas import DocumentChunk

class Reranker:
    def __init__(self):
        # --- OpenAI version (commented out) ---
        # self.api_key = settings.OPENAI_API_KEY
        # if self.api_key and self.api_key != "mock-openai-key":
        #     self.client = AsyncOpenAI(api_key=self.api_key)
        # else:
        #     self.client = None
        
        # --- Ollama version (active) ---
        self.client = AsyncOpenAI(
            base_url=f"{settings.OLLAMA_BASE_URL}/v1",
            api_key="ollama"
        )

    async def rerank(
        self,
        query: str,
        chunks_with_scores: List[Tuple[DocumentChunk, float]],
        top_k: int = 3
    ) -> List[Tuple[DocumentChunk, float]]:
        """Returns top RRF hybrid search results immediately to eliminate slow LLM reranking latency."""
        if not chunks_with_scores:
            return []
            
        # The hybrid retriever already combines cosine vector distance and Postgres Full-Text Search (tsvector)
        # using Reciprocal Rank Fusion (RRF). Returning the top_k results directly eliminates an expensive
        # 3-4 second LLM API call while providing optimal document relevance for RAG.
        return chunks_with_scores[:top_k]

reranker = Reranker()
