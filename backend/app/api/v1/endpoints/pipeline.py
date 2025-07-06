from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    UploadFile,
    HTTPException,
    Form,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_async_db
from app.models.database.document import Document
from app.models.enums import DocumentStatus
from app.services.chunking import ChunkingService
from app.services.document_processing import DocumentProcessingService
from app.api.v1.schemas.document import DocumentResponse
import os
import uuid
import shutil
from typing import List
from app.utils.logging_setup import create_logger
from app.utils.service_health import ServiceHealthChecker

router = APIRouter()
logger = create_logger(__name__, log_file_name="endpoint.log")

UPLOAD_DIR = "_artifacts/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}

async def complete_document_pipeline(document_id: int, file_path: str, db: AsyncSession):
    """
    Process a document through the complete pipeline:
    1. Check service health
    2. Chunk the document
    3. Generate and store embeddings
    """
    try:
        # Get document reference
        result = await db.execute(
            select(Document).where(Document.id == document_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise Exception(f"Document {document_id} not found")
        
        # Pre-flight service health check
        logger.info(f"Starting service health check for document {document_id}")
        health_status = await ServiceHealthChecker.check_all_services(db)
        
        if not health_status["can_process_documents"]:
            error_msg = f"Services not ready for document processing: {health_status}"
            logger.error(error_msg)
            # Update status to error
            document.status = DocumentStatus.ERROR.value
            await db.commit()
            raise Exception(error_msg)
        
        logger.info(f"All services healthy, proceeding with document {document_id} processing")
        
        # Update status to processing
        document.status = DocumentStatus.PROCESSING.value
        await db.commit()
        logger.info(f"Set document {document_id} status to '{DocumentStatus.PROCESSING.value}'")
        
        # Step 1: Chunk the document
        logger.info(f"Starting chunking for document {document_id}")
        chunking_service = ChunkingService(db_session=db)
        await chunking_service.process_document(
            document_id=document_id,
            file_path=file_path
        )
        logger.info(f"Completed chunking for document {document_id}")
        
        # Update status to chunked
        document.status = DocumentStatus.CHUNKED.value
        await db.commit()
        logger.info(f"Set document {document_id} status to '{DocumentStatus.CHUNKED.value}'")
        
        # Step 2: Generate and store embeddings
        logger.info(f"Starting embedding generation for document {document_id}")
        processing_service = DocumentProcessingService(db_session=db)
        await processing_service.process_document_embeddings(document_id)
        logger.info(f"Completed embedding generation for document {document_id}")
        
        # Update status to completed
        document.status = DocumentStatus.COMPLETED.value
        await db.commit()
        logger.info(f"Set document {document_id} status to '{DocumentStatus.COMPLETED.value}'")
        
        logger.info(f"Successfully completed processing pipeline for document {document_id}")
    except Exception as e:
        logger.error(f"Error in document processing pipeline: {str(e)}")
        
        # Update document status to error
        try:
            result = await db.execute(
                select(Document).where(Document.id == document_id)
            )
            document = result.scalar_one_or_none()
            if document:
                document.status = DocumentStatus.ERROR.value
                await db.commit()
                logger.info(f"Set document {document_id} status to '{DocumentStatus.ERROR.value}' due to pipeline failure")
        except Exception as status_error:
            logger.error(f"Failed to update document status to error: {str(status_error)}")
        
        raise

@router.post("/upload-and-process/", response_model=DocumentResponse)
async def upload_and_process_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    department: str = Form(...),
    division: str = Form(...),
    db: AsyncSession = Depends(get_async_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Upload a document and process it through the complete pipeline (upload → chunk → embed)
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Create unique filename and save path
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_location = os.path.join(UPLOAD_DIR, unique_filename)

    # Save file to disk
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        logger.error(f"Failed to save file: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save file")

    # Create document record
    document = Document(
        uuid=str(uuid.uuid4()),
        title=title,
        department=department,
        division=division,
        location=file_location,
    )

    try:
        db.add(document)
        await db.commit()
        await db.refresh(document)
    except Exception as e:
        logger.error(f"Failed to save document to database: {str(e)}")
        os.remove(file_location)  # Clean up file if database operation fails
        raise HTTPException(
            status_code=500, detail="Failed to save document information"
        )

    # Pre-flight service health check before starting background processing
    logger.info(f"Checking service health before processing document {document.id}")
    health_status = await ServiceHealthChecker.check_all_services(db)
    
    if not health_status["can_process_documents"]:
        logger.warning(f"Services not ready for document processing: {health_status}")
        # Document is saved, but processing will be delayed
        return {
            **document.__dict__,
            "processing_status": "delayed",
            "message": "Document uploaded successfully, but processing delayed due to service unavailability",
            "service_status": health_status
        }

    # Start background processing pipeline
    background_tasks.add_task(
        complete_document_pipeline,
        document_id=document.id,
        file_path=file_location,
        db=db
    )

    logger.info(f"Started background processing for document {document.id}")
    return {
        **document.__dict__,
        "processing_status": "started",
        "message": "Document uploaded and processing started"
    }

@router.post("/{document_id}/process")
async def process_existing_document(
    document_id: int,
    db: AsyncSession = Depends(get_async_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Process an existing document through the complete pipeline (chunk → embed)
    """
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
    
    # Check if file still exists
    if not os.path.exists(document.location):
        raise HTTPException(
            status_code=404,
            detail=f"Document file not found at {document.location}"
        )
    
    # Pre-flight service health check
    logger.info(f"Checking service health before processing document {document_id}")
    health_status = await ServiceHealthChecker.check_all_services(db)
    
    if not health_status["can_process_documents"]:
        raise HTTPException(
            status_code=503,
            detail={
                "message": "Services not available for document processing",
                "service_status": health_status
            }
        )

    # Start background processing pipeline
    background_tasks.add_task(
        complete_document_pipeline,
        document_id=document.id,
        file_path=document.location,
        db=db
    )
    
    logger.info(f"Started complete processing pipeline for document {document_id}")
    
    return {
        "message": f"Processing started for document {document_id}",
        "document_id": document_id,
        "document_title": document.title,
        "processing_status": "started"
    }

@router.post("/batch/process")
async def batch_process_documents(
    document_ids: List[int],
    db: AsyncSession = Depends(get_async_db),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Process multiple documents through the complete pipeline in batch
    """
    if not document_ids:
        raise HTTPException(
            status_code=400,
            detail="No document IDs provided"
        )
    
    if len(document_ids) > 25:  # Lower limit for complete pipeline processing
        raise HTTPException(
            status_code=400,
            detail="Batch size cannot exceed 25 documents for complete pipeline processing"
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
            complete_document_pipeline,
            document_id=document.id,
            file_path=document.location,
            db=db
        )
    
    logger.info(f"Started batch complete pipeline processing for {len(valid_documents)} documents")
    
    return {
        "message": f"Started complete pipeline processing for {len(valid_documents)} documents",
        "processed_documents": [{"id": doc.id, "title": doc.title} for doc in valid_documents],
        "missing_files": missing_files,
        "total_processed": len(valid_documents),
        "total_requested": len(document_ids)
    }

@router.get("/health")
async def check_pipeline_services_health(db: AsyncSession = Depends(get_async_db)):
    """
    Check the health of all services required for the complete pipeline
    """
    try:
        health_status = await ServiceHealthChecker.check_all_services(db)
        
        status_code = 200 if health_status["can_process_documents"] else 503
        
        return {
            "endpoint": "pipeline",
            "timestamp": health_status.get("timestamp"),
            "can_process_documents": health_status["can_process_documents"],
            "overall_status": health_status["overall_status"],
            "services": health_status["services"],
            "pipeline_stages": {
                "chunking_ready": health_status["can_process_documents"],
                "embedding_ready": health_status["can_process_documents"],
                "complete_pipeline_ready": health_status["can_process_documents"]
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform health check: {str(e)}"
        )
