import urllib.parse
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Any
from app.core.config import settings

class SearchService:
    def __init__(self):
        self.tavily_key = settings.TAVILY_API_KEY
        self.allowed_domains = settings.ALLOWED_DOMAINS

    async def search(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Searches only trusted government websites using site filters."""
        # Restrict queries to whitelisted domains
        site_filters = " OR ".join([f"site:{domain}" for domain in self.allowed_domains])
        full_query = f"({site_filters}) {query}"
        
        # 1. Try Tavily Search API if key is available
        if self.tavily_key and self.tavily_key != "mock-tavily-key":
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://api.tavily.com/search",
                        json={
                            "api_key": self.tavily_key,
                            "query": full_query,
                            "search_depth": "basic",
                            "max_results": limit
                        },
                        timeout=5.0
                    )
                    if response.status_code == 200:
                        data = response.json()
                        results = []
                        for item in data.get("results", []):
                            url = item.get("url", "")
                            # Security Check: Ensure domain is in whitelisted set
                            if any(domain in url for domain in self.allowed_domains):
                                results.append({
                                    "source": url,
                                    "title": item.get("title", ""),
                                    "content": item.get("content", ""),
                                    "confidence": 0.90
                                })
                        if results:
                            return results[:limit]
            except Exception as e:
                print(f"Tavily search warning: {e}. Falling back to DuckDuckGo scrapers.")

        # 2. Try DuckDuckGo HTML Scraper as a free, API-keyless fallback
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
            }
            encoded_query = urllib.parse.quote_plus(full_query)
            url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, timeout=6.0)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    results = []
                    
                    for div in soup.find_all("div", class_="result"):
                        url_a = div.find("a", class_="result__url")
                        snippet_a = div.find("a", class_="result__snippet")
                        if url_a and snippet_a:
                            title = url_a.get_text().strip()
                            href = url_a.get("href", "")
                            
                            # Parse actual target URL out of DDG redirect URL parameters if needed
                            actual_url = href
                            if "uddg=" in href:
                                parsed = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
                                if "uddg" in parsed:
                                    actual_url = parsed["uddg"][0]
                                    
                            # Security Check: Confirm site whitelist
                            if any(domain in actual_url for domain in self.allowed_domains):
                                results.append({
                                    "source": actual_url,
                                    "title": title,
                                    "content": snippet_a.get_text().strip(),
                                    "confidence": 0.85
                                })
                    if results:
                        return results[:limit]
        except Exception as e:
            print(f"DuckDuckGo search scraper warning: {e}")

        # 3. Final resilient static fallback if network requests fail / offline mode
        return self._generate_fallback_results(query)

    def _generate_fallback_results(self, query: str) -> List[Dict[str, Any]]:
        """Constructs a contextually relevant trusted official link fallback."""
        low_query = query.lower()
        mock_mapping = {
            "passport": ("https://passportindia.gov.in/", "Passport Seva - Ministry of External Affairs"),
            "aadhaar": ("https://uidai.gov.in/", "UIDAI - Unique Identification Authority of India"),
            "uidai": ("https://uidai.gov.in/", "UIDAI - Unique Identification Authority of India"),
            "pan": ("https://www.incometax.gov.in/", "Income Tax Department - PAN Services"),
            "tax": ("https://www.incometax.gov.in/", "Income Tax Department - Government of India"),
            "gst": ("https://www.gst.gov.in/", "Goods and Services Tax Council"),
            "digilocker": ("https://www.digilocker.gov.in/", "DigiLocker - Cloud Document Storage Portal")
        }

        source_url = "https://india.gov.in/"
        source_title = "National Portal of India"

        for key, (url, title) in mock_mapping.items():
            if key in low_query:
                source_url = url
                source_title = title
                break

        return [{
            "source": source_url,
            "title": source_title,
            "content": f"Official guidelines and notifications matching request context: '{query}'. Citizens are advised to verify details directly on the primary department portal.",
            "confidence": 0.75
        }]

search_service = SearchService()
