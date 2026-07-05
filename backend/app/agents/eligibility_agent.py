# from openai import AsyncOpenAI  # OpenAI version (commented out)
from openai import AsyncOpenAI  # Ollama exposes an OpenAI-compatible API
from app.core.config import settings

class EligibilityAgent:
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
            api_key="ollama"  # Ollama doesn't need a real key
        )

    async def process(self, state: dict) -> dict:
        """Node execution: Evaluates scheme qualifications and requirements if applicable."""
        query = state.get("translated_query", "")
        fused_context = state.get("fused_context", "")
        needs_check = state.get("needs_eligibility_check", False)
        
        if not needs_check:
            return {"eligibility_details": None}
            
        eligibility_details = "Could not verify eligibility due to missing reference rules."
        if self.client:
            try:
                prompt = f"""You are the official Government Scheme Eligibility Agent.
Analyze the user's situation against the official documents provided.

Citizen Query: "{query}"

Official Reference Documents:
{fused_context}

Please generate a clear checklist assessment:
1. Requirements list (e.g., age, income, state residency, family status).
2. Required documents to apply.
3. Matching status: Confirm which criteria the user satisfies based on the query details, and what verification steps are required.
Keep it strictly factual. Do not assume or guess criteria not mentioned in the reference documents.
"""
                response = await self.client.chat.completions.create(
                    # model="gpt-4o",  # OpenAI version
                    model=settings.LLM_MODEL,  # Ollama Qwen model
                    messages=[
                        {"role": "system", "content": "You are a rigid rule-bound eligibility assessor."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.0
                )
                eligibility_details = response.choices[0].message.content.strip()
            except Exception as e:
                print(f"Eligibility Agent exception: {e}")
                
        return {
            "eligibility_details": eligibility_details
        }

eligibility_agent = EligibilityAgent()
