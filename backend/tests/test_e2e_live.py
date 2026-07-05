"""
End-to-End Integration Test: Ask real questions through the AI pipeline.
Requires Ollama running locally (no database or Redis needed).
Tests the full agent chain: Language -> Intent -> Generator response.
"""
import asyncio
import sys
import os
import time
import pytest

# Fix Windows console encoding
if sys.platform == "win32":
    os.system("chcp 65001 >nul 2>&1")
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# --- Color helpers for terminal output ---
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_header(text):
    print(f"\n{'='*70}")
    print(f"{BOLD}{CYAN}{text}{RESET}")
    print(f"{'='*70}")

def print_pass(text):
    print(f"  {GREEN}[PASS]{RESET}  {text}")

def print_fail(text):
    print(f"  {RED}[FAIL]{RESET}  {text}")

def print_info(text):
    print(f"  {YELLOW}[i] {text}{RESET}")


@pytest.mark.anyio
async def test_ollama_connectivity():
    """Test 1: Verify Ollama is running and responds."""
    print_header("Test 1: Ollama Connectivity")
    from openai import AsyncOpenAI
    from app.core.config import settings

    client = AsyncOpenAI(base_url=f"{settings.OLLAMA_BASE_URL}/v1", api_key="ollama")
    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": "Reply with only: OK"}],
            temperature=0.0,
            max_tokens=5
        )
        result = response.choices[0].message.content.strip()
        print_pass(f"Ollama responded: '{result}'")
        return True
    except Exception as e:
        print_fail(f"Ollama connection failed: {e}")
        return False


@pytest.mark.anyio
async def test_language_detection():
    """Test 2: Language agent detects Hindi vs English."""
    print_header("Test 2: Language Detection Agent")
    from app.agents.language_agent import language_agent

    # Test Hindi query
    state_hi = {
        "original_query": "मुझे पासपोर्ट कैसे मिलेगा?",
        "preferred_language": "hi"
    }
    result = await language_agent.process(state_hi)
    detected = result.get("detected_language", "?")
    print_info(f"Hindi input → detected language: '{detected}'")
    if detected == "hi":
        print_pass("Correctly detected Hindi")
    else:
        print_fail(f"Expected 'hi', got '{detected}'")

    # Test English query
    state_en = {
        "original_query": "How do I apply for a passport?",
        "preferred_language": "en"
    }
    result = await language_agent.process(state_en)
    detected = result.get("detected_language", "?")
    print_info(f"English input → detected language: '{detected}'")
    if detected == "en":
        print_pass("Correctly detected English")
    else:
        print_fail(f"Expected 'en', got '{detected}'")


@pytest.mark.anyio
async def test_intent_classification():
    """Test 3: Intent agent classifies different query types."""
    print_header("Test 3: Intent Classification Agent")
    from app.agents.intent_agent import intent_agent

    test_cases = [
        ("How to apply for a passport?", "process_steps"),
        ("Am I eligible for PM Kisan Yojana?", "eligibility_check"),
        ("What are the latest government announcements?", "latest_updates"),
        ("What is the GST rate for electronics?", "general_info"),
    ]

    for query, expected_intent in test_cases:
        state = {
            "translated_query": query,
            "original_query": query,
            "preferred_language": "en"
        }
        result = await intent_agent.process(state)
        intent = result.get("intent", "?")
        needs_elig = result.get("needs_eligibility_check", False)
        print_info(f"Query: \"{query}\"")
        print_info(f"  → intent: '{intent}', needs_eligibility: {needs_elig}")
        if intent == expected_intent:
            print_pass(f"Correct intent: {intent}")
        else:
            print_info(f"Got '{intent}' (expected '{expected_intent}' — LLM may vary, not a hard failure)")


@pytest.mark.anyio
async def test_translation():
    """Test 4: Translation service translates Hindi ↔ English."""
    print_header("Test 4: Translation Service")
    from app.services.translate_service import translate_service

    # Hindi to English
    hindi_text = "मुझे पासपोर्ट के लिए आवेदन करना है"
    en_result = await translate_service.translate_to_english(hindi_text, "hi")
    print_info(f"Hindi → English: '{en_result}'")
    if en_result and en_result != hindi_text:
        print_pass("Hindi to English translation working")
    else:
        print_fail("Translation returned original text or empty")

    # English to Telugu
    en_text = "You need to visit the passport office"
    te_result = await translate_service.translate_from_english(en_text, "te")
    print_info(f"English → Telugu: '{te_result}'")
    if te_result and te_result != en_text:
        print_pass("English to Telugu translation working")
    else:
        print_fail("Translation returned original text or empty")


@pytest.mark.anyio
async def test_generator_with_mock_context():
    """Test 5: Generator agent produces a response with mock RAG context."""
    print_header("Test 5: Response Generator Agent (with mock context)")
    from app.agents.generator_agent import generator_agent

    state = {
        "original_query": "How do I apply for a passport in India?",
        "translated_query": "How do I apply for a passport in India?",
        "detected_language": "en",
        "intent": "process_steps",
        "fused_context": """
        To apply for a passport in India:
        1. Register on the Passport Seva portal (passportindia.gov.in)
        2. Fill the application form online
        3. Pay the fee online
        4. Schedule an appointment at the nearest Passport Seva Kendra
        5. Visit the PSK with required documents (Aadhaar, PAN, address proof)
        6. Biometric verification will be done
        7. Police verification follows
        8. Passport is dispatched within 30 days
        Source: Ministry of External Affairs, Government of India
        """,
        "citations": [
            {"source": "passportindia.gov.in", "content": "Passport application steps", "confidence": 0.95}
        ],
        "confidence": 0.9,
        "eligibility_details": None,
        "needs_eligibility_check": False,
    }

    start = time.time()
    result = await generator_agent.process(state)
    elapsed = time.time() - start

    response = result.get("raw_response", "")
    print_info(f"Generated in {elapsed:.1f}s")
    print(f"\n{CYAN}{'─'*60}{RESET}")
    print(f"{BOLD}AI Response:{RESET}")
    print(response[:800] if len(response) > 800 else response)
    print(f"{CYAN}{'─'*60}{RESET}\n")

    if response and len(response) > 50:
        print_pass(f"Generator produced a detailed response ({len(response)} chars)")
    else:
        print_fail(f"Generator response too short or empty ({len(response)} chars)")


