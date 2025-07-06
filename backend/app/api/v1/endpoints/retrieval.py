from pydantic import BaseModel
from datetime import date
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.models.schemas.requests import RetrievalRequest, DocumentFilter
from app.services.retrieval import RetrievalService, get_retrieval_service
from app.models.schemas.search_response import SearchResponse, SearchResultItem, ChunkMetadata

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search_similar(
    request: RetrievalRequest,
) -> SearchResponse:
    """
    Search for similar documents using vector similarity search
    """
    try:
        retrieval_service: RetrievalService = get_retrieval_service()

        results = await retrieval_service.retrieve_similar(
            query=request.query,
            limit=request.limit,
            filters=request.filters
        )

        # Filter by minimum score and apply offset/limit
        filtered_results = [
            r for r in results if r.score >= request.min_score]
        paginated_results = filtered_results[request.offset:request.offset + request.limit]

        search_items = []
        for result in paginated_results:
            metadata = result.payload
            search_items.append(SearchResultItem(
                score=result.score,
                content=result.content,
                metadata=ChunkMetadata(
                    chunk_id=metadata.get("chunk_id"),
                    document_id=metadata.get("document_id"),
                    document_page=metadata.get("document_page"),
                    uuid=metadata.get("uuid"),
                    document_type=metadata.get("document_type"),
                    department=metadata.get("department"),
                    division=metadata.get("division"),
                    document_nature=metadata.get("document_nature"),
                    created_at=metadata.get("created_at")
                ),
                extra_info=metadata.get("chunk_metadata", {})
            ))
            
        search_response = SearchResponse(
            results=search_items,
            query=request.query,
            total_results=len(filtered_results)
        )

        return search_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/store")
async def store_embeddings(
    texts: List[str],
    metadata: List[Dict[str, Any]],
    ids: Optional[List[str]] = None,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Store embeddings for a list of texts with associated metadata
    """
    try:
        retrieval_service = RetrievalService()
        await retrieval_service.store_embeddings(
            texts=texts,
            metadata=metadata,
            ids=ids
        )
        return {"message": "Embeddings stored successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
