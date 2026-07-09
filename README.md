<div align="center">

# 🏛️ Government AI Copilot Service Portal

### An intelligent, multilingual conversational platform for citizen services and government workflow automation

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Orchestration-1C3C3C?style=for-the-badge)](https://www.langchain.com/langgraph)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](#)

*Bridging citizens and government services through AI-powered conversation, retrieval, and automated verification.*

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#️-key-features)
- [Tech Stack](#️-tech-stack)
- [System Architecture](#-system-architecture--workflow-design)
- [RAG Pipeline](#-retrieval-augmented-generation-rag-pipeline)
- [Database Schema](#️-database-schema-design)
- [Security & Governance](#-security--governance)
- [Installation & Setup](#-installation--local-setup)
- [Running Tests](#-running-tests)

---

## 🌐 Overview

The **Government AI Copilot Service Portal** is a production-grade conversational platform built to help citizens access government services, check policy eligibility, and manage applications — while giving government officers a dedicated workstation to review, process, and verify submissions with OCR assistance. Every action in the system is recorded in a cryptographic audit ledger for complete accountability.

---

## 🏛️ Key Features

| Feature | Description |
|---|---|
| 🗣️ **Multilingual Citizen Interface** | Real-time conversational support across **12 Indian languages** — Hindi, Telugu, Tamil, Punjabi, Gujarati, Bengali, Marathi, Kannada, Malayalam, Urdu, Odia, and English — with automatic query detection and response translation. |
| 🔍 **Intelligent RAG & Hybrid Retrieval** | Combines semantic vector search (`pgvector` HNSW indexes) with keyword-based PostgreSQL Full-Text Search (FTS), merged using Reciprocal Rank Fusion (RRF). |
| 🧠 **LangGraph Orchestrated Workflow** | A robust multi-agent state machine that dynamically routes queries based on RAG confidence, web-search fallback, intent classification, eligibility requirements, and self-correcting validation. |
| 🗂️ **Officer Workstation & OCR Verification** | A dashboard for government reviewers featuring automated document OCR verification, metadata validation, physical review waivers, and application status updates. |
| 🔐 **Cryptographic Audit Ledger** | Immutable audit logging — every system action, intent, and approval is stored in a ledger secured by SHA-256 integrity hashes. |
| 🛡️ **Enterprise-Grade Security** | Input sanitization, prompt injection detection, rate-limiting, and PII safeguarding (e.g., masked Aadhaar numbers). |

---

## ⚙️ Tech Stack

### Backend
| Component | Technology |
|---|---|
| Framework | FastAPI (Python 3.10+) |
| Orchestration | LangGraph & LangChain (StateGraph workflows) |
| LLM & Embeddings | Local Ollama (`qwen3.5:latest`) or OpenAI API-compatible |
| Database | PostgreSQL + `pgvector` extension |
| ORM | SQLAlchemy (Asyncio) |
| Testing | Pytest & Pytest-asyncio |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 19 (Vite, JavaScript) |
| Styling | Custom Vanilla CSS — glassmorphism, responsive grids, dynamic hover feedback, dark mode |
| Internationalization | `i18next` & `react-i18next` |

---

## 📐 System Architecture & Workflow Design

The core backend uses a **LangGraph StateGraph** multi-agent workflow to process inquiries securely, perform fact retrieval, evaluate eligibility, generate answers, and validate them.

```mermaid
graph TD
    Start([User Query Input]) --> LangNode[Language Agent]
    LangNode --> IntentNode[Intent Agent]
    IntentNode --> RAGNode[RAG Agent]

    RAGNode --> Router1{RAG Confidence < Threshold\nOR Intent = Latest Updates?}

    Router1 -- Yes --> WebNode[Internet Search Agent]
    WebNode --> FusionNode[Context Fusion Agent]
    Router1 -- No --> FusionNode

    FusionNode --> Router2{Needs Eligibility Check?}

    Router2 -- Yes --> EligNode[Eligibility Agent]
    EligNode --> GenNode[Generator Agent]
    Router2 -- No --> GenNode

    GenNode --> ValNode[Validator Agent]

    ValNode --> Router3{Validation Failed\nAND Retry < 2?}
    Router3 -- Yes --> GenNode
    Router3 -- No --> SaveDB[Audit & Memory Persistence]

    SaveDB --> Output([Final Translated Response])
```

### Agent Nodes Detail

| # | Agent | Responsibility |
|---|---|---|
| 1 | **Language Agent** (`language_node`) | Detects the user's input language and coordinates translation so internal processing happens in English, with results translated back. |
| 2 | **Intent Agent** (`intent_node`) | Classifies queries into categories — General Policy Info, Service Request Status, Eligibility Verification, Latest News. |
| 3 | **RAG Agent** (`rag_node`) | Performs hybrid querying on the vector store. |
| 4 | **Confidence Router** (`confidence_router`) | Evaluates if the database has sufficient context; routes to web search if confidence falls below the default threshold of `0.70`. |
| 5 | **Internet Search Agent** (`internet_node`) | Queries Tavily/Google Search (falling back to DuckDuckGo without API keys) for up-to-date information. |
| 6 | **Context Fusion Agent** (`fusion_node`) | Merges DB context chunks and search findings, compiling citations and removing overlaps. |
| 7 | **Eligibility Agent** (`eligibility_node`) | Compares citizen attributes (age, location, income) against policy rules to qualify or disqualify applicants. |
| 8 | **Generator Agent** (`generator_node`) | Crafts a polished response draft using only verified context facts. |
| 9 | **Validator Agent** (`validator_node`) | Self-corrects responses — verifies facts, flags hallucinations, checks security constraints, and triggers regeneration when needed. |

---

## 🔍 Retrieval-Augmented Generation (RAG) Pipeline

The system is optimized for high accuracy and fast retrieval:

```
[Uploaded Document]
        │
        ▼
[Semantic Chunking]  (falls back to paragraph parsing / OCR)
        │
        ▼
[Ollama / OpenAI Embeddings]  (qwen3.5, 1536-dim vectors)
        │
        ▼
[Postgres pgvector (HNSW Index)]  &  [FTS English Index]
```

### 1. Ingestion & Chunking
- Documents are processed via semantic chunking to keep sentences of the same topic together.
- Embeddings are generated via an OpenAI-compatible embedding API (e.g., `qwen3.5:latest` or `text-embedding-3-small`), producing 1536-dimensional vectors.

### 2. Hybrid Retrieval
When a query arrives, a concurrent fetch pulls top candidates from:

1. **Vector Search** — cosine distance over `document_chunks` using a high-performance **HNSW (Hierarchical Navigable Small World)** index.
2. **Keyword FTS** — PostgreSQL's native Full-Text Search via `to_tsvector` and `plainto_tsquery`.

Both candidate lists are merged using **Reciprocal Rank Fusion (RRF)**:

$$\text{RRF Score} = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

*(where $k = 60$, and $r_m(d)$ is the rank of document $d$ in system $m$)*

### 3. Latency-Optimized Reranking
Rather than invoking a heavy secondary LLM reranking prompt (saving 3–4 seconds of API latency), the pipeline retrieves top RRF candidates directly — delivering optimal reference content fast.

---

## 🗄️ Database Schema Design

The centralized schema lives at `schema.sql` and defines:

1. **Extensions** — `uuid-ossp` for primary key generation, `vector` for semantic embeddings, `pgcrypto` for ledger hashing.
2. **Documents & Chunks**
   - `documents` — document metadata (department, filename, type, version)
   - `document_chunks` — text content, metadata JSONB, `embedding VECTOR(1536)`
3. **Conversation Memory**
   - `chat_history` — session-aware chat records with confidence, queries, translations, responses, and citation arrays
4. **Audit Logs**
   - `audit_ledger` — cryptographically verified ledger with unique `tx_id` and SHA-256 integrity hashes
5. **Citizens & Applications**
   - `citizens` — core profile table with verified state and masked Aadhaar numbers
   - `service_requests` — application records with form structures, uploaded documents, status, and officer assignments
   - `officer_tasks` — internal officer task queue
   - `officer_dashboard_tasks` — task items for mock case assessments in the Officer Workstation app

### Row Level Security (RLS) & Indexes

- **RLS policies** are defined across all tables to restrict data mutations.
- **HNSW Index** on `document_chunks.embedding` using cosine distance:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON document_chunks USING hnsw (embedding vector_cosine_ops);
  ```
- **GIN Indexes** on JSONB fields (`meta_data`, `form_data`) for fast queries on unstructured properties.

---

## 🔒 Security & Governance

- **Prompt Jailbreak Check** — `SecurityService` enforces safety rules to identify jailbreak prompts, block adversarial injection attempts, and prevent leaking of system prompt variables.
- **Masked Auditing & PII Protection** — input query strings are sanitized, and sensitive identifiers (e.g., Aadhaar numbers) are masked to `XXXXXXXX1234` format.
- **Ledger Verification** — every transaction is cryptographically signed via a SHA-256 hash of the compiled event payload, dynamically compared to prevent tampering.

---

## 🚀 Installation & Local Setup

### Prerequisites

- **Python 3.10+**
- **Node.js (v18+)**
- **PostgreSQL 15+** with the **pgvector** extension installed
- **Ollama** running locally with `qwen3.5:latest` or your configured models

### 1. Database Initialization

Create a PostgreSQL database and execute the schema:

```bash
psql -U postgres -d your_database -f schema.sql
```

> Alternatively, use the Vite-configured Supabase project specified in your `.env` parameters.

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv destiny

# Windows
.\destiny\Scripts\activate

# macOS / Linux
source destiny/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Copy `.env.example` to `.env` (root or backend folder) and configure:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/postgres
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=qwen3.5:latest
EMBEDDING_MODEL=qwen3.5:latest
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

📄 Swagger docs available at: **http://localhost:8000/api/docs**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

🌐 Portal available at: **http://localhost:5173**

---

## 🧪 Running Tests

Run the backend verification suite (config parsing, agent graph compilation, ORM schemas, translation APIs):

```bash
cd backend
pytest
```

---

<div align="center">

**Built for citizens. Designed for accountability.**

</div>