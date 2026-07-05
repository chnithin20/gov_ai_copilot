from app.services.search_service import search_service

class InternetAgent:
    async def process(self, state: dict) -> dict:
        """Node execution: Searches official whitelisted domains if triggered."""
        query = state.get("translated_query", "")
        
        # Execute official site-search filtering
        results = await search_service.search(query, limit=3)
        
        return {
            "search_results": results
        }

internet_agent = InternetAgent()
