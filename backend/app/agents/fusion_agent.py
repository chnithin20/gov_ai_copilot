class FusionAgent:
    async def process(self, state: dict) -> dict:
        """Node execution: Combines RAG results and Web results, ranking by trust priority."""
        rag_chunks = state.get("rag_chunks", [])
        search_results = state.get("search_results", [])
        
        fused_parts = []
        citations = []
        seen_sources = set()
        
        # 1. Priority: Internal RAG Documents
        for chunk in rag_chunks:
            source = chunk.get("source", "Government Policy Document")
            content = chunk.get("content", "").strip()
            dept = chunk.get("department", "General")
            
            fused_parts.append(f"[Official Document: {source} (Department: {dept})]\n{content}")
            citations.append({
                "source": source,
                "content": content,
                "confidence": chunk.get("score", 0.95)
            })
            seen_sources.add(source)
            
        # 2. Priority: Whitelisted Web Search Results
        for item in search_results:
            source = item.get("source", "")
            title = item.get("title", "Official Webpage")
            content = item.get("content", "").strip()
            
            # Deduplicate by URL/Source
            if source in seen_sources:
                continue
                
            fused_parts.append(f"[Official Website: {title} ({source})]\n{content}")
            citations.append({
                "source": source,
                "content": content,
                "confidence": item.get("confidence", 0.85)
            })
            seen_sources.add(source)
            
        fused_context = "\n\n".join(fused_parts)
        if not fused_context.strip():
            fused_context = "No official references available for the query."
            
        # Calculate compound confidence score
        if citations:
            avg_confidence = sum([c["confidence"] for c in citations]) / len(citations)
        else:
            avg_confidence = 0.50
            
        return {
            "fused_context": fused_context,
            "citations": citations,
            "confidence": round(avg_confidence, 2)
        }

fusion_agent = FusionAgent()
