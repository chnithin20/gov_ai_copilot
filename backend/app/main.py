from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app.api import chat, upload, health, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes extension modules and database tables on startup."""
    try:
        async with engine.begin() as conn:
            # Pre-requisite: Enable pgvector extension in Supabase/PostgreSQL schema
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            # Execute schema creation if tables don't exist
            await conn.run_sync(Base.metadata.create_all)
        print("Database connection and schema initialization successful.")
    except Exception as e:
        print(f"Warning: Database connection failed during startup: {e}")
        print("Backend will run with degraded capability (database audits and vector store will be unavailable).")
    yield

app = FastAPI(
    title="Government AI Copilot Backend",
    version="1.0.0",
    description="Backend API powering the Government AI Copilot interface",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API namespaces
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(upload.router, prefix="/api", tags=["Ingestion"])
app.include_router(health.router, prefix="/api", tags=["Monitoring"])

@app.get("/")
async def root():
    return {"status": "running", "service": "Government AI Copilot Backend"}
