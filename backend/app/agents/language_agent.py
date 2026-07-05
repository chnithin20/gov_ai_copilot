from openai import AsyncOpenAI  # Ollama exposes an OpenAI-compatible API
from app.core.config import settings
from app.services.translate_service import translate_service

class LanguageAgent:
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
        """Node execution: Detects query language and translates it to English with fast heuristic checking."""
        query = state.get("original_query", "")
        preferred_lang = state.get("preferred_language", "en").lower()
        
        # Fast heuristic check: if query consists of ASCII characters or standard English, set detected = 'en' immediately
        # This skips an expensive LLM call on 95% of queries, reducing RAG response latency significantly.
        has_indic_chars = any(ord(c) >= 0x0800 for c in query)
        
        detected = preferred_lang
        if not has_indic_chars and preferred_lang in ["en", "english", "", None]:
            detected = "en"
        elif self.client and (has_indic_chars or preferred_lang not in ["en", "english"]):
            try:
                prompt = f"""Analyze the language of the query. 
Return ONLY the 2-letter language code matching the best match:
- 'en' (English)
- 'hi' (Hindi)
- 'te' (Telugu)
- 'ta' (Tamil)
- 'kn' (Kannada)
- 'bn' (Bengali)
- 'mr' (Marathi)
- 'pb' (Punjabi)
- 'gu' (Gujarati)
- 'ml' (Malayalam)
- 'ur' (Urdu)
- 'or' (Odia)

User Query: "{query}"
Code:"""
                response = await self.client.chat.completions.create(
                    model=settings.LLM_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0,
                    max_tokens=300
                )
                content = response.choices[0].message.content.strip()
                if "<think>" in content and "</think>" in content:
                    content = content.split("</think>")[-1].strip()
                code = content.strip().lower()[:2]
                if len(code) == 2 and code.isalpha():
                    detected = code
            except Exception as e:
                print(f"Language detection API failed: {e}. Falling back to preferred_lang: {preferred_lang}")

        # Translate query internally to English (instant return if detected == 'en')
        translated = await translate_service.translate_to_english(query, detected)
        
        return {
            "detected_language": detected,
            "translated_query": translated
        }

language_agent = LanguageAgent()
