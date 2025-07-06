from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_async_db
from app.services.document_processing import DocumentProcessingService
from app.services.retrieval import RetrievalService
from app.models.database.document import Document
from app.models.enums import DocumentStatus
from app.utils.logging_setup import create_logger
from app.utils.service_health import ServiceHealthChecker
from pydantic import BaseModel

router = APIRouter()
logger = create_logger(__name__, log_file_name="endpoint.log")

class SearchQuery(BaseModel):
    query: str
    limit: int = 5

async def generate_embeddings_task(document_id: int, db: AsyncSession):
    """
    Background task to generate embeddings for a document
    """
    try:
        logger.info(f"Starting embedding generation for document {document_id}")
        
        # Update document status to processing if it's chunked
        result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()
        if document and document.status == DocumentStatus.CHUNKED.value:
            document.status = DocumentStatus.PROCESSING.value
            await db.commit()
            logger.info(f"Set document {document_id} status to '{DocumentStatus.PROCESSING.value}' for embeddings")
        
        # Generate embeddings
        processing_service = DocumentProcessingService(db_session=db)
        await processing_service.process_document_embeddings(document_id)
        
        # Update document status to completed
        if document:
            document.status = DocumentStatus.COMPLETED.value
            await db.commit()
            logger.info(f"Set document {document_id} status to '{DocumentStatus.COMPLETED.value}'")
        
        logger.info(f"Successfully completed embedding generation for document {document_id}")
    except Exception as e:
        logger.error(f"Error in embedding generation: {str(e)}")
        
        # Update document status to error
        try:
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            if document:
                document.status = DocumentStatus.ERROR.value
                await db.commit()
                logger.info(f"Set document {document_id} status to '{DocumentStatus.ERROR.value}' due to embedding failure")
        except Exception as status_error:
            logger.error(f"Failed to update document status to error: {str(status_error)}")
        
        raise


@router.post("/batch/process")
async def batch_process_embeddings(
    document_ids: List[int],
    db: AsyncSession = Depends(get_async_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Process embeddings for multiple documents in batch"""
    if not document_ids:
        raise HTTPException(
            status_code=400,
            detail="No document IDs provided"
        )
    
    if len(document_ids) > 50:  # Limit batch size
        raise HTTPException(
            status_code=400,
            detail="Batch size cannot exceed 50 documents"
        )
    
    # Batch fetch documents
    result = await db.execute(
        select(Document).where(Document.id.in_(document_ids))
    )
    documents = result.scalars().all()
    
    found_ids = {doc.id for doc in documents}
    missing_ids = set(document_ids) - found_ids
    
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Documents not found: {list(missing_ids)}"
        )
    
    # Pre-flight service health check
    logger.info("Checking service health before batch embedding processing")
    health_status = await ServiceHealthChecker.check_all_services(db)
    
    if not health_status["can_process_documents"]:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Services not available for embedding processing",
                "service_status": health_status
            }
        )
    
    # Start batch processing
    for document in documents:
        background_tasks.add_task(
            generate_embeddings_task,
            document_id=document.id,
            db=db
        )
    
    logger.info(f"Started batch embedding processing for {len(documents)} documents")
    
    return {
        "message": f"Started embedding processing for {len(documents)} documents",
        "processed_documents": [{"id": doc.id, "title": doc.title} for doc in documents],
        "total_processed": len(documents)
    }

@router.post("/{document_id}/process")
async def process_document_embeddings(
    document_id: int,
    db: AsyncSession = Depends(get_async_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """Process document chunks to generate and store embeddings"""
    # Check if document exists
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(
            status_code=404, 
            detail=f"Document with ID {document_id} not found"
        )
    
    # Check if document can have embeddings generated from its current status
    if not DocumentStatus.can_be_embedded(document.status):
        raise HTTPException(
            status_code=400,
            detail=f"Document cannot have embeddings generated from status '{document.status}'. Current status: {DocumentStatus.get_description(document.status)}"
        )
    
    # Pre-flight service health check
    logger.info(f"Checking service health before processing embeddings for document {document_id}")
    health_status = await ServiceHealthChecker.check_all_services(db)
    
    if not health_status["can_process_documents"]:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Services not available for embedding processing",
                "service_status": health_status
            }
        )
    
    # Start background embedding task
    background_tasks.add_task(
        generate_embeddings_task,
        document_id=document_id,
        db=db
    )
    
    return {
        "message": f"Embedding generation started for document {document_id}",
        "document_id": document_id,
        "status": "processing"
    }

@router.get("/search")
async def search_similar_chunks(
    query: str,
    limit: int = 5,
    db: AsyncSession = Depends(get_async_db)
) -> List[Dict[str, Any]]:
    """Search for similar chunks using a text query"""
    try:
        retrieval_service = RetrievalService()
        results = await retrieval_service.search_similar_chunks(
            query_text=query,
            limit=limit
        )
        return results
    except Exception as e:
        logger.error(f"Error in similarity search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_similar_chunks_post(
    query: SearchQuery,
    db: AsyncSession = Depends(get_async_db)
) -> List[Dict[str, Any]]:
    """Search for similar chunks using a text query (POST method)"""
    try:
        retrieval_service = RetrievalService()
        results = await retrieval_service.search_similar_chunks(
            query_text=query.query,
            limit=query.limit
        )
        return results
    except Exception as e:
        logger.error(f"Error in similarity search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
