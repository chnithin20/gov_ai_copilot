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
        """Applies an in-memory sliding rate limit window based on settings."""
        limit = settings.RATE_LIMIT_PER_MINUTE
        
        now = time.time()
        # Evict expired IP tokens
        expired_ips = [ip for ip, info in IN_MEMORY_LIMITS.items() if now - info["start_time"] > 60]
        for ip in expired_ips:
            IN_MEMORY_LIMITS.pop(ip, None)
            
        if client_ip not in IN_MEMORY_LIMITS:
            IN_MEMORY_LIMITS[client_ip] = {"count": 1, "start_time": now}
            return True
            
        user_limit = IN_MEMORY_LIMITS[client_ip]
        if now - user_limit["start_time"] > 60:
            user_limit["count"] = 1
            user_limit["start_time"] = now
            return True
            
        if user_limit["count"] >= limit:
            return False
            
        user_limit["count"] += 1
        return True
