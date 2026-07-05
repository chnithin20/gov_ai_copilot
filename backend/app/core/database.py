import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Connection arguments (SSL config if connecting to Supabase)
connect_args = {}
if "supabase.co" in settings.DATABASE_URL:
    # Force SSL for Supabase connections
    connect_args["ssl"] = "require"

engine = create_async_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    future=True
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    try:
        async with async_session_maker() as session:
            try:
                await asyncio.wait_for(session.connection(), timeout=1.5)
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    except Exception as e:
        print(f"Warning: Database session unavailable (running in degraded mode): {e}")
        yield None
