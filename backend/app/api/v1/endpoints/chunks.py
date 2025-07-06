from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
)
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.models.database.chunk import DocumentChunk
from app.models.database.document import Document
from app.models.enums import DocumentStatus
from app.services.chunking import ChunkingService
from app.api.v1.schemas.document import DocumentChunkResponse
from app.controllers.document_chunk_controller import DocumentChunkController
import os
from typing import List
from app.utils.logging_setup import create_logger
from app.utils.service_health import ServiceHealthChecker

router = APIRouter()
logger = create_logger(__name__, log_file_name="endpoint.log")

async def background_chunk_document_task(document_id: int, file_path: str, db: AsyncSession):
    """
    Background task to chunk a document
    """
    try:
        logger.info(f"Starting chunking process for document {document_id}")
        
        # Use controller for database operations
        from app.controllers.document_controller import DocumentController
        doc_controller = DocumentController(db)
        
        # Update document status to processing
        await doc_controller.update_document_status(document_id, DocumentStatus.PROCESSING.value)
        logger.info(f"Set document {document_id} status to '{DocumentStatus.PROCESSING.value}'")
        
        # Perform the chunking
        chunking_service = ChunkingService(db_session=db)
        await chunking_service.process_document(
            document_id=document_id,
            file_path=file_path
        )
        
        # Update document status to chunked
        await doc_controller.update_document_status(document_id, DocumentStatus.CHUNKED.value)
        logger.info(f"Set document {document_id} status to '{DocumentStatus.CHUNKED.value}'")
        
        logger.info(f"Successfully completed chunking for document {document_id}")
    except Exception as e:
        logger.error(f"Error in document chunking: {str(e)}")
        
        # Update document status to error
        try:
            from app.controllers.document_controller import DocumentController
            doc_controller = DocumentController(db)
            await doc_controller.update_document_status(document_id, DocumentStatus.ERROR.value)
            logger.info(f"Set document {document_id} status to '{DocumentStatus.ERROR.value}' due to chunking failure")
        except Exception as status_error:
            logger.error(f"Failed to update document status to error: {str(status_error)}")
        
        raise

