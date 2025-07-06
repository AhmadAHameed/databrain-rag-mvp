
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from .config.app_config import get_app_settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
import logging
from typing import AsyncGenerator

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = get_app_settings().SQLALCHEMY_DATABASE_URL

# Configure the SQLAlchemy engine with connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,  # Number of permanent connections to keep
    max_overflow=10,  # Number of additional connections that can be created
    pool_timeout=30,  # Seconds to wait before giving up on getting a connection
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_pre_ping=True,  # Enable connection health checks
    echo=False  # Set to True for SQL query logging
)

# Create async engine for async operations
# Convert the sync URL to async URL by replacing postgresql:// with postgresql+asyncpg://
ASYNC_SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://')

async_engine = create_async_engine(
    ASYNC_SQLALCHEMY_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=False
)

# Configure async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Keep sync session factory for backward compatibility (marked as deprecated)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

Base = declarative_base()

# Add event listeners for connection pool events
@event.listens_for(async_engine.sync_engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    logger.info("New async connection established")

@event.listens_for(async_engine.sync_engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug("Async connection retrieved from pool")

# Deprecated: Use get_async_db instead
def get_db():
    """Deprecated: Use get_async_db() for better performance"""
    logger.warning("Using deprecated sync database connection")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Use this dependency for database operations"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()