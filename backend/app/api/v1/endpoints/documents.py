from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    HTTPException,
    Form,
)
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_async_db
from app.models.database.document import Document
from app.models.enums import DocumentStatus
from app.api.v1.schemas.document import DocumentCreate, DocumentResponse
from app.controllers.document_controller import DocumentController
import os
import uuid
import shutil
from typing import List, Dict, Any
from app.utils.logging_setup import create_logger

router = APIRouter()
logger = create_logger(__name__, log_file_name="endpoint.log")

UPLOAD_DIR = "_artifacts/uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".docx"}


@router.post("/upload/", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    department: str = Form(...),
    division: str = Form(...),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Upload a document without processing it
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

    # Use controller for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)

    try:
        document = await doc_controller.create_document(
            uuid=str(uuid.uuid4()),
            title=title,
            department=department,
            division=division,
            location=file_location
        )
        logger.info(f"Document uploaded successfully: {document.id}")
        return document
    except Exception as e:
        logger.error(f"Failed to save document to database: {str(e)}")
        os.remove(file_location)  # Clean up file if database operation fails
        raise HTTPException(
            status_code=500, detail="Failed to save document information"
        )


@router.get("/list", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_async_db), skip: int = 0, limit: int = 100
):
    """
    List all documents
    """
    try:
        # Use controller for database operations
        from app.controllers.document_controller import DocumentController
        doc_controller = DocumentController(db)
        
        # Get total count for debugging
        total_documents = await doc_controller.get_documents_count()
        logger.info(f"Total documents in database: {total_documents}")

        # Get paginated results
        documents = await doc_controller.list_documents(limit=limit, offset=skip)
        logger.info(
            f"Retrieved {len(documents)} documents (skip={skip}, limit={limit})"
        )

        return documents
    except Exception as e:
        logger.error(f"Failed to retrieve documents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve documents")


@router.get("/filter-options")
async def get_filter_options(db: AsyncSession = Depends(get_async_db)) -> Dict[str, Any]:
    """
    Get unique filter options from the documents table for frontend filtering
    """
    try:
        # Use controller for database operations
        from app.controllers.document_controller import DocumentController
        doc_controller = DocumentController(db)
        
        filter_options = await doc_controller.get_filter_options()
        
        logger.info(f"Retrieved filter options: {len(filter_options['divisions'])} divisions, {len(filter_options['departments'])} departments, {len(filter_options['document_names'])} titles")
        
        return filter_options
    except Exception as e:
        logger.error(f"Failed to get filter options: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get filter options")


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Get a specific document by ID
    """
    # Use controller for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    
    document = await doc_controller.get_document_by_id(document_id)

    if not document:
        raise HTTPException(
            status_code=404, detail=f"Document with ID {document_id} not found"
        )

    return document


@router.delete("/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Delete a document and its associated file
    """
    # Use controller for database operations
    from app.controllers.document_controller import DocumentController
    doc_controller = DocumentController(db)
    
    document = await doc_controller.get_document_by_id(document_id)

    if not document:
        raise HTTPException(
            status_code=404, detail=f"Document with ID {document_id} not found"
        )

    # Delete the file if it exists
    if os.path.exists(document.location):
        try:
            os.remove(document.location)
            logger.info(f"Deleted file: {document.location}")
        except Exception as e:
            logger.warning(f"Failed to delete file {document.location}: {str(e)}")

    # Delete the database record
    try:
        success = await doc_controller.delete_document(document_id)
        if success:
            logger.info(f"Deleted document: {document_id}")
            return {"message": f"Document {document_id} deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete document")
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete document")


@router.get("/count")
async def get_documents_count(db: AsyncSession = Depends(get_async_db)):
    """
    Get the total count of documents
    """
    try:
        # Use controller for database operations
        from app.controllers.document_controller import DocumentController
        doc_controller = DocumentController(db)
        
        count = await doc_controller.get_documents_count()
        logger.info(f"Document count requested: {count}")
        return {"total_count": count}
    except Exception as e:
        logger.error(f"Failed to get document count: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get document count")
