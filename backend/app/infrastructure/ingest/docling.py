from typing import List
import pickle
import os
from app.models.database.chunk import DocumentChunk
from app.utils.logging_setup import create_logger
from .base_chunking import BaseChunking
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter as DoclingDocumentConverter
import uuid
from pathlib import Path
from docling_core.types.doc.document import DoclingDocument
from docling_core.transforms.chunker.base import BaseChunk


logger = create_logger(__name__)

class DoclingChunking(BaseChunking):
    """Docling-based document chunking implementation"""

    def __init__(self):
        super().__init__()
        self._chunker = None
        self._document_converter = None
        self.cache_dir = Path("_development/temp/doc_cache")
        # Create cache directory if it doesn't exist
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    @property
    def chunker(self):
        if not self._chunker:
            self._chunker = self._create_chunker()
        return self._chunker

    def _create_chunker(self):
        """Create a chunker instance with the specified parameters."""
        # Use smaller token limit and disable memory-intensive features
        return HybridChunker(
            max_tokens=256,  # Reduced from 400 to 256
            merge_peers=False,  # Disable merging to reduce memory usage
        )

    def _get_cache_path(self, file_path: str) -> Path:
        """Get the cache file path for a given document"""
        file_hash = str(hash(Path(file_path).read_bytes()))
        return self.cache_dir / f"{Path(file_path).stem}_{file_hash}.pkl"

    @property
    def document_converter(self):
        """Lazy initialization of document converter to handle model loading errors gracefully"""
        if not self._document_converter:
            try:
                # Configure DocumentConverter with memory optimizations
                from docling.document_converter import DocumentConverter as DoclingDocumentConverter
                
                # Initialize with minimal memory usage
                self._document_converter = DoclingDocumentConverter()
                logger.info("DocumentConverter initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize DocumentConverter: {str(e)}")
                raise RuntimeError(f"Failed to initialize document converter: {str(e)}")
        return self._document_converter

    def read_document(self, file_path: str) -> DoclingDocument:
        """
        Read a PDF document and return its text content.
        Uses caching to speed up development and includes memory optimizations.
        """
        try:
            if not Path(file_path).exists():
                raise FileNotFoundError(f"The file at path {file_path} does not exist.")
            
            # Check file size first to prevent memory issues
            file_size = Path(file_path).stat().st_size
            max_size = 50 * 1024 * 1024  # 50MB limit
            if file_size > max_size:
                raise ValueError(f"File too large ({file_size / 1024 / 1024:.1f}MB). Maximum allowed size is {max_size / 1024 / 1024}MB")
            
            cache_path = self._get_cache_path(file_path)
            
            # Try to load from cache first
            if cache_path.exists():
                try:
                    logger.info(f"Loading document from cache: {cache_path}")
                    with open(cache_path, 'rb') as f:
                        return pickle.load(f)
                except Exception as e:
                    logger.warning(f"Failed to load from cache, will reprocess: {e}")
                    # Continue to reprocess if cache is corrupted
            
            # If not in cache, convert and store
            logger.info(f"Converting document: {file_path}")
            document = self.document_converter.convert(source=file_path)
            result = document.document
            
            # Cache the result (with error handling)
            try:
                logger.info(f"Caching converted document: {cache_path}")
                with open(cache_path, 'wb') as f:
                    pickle.dump(result, f)
            except Exception as e:
                logger.warning(f"Failed to cache document: {e}")
                # Continue without caching
            
            return result
        except FileNotFoundError as e:
            logger.error(f"File not found: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Failed to read document {file_path}: {str(e)}")
            # Check if it's a model loading issue
            if "Missing safe tensors file" in str(e) or "layout_predictor" in str(e):
                raise Exception(
                    f"Docling model files are missing or corrupted. "
                    f"Please run 'python initialize_docling_models.py' to download the required models. "
                    f"Original error: {str(e)}"
                )
            raise Exception(f"Failed to read document: {str(e)}")

    def chunk_pdf_document(
        self, pdf_path: str, document_id: int = None, *args, **kwargs
    ) -> List[DocumentChunk]:
        """
        Chunk a PDF document using the Docling library.
        Args:
            pdf_path: Path to the PDF file
            document_id: Optional document ID to associate with chunks
        Returns:
            List of DocumentChunk objects with metadata
        """
        document = self.read_document(pdf_path)
        return self.chunk_general_document(document, document_id)

    def chunk_general_document(
        self, document: DoclingDocument, document_id: int = None
    ) -> List[DocumentChunk]:
        """
        Chunk any text content using the Docling library.
        Args:
            text_content: The text content to chunk
            document_id: Optional document ID to associate with chunks
        Returns:
            List of DocumentChunk objects
        """
        chunks = self.chunker.chunk(document)
        chunks_schemas = [
            DocumentChunk(
                uuid=str(uuid.uuid4()),
                content=chunk.text,
                document_id=document_id,
                document_page=self.get_document_page(chunk),  # Get page from metadata
                chunk_metadata=chunk.meta.export_json_dict(),
            )
            for chunk in chunks
        ]
        return chunks_schemas
    
    def get_document_page(self, chunk: BaseChunk):
        try:
            # Extract the page number from the chunk metadata
            metadata = chunk.meta.export_json_dict()
            page_number = metadata["doc_items"][0]["prov"][0]["page_no"]
            return page_number
        except Exception as e:
            logger.error(f"Failed to get document page: {str(e)}")
            return None

    def chunk_page_content(self, content: str) -> List[DocumentChunk]:
        """
        Chunk a single page content.
        """
        return self.chunk_general_document(content)
