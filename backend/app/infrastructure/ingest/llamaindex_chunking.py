import os
from typing import Any, List
from llama_index.core.schema import Document
from llama_index.readers.file import PyMuPDFReader
from .base_chunking import BaseChunking
from app.utils.logging_setup import create_logger

logger = create_logger(__name__, log_file_name="llamaindex_chunking.log")


class LlamaIndexChunking(BaseChunking):
    def __init__(self):
        self._pdf_reader = None

    @property
    def pdf_reader(self):
        if not self._pdf_reader:
            self._pdf_reader = PyMuPDFReader()
        return self._pdf_reader

    def chunk_page_content(self, data: Any) -> List[Any]:
        """Chunk the page content"""
        pass

    def chunk_pdf_document(self, pdf_path: str, *args, **kwargs) -> List[Any]:
        pdf_docs = self.load_pdf_file(pdf_path)
        for doc in pdf_docs:
            ""
        pass

    def load_pdf_file(self, pdf_path: str) -> List[Document]:
        
        if not os.path.exists(pdf_path):
            logger.error(f"PDF file not found: {pdf_path}")
            return

        try:
            docs = self.pdf_reader.load(pdf_path)
            if not docs or len(docs) == 0:
                logger.error("No documents found in the PDF file")

            return docs
        except Exception as e:
            logger.error(f"Failed to load PDF file: {e}")

    def chunk_general_document(self, data):
        """Shall check document type and start chunking accordingly"""
        pass
