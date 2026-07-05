import pytest
from app.workflows.government_graph import app_graph
from app.services.translate_service import translate_service
from app.services.search_service import search_service

def test_graph_compilation():
    """Verify that the LangGraph orchestrator compiles without circular errors."""
    assert app_graph is not None
    # Check that nodes exist in the graph
    node_names = app_graph.nodes.keys()
    assert "language_node" in node_names
    assert "intent_node" in node_names
    assert "rag_node" in node_names
    assert "internet_node" in node_names
    assert "fusion_node" in node_names
    assert "eligibility_node" in node_names
    assert "generator_node" in node_names
    assert "validator_node" in node_names

@pytest.mark.asyncio
async def test_translation_mock():
    """Checks translation fallbacks in regional languages."""
    hi_trans = await translate_service.translate_to_english("नमस्ते", "hi")
    assert hi_trans is not None
    
    en_trans = await translate_service.translate_from_english("Hello", "hi")
    assert en_trans is not None

@pytest.mark.asyncio
async def test_search_whitelists():
    """Checks whitelisted search service domain queries."""
    results = await search_service.search("passport rules", limit=1)
    assert len(results) > 0
    # Ensure source domain is whitelisted
    source = results[0]["source"]
    allowed = ["gov.in", "nic.in", "uidai.gov.in", "digilocker.gov.in", "passportindia.gov.in", "gst.gov.in", "income.gov.in", "india.gov.in"]
    assert any(domain in source for domain in allowed)
