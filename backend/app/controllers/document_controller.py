from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import Document
from app.models.enums import DocumentStatus
from app.utils.logging_setup import create_logger

logger = create_logger(__name__)


class DocumentController:
    """
    Controller for Document entity operations with direct database access.
    """

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def create_document(self, uuid: str, title: str, department: str, 
                            division: str, location: str) -> Document:
        """Create a new document record"""
        try:
            document = Document(
                uuid=uuid,
                title=title,
                department=department,
                division=division,
                location=location,
                status=DocumentStatus.PENDING.value
            )
            self.db_session.add(document)
            await self.db_session.commit()
            await self.db_session.refresh(document)
            logger.info(f"Created document {document.id}: {title}")
            return document
        except Exception as e:
            logger.error(f"Error creating document: {str(e)}")
            await self.db_session.rollback()
            raise

    async def get_document_by_id(self, document_id: int) -> Optional[Document]:
        """Retrieve a document by ID"""
        try:
            query = select(Document).where(Document.id == document_id)
            result = await self.db_session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error retrieving document {document_id}: {str(e)}")
            raise

    async def get_document_by_uuid(self, uuid: str) -> Optional[Document]:
        """Retrieve a document by UUID"""
        try:
            query = select(Document).where(Document.uuid == uuid)
            result = await self.db_session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error retrieving document by UUID {uuid}: {str(e)}")
            raise

    async def list_documents(self, limit: int = 100, offset: int = 0, 
                           status: Optional[str] = None,
                           department: Optional[str] = None,
                           division: Optional[str] = None) -> List[Document]:
        """List documents with optional filtering"""
        try:
            query = select(Document)
            
            # Apply filters
            if status:
                query = query.where(Document.status == status)
            if department:
                query = query.where(Document.department == department)
            if division:
                query = query.where(Document.division == division)
            
            query = query.offset(offset).limit(limit).order_by(Document.created_at.desc())
            result = await self.db_session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error listing documents: {str(e)}")
            raise

    async def update_document_status(self, document_id: int, status: str) -> Document:
        """Update document status"""
        try:
            query = select(Document).where(Document.id == document_id)
            result = await self.db_session.execute(query)
            document = result.scalar_one_or_none()
            
            if not document:
                raise ValueError(f"Document {document_id} not found")
            
            document.status = status
            await self.db_session.commit()
            await self.db_session.refresh(document)
            logger.info(f"Updated document {document_id} status to {status}")
            return document
        except Exception as e:
            logger.error(f"Error updating document status: {str(e)}")
            await self.db_session.rollback()
            raise

    async def delete_document(self, document_id: int) -> bool:
        """Delete a document and its chunks"""
        try:
            query = select(Document).where(Document.id == document_id)
            result = await self.db_session.execute(query)
            document = result.scalar_one_or_none()
            
            if not document:
                return False
            
            await self.db_session.delete(document)
            await self.db_session.commit()
            logger.info(f"Deleted document {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {str(e)}")
            await self.db_session.rollback()
            raise

    async def get_document_stats(self) -> Dict[str, Any]:
        """Get statistics about documents"""
        try:
            # Count by status
            status_query = select(Document.status, func.count(Document.id)).group_by(Document.status)
            status_result = await self.db_session.execute(status_query)
            status_counts = dict(status_result.all())
            
            # Count by department
            dept_query = select(Document.department, func.count(Document.id)).group_by(Document.department)
            dept_result = await self.db_session.execute(dept_query)
            dept_counts = dict(dept_result.all())
            
            # Total count
            total_query = select(func.count(Document.id))
            total_result = await self.db_session.execute(total_query)
            total_count = total_result.scalar()
            
            return {
                "total_documents": total_count,
                "by_status": status_counts,
                "by_department": dept_counts
            }
        except Exception as e:
            logger.error(f"Error getting document stats: {str(e)}")
            raise

    async def check_all_chunks_embedded(self, document_id: int) -> bool:
        """Check if all chunks for a document are embedded"""
        try:
            from app.models.database import DocumentChunk
            
            # Check if there are any non-embedded chunks
            pending_chunks_query = select(func.count(DocumentChunk.id)).where(
                and_(
                    DocumentChunk.document_id == document_id,
                    DocumentChunk.status == "pending"
                )
            )
            result = await self.db_session.execute(pending_chunks_query)
            pending_count = result.scalar()
            
            return pending_count == 0
        except Exception as e:
            logger.error(f"Error checking chunks embedded status: {str(e)}")
            raise

    async def get_documents_by_ids(self, document_ids: List[int]) -> List[Document]:
        """Get multiple documents by their IDs"""
        try:
            query = select(Document).where(Document.id.in_(document_ids))
            result = await self.db_session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error retrieving documents by IDs: {str(e)}")
            raise

    async def get_documents_count(self) -> int:
        """Get total count of documents"""
        try:
            query = select(func.count(Document.id))
            result = await self.db_session.execute(query)
            return result.scalar()
        except Exception as e:
            logger.error(f"Error getting document count: {str(e)}")
            raise

    async def get_filter_options(self) -> Dict[str, List[str]]:
        """Get unique filter options for frontend"""
        try:
            # Get unique divisions
            divisions_query = select(Document.division).distinct().where(Document.division.isnot(None))
            divisions_result = await self.db_session.execute(divisions_query)
            divisions = [row[0] for row in divisions_result.fetchall() if row[0]]

            # Get unique departments
            departments_query = select(Document.department).distinct().where(Document.department.isnot(None))
            departments_result = await self.db_session.execute(departments_query)
            departments = [row[0] for row in departments_result.fetchall() if row[0]]

            # Get unique document titles
            titles_query = select(Document.title).distinct().where(Document.title.isnot(None))
            titles_result = await self.db_session.execute(titles_query)
            document_names = [row[0] for row in titles_result.fetchall() if row[0]]

            # Get unique document IDs
            ids_query = select(Document.id).distinct().where(Document.id.isnot(None))
            ids_result = await self.db_session.execute(ids_query)
            document_ids = [str(row[0]) for row in ids_result.fetchall()]

            return {
                "divisions": sorted(divisions),
                "departments": sorted(departments),
                "document_names": sorted(document_names),
                "document_ids": sorted(document_ids, key=int)
            }
        except Exception as e:
            logger.error(f"Error getting filter options: {str(e)}")
            raise
