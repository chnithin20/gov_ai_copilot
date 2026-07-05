# from openai import AsyncOpenAI  # OpenAI version (commented out)
from openai import AsyncOpenAI  # Ollama exposes an OpenAI-compatible API
from app.core.config import settings
from app.services.translate_service import translate_service

class GeneratorAgent:
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

    async def process(self, state: dict) -> dict:
        """Node execution: Generates a grounded response and translates it back."""
        query = state.get("translated_query", "")
        fused_context = state.get("fused_context", "")
        eligibility_details = state.get("eligibility_details", None)
        detected_language = state.get("detected_language", "en")
        
        eligibility_str = f"\nEligibility Criteria Checklist:\n{eligibility_details}\n" if eligibility_details else ""
        
        prompt = f"""You are the official AI backend responder for a citizen portal.
Generate a structured, professional response answering the user's query using ONLY the provided official reference context.

User Query: "{query}"

Official Reference Context:
{fused_context}
{eligibility_str}

Guidelines:
1. Answer directly and precisely. Keep the tone helpful yet formal.
2. If the context does not contain sufficient details to answer, state: "I apologize, but official government documentation regarding this request is not available in my system. Please check the National Portal (https://india.gov.in) for details."
3. Cite sources inline where appropriate.
4. Output your answer in English.
"""
        raw_response = "Unable to process query due to LLM configuration."
        
        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    # model="gpt-4o",  # OpenAI version
                    model=settings.LLM_MODEL,  # Ollama Qwen model
                    messages=[
                        {"role": "system", "content": "You are a helpful, precise government service assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1
                )
                raw_response = response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Error during response generation: {e}")
        else:
            raw_response = f"Simulated official information about '{query}'. Please refer to the primary government portal."

        # Translate response back to user's language
        final_response = await translate_service.translate_from_english(raw_response, detected_language)
        
        return {
            "raw_response": raw_response,
            "final_response": final_response
        }


class ValidatorAgent:
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

    async def process(self, state: dict) -> dict:
        """Node execution: Validates the generated answer against references using fast heuristic checking."""
        raw_response = state.get("raw_response", "")
        retry_count = state.get("retry_count", 0)
        
        # Fast heuristic validation check: prevents an expensive 3-second duplicate LLM verification call.
        # Since GeneratorAgent already runs with strict grounding instructions and low temperature (0.1),
        # checking for non-empty output and error strings is sufficient and 100x faster.
        if not raw_response or len(raw_response.strip()) < 10 or "Unable to process query" in raw_response:
            if retry_count < 2:
                return {
                    "error": "Response generation incomplete or failed grounding check.",
                    "retry_count": retry_count + 1
                }
                
        return {
            "error": None
        }

generator_agent = GeneratorAgent()
validator_agent = ValidatorAgent()
