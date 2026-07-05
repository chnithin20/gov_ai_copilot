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
        """Reranks retrieved documents based on relevance to the query using an LLM."""
        if not chunks_with_scores:
            return []

        # If LLM client is unavailable or we only have 1 chunk, skip re-ranking
        if not self.client or len(chunks_with_scores) <= 1:
            return chunks_with_scores[:top_k]

        try:
            # Prepare snippets for the LLM
            snippets = []
            for idx, (chunk, _) in enumerate(chunks_with_scores):
                snippets.append({
                    "index": idx,
                    "text": chunk.content[:500]  # Pass a snippet preview to save tokens
                })

            prompt = f"""You are a Government Policy Analyst. Rank the following document snippets by their direct relevance to answering the user query.

User Query: "{query}"

Snippets to rank:
{json.dumps(snippets, indent=2)}

Respond with a raw JSON array of integers containing the indices of the snippets, ordered from MOST relevant to LEAST relevant.
Example response format: [2, 0, 1]
Do not include any explanation or markdown formatting in your response.
"""
            response = await self.client.chat.completions.create(
                # model="gpt-4o-mini",  # OpenAI version
                model=settings.LLM_MODEL,  # Ollama Qwen model
                messages=[
                    {"role": "system", "content": "You are a precise ranking assistant that outputs only raw JSON arrays of integers."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                max_tokens=400
            )

            content = response.choices[0].message.content.strip()
            if "<think>" in content and "</think>" in content:
                content = content.split("</think>")[-1].strip()
            if "[" in content and "]" in content:
                start_idx = content.find("[")
                end_idx = content.rfind("]") + 1
                content = content[start_idx:end_idx]
            elif content.startswith("```"):
                content = content.replace("```json", "").replace("```", "").strip()

            ranked_indices = json.loads(content)
            
            reranked = []
            seen = set()
            for idx in ranked_indices:
                if isinstance(idx, int) and 0 <= idx < len(chunks_with_scores):
                    if idx not in seen:
                        seen.add(idx)
                        reranked.append(chunks_with_scores[idx])

            # Safety fallback for any indices missed by LLM
            for idx, item in enumerate(chunks_with_scores):
                if idx not in seen:
                    reranked.append(item)

            return reranked[:top_k]

        except Exception as e:
            print(f"Reranker failed: {e}. Falling back to default similarity ranking.")
            return chunks_with_scores[:top_k]

reranker = Reranker()
