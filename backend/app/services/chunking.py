import re
import os
from typing import Any, Generator, List
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.infrastructure.ingest.docling import DoclingChunking


from app.models.database import DocumentChunk
from app.utils.logging_setup import create_logger

logger = create_logger(__name__, log_file_name="chunking.log")


class ChunkingService:
    def __init__(self, db_session: AsyncSession | Session, batch_size=5):  # Reduced from 10 to 5
        self.db_session = db_session
        self._chunking_provider = None
        self.batch_size = batch_size

    @property
    def chunking_provider(self):
        if not self._chunking_provider:
            self._chunking_provider = DoclingChunking()
        return self._chunking_provider

    async def process_document(self, document_id: int, file_path: str):
        """
        Process a document by chunking it and storing the chunks in the database in batches.

        Args:
            document_id: ID of the document in the database
            file_path: Path to the document file
        """
        try:
            # Get chunks using DoclingChunking
            chunks = self.chunking_provider.chunk_pdf_document(
                pdf_path=file_path, document_id=document_id
            )

            # Process chunks in batches
            for i in range(0, len(chunks), self.batch_size):
                batch = chunks[i : i + self.batch_size]

                # Store batch of chunks in database
                for chunk in batch:
                    self.db_session.add(chunk)

                # Commit each batch
                if isinstance(self.db_session, AsyncSession):
                    await self.db_session.commit()
                else:
                    self.db_session.commit()
                    logger.warning("Using deprecated sync database session")

                logger.info(
                    f"Processed batch of {len(batch)} chunks for document {document_id} "
                    f"(progress: {i + len(batch)}/{len(chunks)})"
                )

            logger.info(
                f"Successfully processed document {document_id} into {len(chunks)} chunks"
            )

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            if isinstance(self.db_session, AsyncSession):
                await self.db_session.rollback()
            else:
                self.db_session.rollback()
            raise