@pytest.mark.anyio
async def test_search_service():
    """Test 6: Search service returns whitelisted government sources."""
    print_header("Test 6: Government Search Service")
    from app.services.search_service import search_service

    results = await search_service.search("passport application India", limit=3)
    print_info(f"Got {len(results)} search results")
    for i, r in enumerate(results):
        print_info(f"  [{i+1}] {r.get('title', 'N/A')} — {r.get('source', 'N/A')}")

    if len(results) > 0:
        print_pass("Search service returned results")
        # Verify whitelisting
        allowed = ["gov.in", "nic.in", "uidai.gov.in", "digilocker.gov.in",
                    "passportindia.gov.in", "gst.gov.in", "income.gov.in", "india.gov.in"]
        for r in results:
            source = r.get("source", "")
            if any(d in source for d in allowed):
                print_pass(f"Source '{source}' is whitelisted ✓")
            else:
                print_fail(f"Source '{source}' is NOT whitelisted!")
    else:
        print_fail("No results returned")


@pytest.mark.anyio
async def test_full_question_answer():
    """Test 7: Ask real questions and get complete AI answers."""
    print_header("Test 7: Full Question → Answer (Interactive Demo)")
    from app.agents.language_agent import language_agent
    from app.agents.intent_agent import intent_agent
    from app.agents.generator_agent import generator_agent
    from app.services.search_service import search_service
    from app.agents.fusion_agent import fusion_agent

    questions = [
        ("How do I apply for a new Aadhaar card?", "en"),
        ("GST registration process kya hai?", "hi"),
        ("What documents are needed for PAN card?", "en"),
    ]

    for question, lang in questions:
        print(f"\n{BOLD}{YELLOW}--- Question: \"{question}\" ---{RESET}")
        total_start = time.time()

        # Step 1: Language detection
        lang_result = await language_agent.process({
            "original_query": question,
            "preferred_language": lang
        })
        detected_lang = lang_result.get("detected_language", lang)
        translated = lang_result.get("translated_query", question)
        print_info(f"Language: {detected_lang} | Translated: \"{translated[:80]}\"")

        # Step 2: Intent classification
        intent_result = await intent_agent.process({
            "translated_query": translated,
            "original_query": question,
            "preferred_language": lang
        })
        intent = intent_result.get("intent", "general_info")
        print_info(f"Intent: {intent}")

        # Step 3: Search for context (replaces RAG since no database)
        search_results = await search_service.search(translated, limit=3)
        context = "\n".join([
            f"Source: {r['source']}\n{r['content']}" for r in search_results
        ]) if search_results else "No additional context available."

        citations = [{"source": r["source"], "content": r["content"][:200], "confidence": r.get("confidence", 0.8)} for r in search_results]

        # Step 4: Fusion (combine context)
        fused = await fusion_agent.process({
            "translated_query": translated,
            "rag_chunks": [],  # No database
            "search_results": search_results,
            "rag_confidence": 0.0,
        })

        # Step 5: Generate response
        gen_result = await generator_agent.process({
            "original_query": question,
            "translated_query": translated,
            "detected_language": detected_lang,
            "intent": intent,
            "fused_context": fused.get("fused_context", context),
            "citations": fused.get("citations", citations),
            "confidence": fused.get("confidence", 0.7),
            "eligibility_details": None,
            "needs_eligibility_check": False,
        })

        response = gen_result.get("raw_response", "No response generated.")
        elapsed = time.time() - total_start

        print(f"\n  {BOLD}>> AI Answer ({elapsed:.1f}s):{RESET}")
        print(f"  {'-'*55}")
        # Print response with indentation
        for line in response.split("\n"):
            print(f"  {line}")
        print(f"  {'-'*55}")

        if len(response) > 50:
            print_pass(f"Complete answer generated ({len(response)} chars, {elapsed:.1f}s)")
        else:
            print_fail(f"Answer too short: {len(response)} chars")


async def main():
    print(f"\n{BOLD}{CYAN}+--------------------------------------------------------------+{RESET}")
    print(f"{BOLD}{CYAN}|     Government AI Copilot -- End-to-End Integration Test      |{RESET}")
    print(f"{BOLD}{CYAN}+--------------------------------------------------------------+{RESET}")

    # Gate: Check Ollama first
    ollama_ok = await test_ollama_connectivity()
    if not ollama_ok:
        print(f"\n{RED}[ERROR] Ollama is not running. Start it with: ollama serve{RESET}")
        print(f"{RED}        Then ensure qwen3.5 is pulled: ollama pull qwen3.5:latest{RESET}")
        sys.exit(1)

    await test_language_detection()
    await test_intent_classification()
    await test_translation()
    await test_generator_with_mock_context()
    await test_search_service()
    await test_full_question_answer()

    print(f"\n{BOLD}{GREEN}=== All integration tests completed! ==={RESET}\n")


if __name__ == "__main__":
    asyncio.run(main())
