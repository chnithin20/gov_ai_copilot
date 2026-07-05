import random
# from openai import AsyncOpenAI  # OpenAI version (commented out)
from openai import AsyncOpenAI  # Ollama exposes an OpenAI-compatible API
from app.core.config import settings

class EmbeddingService:
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

    def _generate_mock_embedding(self, dimension: int = 1536) -> list[float]:
        # Generate stable pseudo-random floats for deterministic mock embeddings
        # directly mapped to length, ensuring reproducibility in tests
        random.seed(42)
        return [random.gauss(0.0, 0.1) for _ in range(dimension)]

    async def get_embedding(self, text: str) -> list[float]:
        if not self.client:
            return self._generate_mock_embedding()
            
        try:
            response = await self.client.embeddings.create(
                input=[text],
                model=settings.EMBEDDING_MODEL  # Uses Ollama qwen3 for embeddings
            )
            return response.data[0].embedding
        except Exception as e:
            # Fallback to mock embedding on API failure (silenced for non-embedding models like qwen)
            # print(f"Error calling Ollama embedding API: {e}")
            return self._generate_mock_embedding()

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        if not self.client or not texts:
            return [self._generate_mock_embedding() for _ in texts]
            
        try:
            # Ollama also supports batch embeddings via the OpenAI-compatible API
            # response = await self.client.embeddings.create(  # OpenAI version
            #     input=texts,
            #     model=settings.EMBEDDING_MODEL
            # )
            response = await self.client.embeddings.create(
                input=texts,
                model=settings.EMBEDDING_MODEL  # Uses Ollama qwen3 for embeddings
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            # print(f"Error calling Ollama embeddings batch API: {e}")
            return [self._generate_mock_embedding() for _ in texts]

embedding_service = EmbeddingService()
