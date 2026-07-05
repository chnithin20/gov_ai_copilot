from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, START, END

from app.core.config import settings
from app.agents.language_agent import language_agent
from app.agents.intent_agent import intent_agent
from app.agents.rag_agent import rag_agent
from app.agents.internet_agent import internet_agent
from app.agents.fusion_agent import fusion_agent
from app.agents.eligibility_agent import eligibility_agent
from app.agents.generator_agent import generator_agent, validator_agent

class GraphState(TypedDict):
    session_id: str
    original_query: str
    preferred_language: str
    
    detected_language: str
    translated_query: str
    intent: str
    needs_eligibility_check: bool
    
    rag_chunks: List[Dict[str, Any]]
    rag_confidence: float
    search_results: List[Dict[str, Any]]
    
    fused_context: str
    citations: List[Dict[str, Any]]
    confidence: float
    
    eligibility_details: Optional[str]
    
    raw_response: str
    final_response: str
    
    retry_count: int
    error: Optional[str]

# ==========================================
# Graph Nodes
# ==========================================

async def language_node(state: GraphState) -> Dict[str, Any]:
    return await language_agent.process(state)

async def intent_node(state: GraphState) -> Dict[str, Any]:
    return await intent_agent.process(state)

async def rag_node(state: GraphState) -> Dict[str, Any]:
    return await rag_agent.process(state)

async def internet_node(state: GraphState) -> Dict[str, Any]:
    return await internet_agent.process(state)

async def fusion_node(state: GraphState) -> Dict[str, Any]:
    return await fusion_agent.process(state)

async def eligibility_node(state: GraphState) -> Dict[str, Any]:
    return await eligibility_agent.process(state)

async def generator_node(state: GraphState) -> Dict[str, Any]:
    return await generator_agent.process(state)

async def validator_node(state: GraphState) -> Dict[str, Any]:
    return await validator_agent.process(state)

# ==========================================
# Routing Logic
# ==========================================

def confidence_router(state: GraphState) -> str:
    """Decides if official web search is required to fill knowledge gaps."""
    intent = state.get("intent", "general_info")
    rag_confidence = state.get("rag_confidence", 0.0)
    threshold = settings.RAG_CONFIDENCE_THRESHOLD
    
    # Trigger search if RAG confidence falls below threshold or user wants recent updates
    if intent == "latest_updates" or rag_confidence < threshold:
        return "internet_node"
    return "fusion_node"

def eligibility_router(state: GraphState) -> str:
    """Branches workflow for scheme/policy qualification assessments."""
    if state.get("needs_eligibility_check", False):
        return "eligibility_node"
    return "generator_node"

def validation_router(state: GraphState) -> str:
    """Implements fallback loops if hallucinations are detected during validation."""
    error = state.get("error")
    retry_count = state.get("retry_count", 0)
    
    if error and retry_count < 2:
        return "generator_node"
    return END

# ==========================================
# Build LangGraph State Machine
# ==========================================

builder = StateGraph(GraphState)

builder.add_node("language_node", language_node)
builder.add_node("intent_node", intent_node)
builder.add_node("rag_node", rag_node)
builder.add_node("internet_node", internet_node)
builder.add_node("fusion_node", fusion_node)
builder.add_node("eligibility_node", eligibility_node)
builder.add_node("generator_node", generator_node)
builder.add_node("validator_node", validator_node)

# Flow definitions
builder.add_edge(START, "language_node")
builder.add_edge("language_node", "intent_node")
builder.add_edge("intent_node", "rag_node")

# Dynamic confidence routing
builder.add_conditional_edges(
    "rag_node",
    confidence_router,
    {
        "internet_node": "internet_node",
        "fusion_node": "fusion_node"
    }
)

builder.add_edge("internet_node", "fusion_node")

# Dynamic eligibility assessment routing
builder.add_conditional_edges(
    "fusion_node",
    eligibility_router,
    {
        "eligibility_node": "eligibility_node",
        "generator_node": "generator_node"
    }
)

builder.add_edge("eligibility_node", "generator_node")
builder.add_edge("generator_node", "validator_node")

# Safety validation feedback routing
builder.add_conditional_edges(
    "validator_node",
    validation_router,
    {
        "generator_node": "generator_node",
        END: END
    }
)

app_graph = builder.compile()
