# from openai import AsyncOpenAI  # OpenAI version (commented out)
from openai import AsyncOpenAI  # Ollama exposes an OpenAI-compatible API
from app.core.config import settings

class TranslationService:
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
            
        self.lang_map = {
            "en": "English",
            "hi": "Hindi",
            "te": "Telugu",
            "ta": "Tamil",
            "kn": "Kannada",
            "bn": "Bengali",
            "mr": "Marathi",
            "pb": "Punjabi",
            "pa": "Punjabi",
            "gu": "Gujarati",
            "ml": "Malayalam",
            "ur": "Urdu",
            "or": "Odia"
        }

    async def translate_to_english(self, text: str, source_lang_code: str) -> str:
        """Translates regional language input to English for pipeline processing."""
        code = source_lang_code.lower()
        if code == "en" or code not in self.lang_map:
            return text
            
        if not self.client:
            return f"[Translated to English]: {text}"

        try:
            lang_name = self.lang_map[code]
            prompt = f"Translate the following text from {lang_name} to English. Maintain numeric values, dates, and names exactly. Provide only the translation.\n\nText: {text}"
            response = await self.client.chat.completions.create(
                # model="gpt-4o-mini",  # OpenAI version
                model=settings.LLM_MODEL,  # Ollama Qwen model
                messages=[
                    {"role": "system", "content": "You are a precise multilingual translator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                max_tokens=400
            )
            content = response.choices[0].message.content.strip()
            if "<think>" in content and "</think>" in content:
                content = content.split("</think>")[-1].strip()
            return content
        except Exception as e:
            print(f"Error during English translation: {e}")
            return text

    async def translate_from_english(self, text: str, target_lang_code: str) -> str:
        """Translates finalized English response to the target citizen language."""
        code = target_lang_code.lower()
        if code == "en" or code not in self.lang_map:
            return text

        if not self.client:
            return f"[Translated to {self.lang_map.get(code)}]: {text}"

        try:
            lang_name = self.lang_map[code]
            prompt = f"Translate the following English response to {lang_name}. Make it natural, polite, and ensure all formatting like bullet points or markdown references are kept intact.\n\nText: {text}"
            response = await self.client.chat.completions.create(
                # model="gpt-4o-mini",  # OpenAI version
                model=settings.LLM_MODEL,  # Ollama Qwen model
                messages=[
                    {"role": "system", "content": "You are an official government correspondence translator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=400
            )
            content = response.choices[0].message.content.strip()
            if "<think>" in content and "</think>" in content:
                content = content.split("</think>")[-1].strip()
            return content
        except Exception as e:
            print(f"Error during regional translation: {e}")
            return text

translate_service = TranslationService()
