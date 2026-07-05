import json
# from openai import AsyncOpenAI  # OpenAI version (commented out)
from openai import AsyncOpenAI  # Ollama exposes an OpenAI-compatible API
from app.core.config import settings

class IntentAgent:
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
        """Node execution: Classifies query intent and flags check conditions."""
        query = state.get("translated_query", "")
        
        intent = "general_info"
        needs_eligibility_check = False
        
        if self.client:
            try:
                prompt = f"""You are the Intent Detection Agent of a Government Portal. 
Analyze the citizen's query and classify it:
1. 'general_info' - Standard questions about portals, forms, and procedures.
2. 'scheme_eligibility' - Citizen checking if they qualify for a subsidy, card, passport, or service.
3. 'latest_updates' - Inquiries about deadlines, notifications, new acts, or circular updates.

User Query: "{query}"

Output ONLY a JSON response:
{{
  "intent": "general_info" | "scheme_eligibility" | "latest_updates",
  "needs_eligibility_check": true | false
}}
"""
                response = await self.client.chat.completions.create(
                    # model="gpt-4o-mini",  # OpenAI version
                    model=settings.LLM_MODEL,  # Ollama Qwen model
                    messages=[
                        {"role": "system", "content": "You are a precise classifier that outputs raw JSON objects."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.0,
                    max_tokens=400
                )
                
                content = response.choices[0].message.content.strip()
                if "<think>" in content and "</think>" in content:
                    content = content.split("</think>")[-1].strip()
                if "{" in content and "}" in content:
                    start_idx = content.find("{")
                    end_idx = content.rfind("}") + 1
                    content = content[start_idx:end_idx]
                elif content.startswith("```"):
                    content = content.replace("```json", "").replace("```", "").strip()
                
                parsed = json.loads(content)
                intent = parsed.get("intent", "general_info")
                needs_eligibility_check = parsed.get("needs_eligibility_check", False) or (intent == "scheme_eligibility")
            except Exception as e:
                print(f"Intent Agent parsing exception: {e}. Defaulting to general_info.")


        return {
            "intent": intent,
            "needs_eligibility_check": needs_eligibility_check
        }

intent_agent = IntentAgent()
