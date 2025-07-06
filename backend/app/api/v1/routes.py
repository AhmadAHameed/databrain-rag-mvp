from fastapi import APIRouter
from app.api.v1.endpoints import (
    retrieval,
    generation,
    embeddings,
    users,
    health,
    mock,
    documents,
    chunks,
    pipeline,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chunks.router, prefix="/chunks", tags=["chunks"])
api_router.include_router(pipeline.router, prefix="/pipeline", tags=["pipeline"])

api_router.include_router(retrieval.router, prefix="/retrieval", tags=["retrieval"])
api_router.include_router(generation.router, prefix="/generation", tags=["generation"])
api_router.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(mock.router, prefix="", tags=["mock"])
