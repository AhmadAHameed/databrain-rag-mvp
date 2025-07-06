from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_async_db
from app.services.generation import GenerationService
from app.utils.logging_setup import create_logger
from app.models.schemas.requests import GenerationRequest

router = APIRouter()
logger = create_logger(__name__)


class ContextSource(BaseModel):
    content: str = Field(..., description="The content of the source")
    score: float = Field(..., description="Relevance score of the source")
    metadata: Dict[str, Any] = Field(..., description="Source metadata")


class GenerationResponse(BaseModel):
    answer: str = Field(..., description="Generated answer text")
    contexts: List[ContextSource] = Field(..., description="Retrieved source contexts")
    query: str = Field(..., description="Original query")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "answer": "The generated response...",
                "contexts": [
                    {
                        "content": "Relevant context...",
                        "score": 0.95,
                        "metadata": {"source": "document1.pdf", "page": 1},
                    }
                ],
                "query": "What is...?",
            }
        }




@router.post(
    "/generate",
    summary="Generate LLM Response (SSE)",
    description="Generate a response using RAG (Retrieval Augmented Generation) with optional filtering",
)
async def generate_response(request: GenerationRequest):
    """
    Generate a response using RAG (Retrieval Augmented Generation)

    Args:
        request: The generation request containing query, filters, and parameters

    Returns:
        Generated response with answer and source contexts

    Raises:
        HTTPException: If generation fails or parameters are invalid
    """

    async def event_generator():
        generation_service = GenerationService()
        import json

        async for chunk in generation_service.generate_response_stream(
            query=request.query,
            num_chunks=request.num_chunks,
            additional_context=request.context,
            temperature=request.temperature,
            min_score=request.min_score,
            filters=request.filters,
        ):
            # chunk is a dict with type and content/contexts/query
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
