from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.controllers.document_controller import DocumentController
from app.controllers.document_chunk_controller import DocumentChunkController
from app.models.database import Document, DocumentChunk
from app.services.embedding import EmbeddingsService
from app.services.retrieval import RetrievalService
from app.utils.logging_setup import create_logger

logger = create_logger(__name__)


class DocumentProcessingService:
    """
    Service for document processing operations that combines multiple controllers and services.
    """

    def __init__(self, db_session: AsyncSession, batch_size: int = 20):
        self.db_session = db_session
        self.batch_size = batch_size
        self.document_controller = DocumentController(db_session)
        self.chunk_controller = DocumentChunkController(db_session)
        self.embeddings_service = EmbeddingsService()
        self.retrieval_service = RetrievalService()

    async def process_document_embeddings(self, document_id: int):
        """Process all chunks of a document to generate and store embeddings in batches"""
        try:
            # Get document info
            document = await self.document_controller.get_document_by_id(document_id)
            if not document:
                raise ValueError(f"Document {document_id} not found")

            # Get pending chunks
            chunks = await self.chunk_controller.list_chunks_by_document(
                document_id=document_id, status="pending"
            )

            if not chunks:
                logger.info(f"No pending chunks found for document {document_id}")
                return

            # Process chunks in batches
            total_chunks = len(chunks)
            for i in range(0, total_chunks, self.batch_size):
                batch = chunks[i : i + self.batch_size]

                # Prepare texts and metadata for embedding
                texts = [chunk.content for chunk in batch]
                metadata = [
                    self._prepare_chunk_metadata(chunk, document)
                    for chunk in batch
                ]

                # Store embeddings through retrieval service
                await self.retrieval_service.store_embeddings(
                    texts=texts, metadata=metadata, ids=[chunk.id for chunk in batch]
                )

                # Update chunk status for this batch
                chunk_ids = [chunk.id for chunk in batch]
                await self.chunk_controller.update_chunks_status_batch(chunk_ids, "embedded")

                logger.info(
                    f"Processed batch of {len(batch)} chunks for document {document_id} "
                    f"(progress: {i + len(batch)}/{total_chunks})"
                )

            # Update document status if all chunks are processed
            await self._update_document_status_if_complete(document_id)

            logger.info(
                f"Successfully processed {total_chunks} chunks for document {document_id}"
            )

        except Exception as e:
            logger.error(f"Error processing document chunks: {str(e)}")
            raise

    def _prepare_chunk_metadata(self, chunk: DocumentChunk, document: Document) -> Dict[str, Any]:
        """Prepare metadata for a chunk"""
        return {
            "chunk_id": chunk.id,
            "document_id": chunk.document_id,
            "uuid": chunk.uuid,
            "document_page_no": chunk.document_page,
            "chunk_metadata": chunk.chunk_metadata,
            "content": chunk.content,
            "division": document.division,
            "department": document.department,
            "document_name": document.title,
            "document_type": None,  # Could be derived from file extension
            "author": None,  # Not available in current schema
            "document_size": None,  # Could be calculated from file
            "keywords": [],  # Could be extracted from content
            "created_at": chunk.created_at.isoformat() if chunk.created_at else None,
            "processed_by": "embedding_service",
            "extraction_method": "docling_hybrid_chunker",
        }

    async def _update_document_status_if_complete(self, document_id: int):
        """Update document status to embedded if all chunks are embedded"""
        try:
            # Check if all chunks are embedded using the document controller
            all_embedded = await self.document_controller.check_all_chunks_embedded(document_id)

            if all_embedded:
                # All chunks are embedded, update document status
                await self.document_controller.update_document_status(document_id, "embedded")
                logger.info(f"Updated document {document_id} status to embedded")

        except Exception as e:
            logger.error(f"Error updating document status: {str(e)}")
            raise
