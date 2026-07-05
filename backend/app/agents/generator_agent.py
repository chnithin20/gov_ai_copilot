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
        """Node execution: Validates the generated answer against references to block hallucinations."""
        raw_response = state.get("raw_response", "")
        fused_context = state.get("fused_context", "")
        retry_count = state.get("retry_count", 0)
        
        is_valid = True
        error_msg = None
        
        if not self.client:
            return {"error": None}  # Skip validation if LLM client is unavailable
            
        try:
            prompt = f"""You are the Output Validation Agent for a Government AI Portal.
Verify if the generated response is strictly grounded in the official context.

Official Context:
{fused_context}

Generated Response:
{raw_response}

Rules:
1. Ensure the response does not make claims that are not in the official context.
2. Ensure the response does not reference unofficial external links.
3. If valid, reply only with: VALID
4. If invalid, reply with: INVALID: [reason]

Validation Verdict:"""
            
            response = await self.client.chat.completions.create(
                # model="gpt-4o-mini",  # OpenAI version
                model=settings.LLM_MODEL,  # Ollama Qwen model
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=300
            )
            result = response.choices[0].message.content.strip()
            if "<think>" in result and "</think>" in result:
                result = result.split("</think>")[-1].strip()
            if result.startswith("INVALID") and retry_count < 2:
                is_valid = False
                error_msg = result
        except Exception as e:
            print(f"Validation execution warning: {e}")
            
        if not is_valid:
            return {
                "error": error_msg,
                "retry_count": retry_count + 1
            }
        else:
            return {
                "error": None
            }

generator_agent = GeneratorAgent()
validator_agent = ValidatorAgent()
