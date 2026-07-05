import time
from typing import Dict, Any
from fastapi import Request, HTTPException, status
from app.core.config import settings

# In-memory dictionary for sliding window rate limiting (per process scope)
IN_MEMORY_LIMITS: Dict[str, Dict[str, Any]] = {}

class SecurityService:
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Removes script tags and sanitizes input queries."""
        if not text:
            return ""
        # Basic tags sanitizer
        clean = text.replace("<", "&lt;").replace(">", "&gt;")
        return clean.strip()

    @staticmethod
    def detect_prompt_injection(query: str) -> bool:
        """Detects standard injection keywords, jailbreak patterns, and overrides."""
        keywords = [
            "ignore previous instructions", "ignore all instructions", "system prompt",
            "you are now", "act as a", "jailbreak", "dan mode", "developer mode",
            "override", "bypass rules", "drop table", "select * from", "<script>"
        ]
        low_query = query.lower()
        for kw in keywords:
            if kw in low_query:
                return True
        return False

    @staticmethod
    def check_rate_limit(client_ip: str) -> bool:
        """Rate limiting has been disabled per user request."""
        return True
