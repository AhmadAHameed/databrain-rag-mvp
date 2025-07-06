import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import DocumentChunk, Document
from app.infrastructure.ingest.docling import DoclingChunking
from app.core.config.app_config import get_app_settings
from app.utils.logging_setup import create_logger

logger = create_logger(__name__)


class DocumentChunkController:
    """
    Controller for DocumentChunk entity operations with direct database access.
    """

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.app_settings = get_app_settings()
        self._chunker = None

    @property
    def chunker(self):
        """Lazy initialization of the chunker"""
        if not self._chunker:
            self._chunker = DoclingChunking()
        return self._chunker

    async def create_chunks_from_document_file(self, document: Document, file_path: str) -> List[DocumentChunk]:
        """Create chunks from a document file using the chunking service"""
        try:
            chunks = self.chunker.chunk_pdf_document(file_path, document.id)
            
            # Store chunks in database
            for chunk in chunks:
                self.db_session.add(chunk)
            
            await self.db_session.commit()
            logger.info(f"Created {len(chunks)} chunks for document {document.id}")
            return chunks
        except Exception as e:
            logger.error(f"Error creating chunks for document {document.id}: {str(e)}")
            await self.db_session.rollback()
            raise

    async def get_chunk_by_id(self, chunk_id: int) -> Optional[DocumentChunk]:
        """Retrieve a chunk by ID"""
        try:
            query = select(DocumentChunk).where(DocumentChunk.id == chunk_id)
            result = await self.db_session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error retrieving chunk {chunk_id}: {str(e)}")
            raise

    async def get_chunk_by_uuid(self, chunk_uuid: str) -> Optional[DocumentChunk]:
        """Retrieve a chunk by UUID"""
        try:
            query = select(DocumentChunk).where(DocumentChunk.uuid == chunk_uuid)
            result = await self.db_session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error retrieving chunk by UUID {chunk_uuid}: {str(e)}")
            raise

    async def list_chunks_by_document(self, document_id: int, 
                                    status: Optional[str] = None) -> List[DocumentChunk]:
        """List all chunks for a specific document"""
        try:
            query = select(DocumentChunk).where(DocumentChunk.document_id == document_id)
            
            if status:
                query = query.where(DocumentChunk.status == status)
            
            query = query.order_by(DocumentChunk.document_page, DocumentChunk.id)
            result = await self.db_session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error listing chunks for document {document_id}: {str(e)}")
            raise

    async def list_chunks(self, limit: int = 100, offset: int = 0,
                         status: Optional[str] = None,
                         document_id: Optional[int] = None) -> List[DocumentChunk]:
        """List chunks with optional filtering"""
        try:
            query = select(DocumentChunk)
            
            # Apply filters
            if status:
                query = query.where(DocumentChunk.status == status)
            if document_id:
                query = query.where(DocumentChunk.document_id == document_id)
            
            query = query.offset(offset).limit(limit).order_by(DocumentChunk.created_at.desc())
            result = await self.db_session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error listing chunks: {str(e)}")
            raise

    async def update_chunk_status(self, chunk_id: int, status: str) -> DocumentChunk:
        """Update chunk status"""
        try:
            query = select(DocumentChunk).where(DocumentChunk.id == chunk_id)
            result = await self.db_session.execute(query)
            chunk = result.scalar_one_or_none()
            
            if not chunk:
                raise ValueError(f"Chunk {chunk_id} not found")
            
            chunk.status = status
            await self.db_session.commit()
            await self.db_session.refresh(chunk)
            logger.info(f"Updated chunk {chunk_id} status to {status}")
            return chunk
        except Exception as e:
            logger.error(f"Error updating chunk status: {str(e)}")
            await self.db_session.rollback()
            raise

    async def update_chunks_status_batch(self, chunk_ids: List[int], status: str) -> int:
        """Update status for multiple chunks in a batch"""
        try:
            query = select(DocumentChunk).where(DocumentChunk.id.in_(chunk_ids))
            result = await self.db_session.execute(query)
            chunks = result.scalars().all()
            
            updated_count = 0
            for chunk in chunks:
                chunk.status = status
                updated_count += 1
            
            await self.db_session.commit()
            logger.info(f"Updated {updated_count} chunks to status {status}")
            return updated_count
        except Exception as e:
            logger.error(f"Error updating chunks status in batch: {str(e)}")
            await self.db_session.rollback()
            raise

    async def delete_chunk(self, chunk_id: int) -> bool:
        """Delete a specific chunk"""
        try:
            query = select(DocumentChunk).where(DocumentChunk.id == chunk_id)
            result = await self.db_session.execute(query)
            chunk = result.scalar_one_or_none()
            
            if not chunk:
                return False
            
            await self.db_session.delete(chunk)
            await self.db_session.commit()
            logger.info(f"Deleted chunk {chunk_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting chunk {chunk_id}: {str(e)}")
            await self.db_session.rollback()
            raise

    async def delete_chunks_by_document(self, document_id: int) -> int:
        """Delete all chunks for a specific document"""
        try:
            delete_stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
            result = await self.db_session.execute(delete_stmt)
            await self.db_session.commit()
            deleted_count = result.rowcount
            logger.info(f"Deleted {deleted_count} chunks for document {document_id}")
            return deleted_count
        except Exception as e:
            logger.error(f"Error deleting chunks for document {document_id}: {str(e)}")
            await self.db_session.rollback()
            raise

    async def get_chunks_with_document_info(self, document_id: int) -> List[tuple]:
        """Get chunks with their associated document information"""
        try:
            query = select(DocumentChunk, Document).join(
                Document, DocumentChunk.document_id == Document.id
            ).where(DocumentChunk.document_id == document_id)
            
            result = await self.db_session.execute(query)
            return result.all()
        except Exception as e:
            logger.error(f"Error getting chunks with document info: {str(e)}")
            raise

    async def get_chunk_stats(self) -> Dict[str, Any]:
        """Get statistics about chunks"""
        try:
            # Count by status
            status_query = select(DocumentChunk.status, func.count(DocumentChunk.id)).group_by(DocumentChunk.status)
            status_result = await self.db_session.execute(status_query)
            status_counts = dict(status_result.all())
            
            # Count by document
            doc_query = select(DocumentChunk.document_id, func.count(DocumentChunk.id)).group_by(DocumentChunk.document_id)
            doc_result = await self.db_session.execute(doc_query)
            doc_counts = dict(doc_result.all())
            
            # Total count
            total_query = select(func.count(DocumentChunk.id))
            total_result = await self.db_session.execute(total_query)
            total_count = total_result.scalar()
            
            return {
                "total_chunks": total_count,
                "by_status": status_counts,
                "by_document": doc_counts
            }
        except Exception as e:
            logger.error(f"Error getting chunk stats: {str(e)}")
            raise

    async def get_batch_chunk_stats(self, document_ids: List[int]) -> Dict[int, Dict[str, Any]]:
        """Get chunk statistics for multiple documents"""
        try:
            query = select(
                DocumentChunk.document_id,
                func.count(DocumentChunk.id).label('total_chunks'),
                func.sum(func.case((DocumentChunk.status == 'completed', 1), else_=0)).label('completed_chunks')
            ).where(DocumentChunk.document_id.in_(document_ids)).group_by(DocumentChunk.document_id)
            
            result = await self.db_session.execute(query)
            
            return {
                row.document_id: {
                    'total_chunks': row.total_chunks,
                    'completed_chunks': int(row.completed_chunks or 0)
                }
                for row in result.fetchall()
            }
        except Exception as e:
            logger.error(f"Error getting batch chunk stats: {str(e)}")
            raise