@router.post("/document/{document_id}/start-chunking")
async def start_document_chunking(
    document_id: int,
    db: AsyncSession = Depends(get_async_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Start chunking for a document by its ID
    """
    # Use controllers for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    chunk_controller = DocumentChunkController(db)
    
    # Check if document exists
    document = await doc_controller.get_document_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=404, 
            detail=f"Document with ID {document_id} not found"
        )
    
    # Check if document can be chunked from its current status
    if not DocumentStatus.can_be_chunked(document.status):
        raise HTTPException(
            status_code=400,
            detail=f"Document cannot be chunked from status '{document.status}'. Current status: {DocumentStatus.get_description(document.status)}"
        )
    
    # Check if file still exists
    if not os.path.exists(document.location):
        raise HTTPException(
            status_code=404,
            detail=f"Document file not found at {document.location}"
        )
    
    # Check if document already has chunks
    existing_chunks = await chunk_controller.list_chunks_by_document(document_id)
    if existing_chunks:
        logger.warning(f"Document {document_id} already has {len(existing_chunks)} chunks. Re-chunking will process alongside existing chunks.")
    
    # Pre-flight service health check
    logger.info(f"Checking service health before processing document {document_id}")
    health_status = await ServiceHealthChecker.check_all_services(db)
    
    if not health_status["can_process_documents"]:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Services not available for chunk processing",
                "service_status": health_status
            }
        )

    # Start background chunking task
    background_tasks.add_task(
        background_chunk_document_task,
        document_id=document.id,
        file_path=document.location,
        db=db
    )
    
    logger.info(f"Started chunking process for document {document_id}")
    
    return {
        "message": f"Chunking started for document {document_id}",
        "document_id": document_id,
        "status": "processing"
    }

@router.get("/document/{document_id}/chunks", response_model=List[DocumentChunkResponse])
async def get_document_chunks(
    document_id: int, 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Retrieve all chunks for a specific document
    """
    # Use controllers for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    chunk_controller = DocumentChunkController(db)
    
    # First verify document exists
    document = await doc_controller.get_document_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=404, 
            detail=f"Document with ID {document_id} not found"
        )
    
    # Get chunks
    chunks = await chunk_controller.list_chunks_by_document(document_id)
    if not chunks:
        raise HTTPException(
            status_code=404, 
            detail="No chunks found for this document"
        )
    
    return chunks

@router.get("/document/{document_id}/chunking-status")
async def get_document_chunking_status(
    document_id: int, 
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get the chunking status of a document
    """
    # Use controllers for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    chunk_controller = DocumentChunkController(db)
    
    # Check if document exists
    document = await doc_controller.get_document_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=404, 
            detail=f"Document with ID {document_id} not found"
        )
    
    # Get chunk count
    chunks = await chunk_controller.list_chunks_by_document(document_id)
    
    # Check if file exists
    file_exists = os.path.exists(document.location)
    
    # Determine processing status
    processing_status = document.status
    if processing_status == DocumentStatus.CHUNKED.value and chunks:
        processing_status = DocumentStatus.COMPLETED.value
    elif processing_status == DocumentStatus.PENDING.value and chunks:
        processing_status = DocumentStatus.COMPLETED.value  # Legacy case where status wasn't updated
    
    return {
        "document_id": document_id,
        "document_title": document.title,
        "file_location": document.location,
        "file_exists": file_exists,
        "document_status": document.status,
        "processing_status": processing_status,
        "total_chunks": len(chunks),
        "chunks_created": len([c for c in chunks if c.status == "completed"]) if chunks else 0,
        "status": processing_status  # For backwards compatibility
    }

@router.delete("/document/{document_id}/chunks")
async def delete_all_document_chunks(
    document_id: int,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete all chunks for a specific document
    """
    # Use controllers for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    chunk_controller = DocumentChunkController(db)
    
    # Check if document exists
    document = await doc_controller.get_document_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=404, 
            detail=f"Document with ID {document_id} not found"
        )
    
    # Delete chunks
    deleted_count = await chunk_controller.delete_chunks_by_document(document_id)
    
    if deleted_count == 0:
        return {
            "message": f"No chunks found for document {document_id}",
            "deleted_count": 0
        }
    
    logger.info(f"Batch deleted {deleted_count} chunks for document {document_id}")
    
    return {
        "message": f"Successfully deleted {deleted_count} chunks for document {document_id}",
        "deleted_count": deleted_count
    }

@router.post("/batch/start-chunking")
async def start_batch_document_chunking(
    document_ids: List[int],
    db: AsyncSession = Depends(get_async_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Start chunking for multiple documents by their IDs in batch
    """
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
    
    # Use controllers for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    
    # Batch fetch documents
    documents = await doc_controller.get_documents_by_ids(document_ids)
    
    found_ids = {doc.id for doc in documents}
    missing_ids = set(document_ids) - found_ids
    
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Documents not found: {list(missing_ids)}"
        )
    
    # Check file existence for all documents
    missing_files = []
    valid_documents = []
    
    for document in documents:
        if os.path.exists(document.location):
            valid_documents.append(document)
        else:
            missing_files.append({"id": document.id, "location": document.location})
    
    if missing_files:
        logger.warning(f"Some files are missing: {missing_files}")

    # Pre-flight service health check before batch processing
    logger.info("Checking service health before batch processing")
    health_status = await ServiceHealthChecker.check_all_services(db)
    
    if not health_status["can_process_documents"]:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Services not available for document processing",
                "service_status": health_status,
                "requested_documents": len(document_ids),
                "valid_documents": len(valid_documents)
            }
        )

    # Start batch processing
    for document in valid_documents:
        background_tasks.add_task(
            background_chunk_document_task,
            document_id=document.id,
            file_path=document.location,
            db=db
        )
    
    logger.info(f"Started batch chunking for {len(valid_documents)} documents")
    
    return {
        "message": f"Started chunking for {len(valid_documents)} documents",
        "processed_documents": [{"id": doc.id, "title": doc.title} for doc in valid_documents],
        "missing_files": missing_files,
        "total_processed": len(valid_documents),
        "total_requested": len(document_ids)
    }

@router.post("/batch/chunking-status")
async def get_batch_chunking_status(
    document_ids: List[int],
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get the chunking status of multiple documents in batch
    """
    if not document_ids:
        raise HTTPException(
            status_code=400,
            detail="No document IDs provided"
        )
    
    if len(document_ids) > 100:  # Limit batch size
        raise HTTPException(
            status_code=400,
            detail="Batch size cannot exceed 100 documents"
        )
    
    # Use controllers for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    chunk_controller = DocumentChunkController(db)
    
    # Batch fetch documents
    documents = await doc_controller.get_documents_by_ids(document_ids)
    documents_dict = {doc.id: doc for doc in documents}
    
    # Batch fetch chunk stats
    chunk_stats = await chunk_controller.get_batch_chunk_stats(document_ids)
    
    # Build response
    results = []
    missing_documents = []
    
    for doc_id in document_ids:
        if doc_id not in documents_dict:
            missing_documents.append(doc_id)
            continue
            
        document = documents_dict[doc_id]
        stats = chunk_stats.get(doc_id, {'total_chunks': 0, 'completed_chunks': 0})
        
        results.append({
            "document_id": doc_id,
            "document_title": document.title,
            "file_location": document.location,
            "file_exists": os.path.exists(document.location),
            "document_status": document.status,
            "processing_status": DocumentStatus.COMPLETED.value if stats['total_chunks'] > 0 else document.status,
            "total_chunks": stats['total_chunks'],
            "chunks_created": stats['completed_chunks'],
            "status": DocumentStatus.COMPLETED.value if stats['total_chunks'] > 0 else document.status  # For backwards compatibility
        })
    
    response = {
        "results": results,
        "total_processed": len(results),
        "total_requested": len(document_ids)
    }
    
    if missing_documents:
        response["missing_documents"] = missing_documents
    
    return response
