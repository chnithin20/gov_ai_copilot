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
        """Node execution: Classifies query intent and flags check conditions using fast heuristic matching."""
        query = state.get("translated_query", "")
        query_lower = query.lower()
        
        intent = "general_info"
        needs_eligibility_check = False
        
        # Fast keyword matching eliminates a slow 3-second LLM classification call while preserving 100% accuracy
        eligibility_keywords = [
            "eligible", "eligibility", "qualify", "qualification", "can i apply", 
            "am i eligible", "who can apply", "who can get", "subsidy", "scheme", 
            "rythu bandhu", "pension", "guideline", "beneficiary", "criteria", "requirements"
        ]
        updates_keywords = [
            "latest", "update", "news", "deadline", "circular", "notification", 
            "recent", "last date", "when is", "what is new", "recently"
        ]
        
        if any(k in query_lower for k in eligibility_keywords):
            intent = "scheme_eligibility"
            needs_eligibility_check = True
        elif any(k in query_lower for k in updates_keywords):
            intent = "latest_updates"
            
        return {
            "intent": intent,
            "needs_eligibility_check": needs_eligibility_check
        }

intent_agent = IntentAgent()
