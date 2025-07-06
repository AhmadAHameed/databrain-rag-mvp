from abc import ABC, abstractmethod
from typing import Any, List


class BaseChunking(ABC):
    @abstractmethod
    def chunk_page_content(self, data: Any) -> List[Any]:
        pass

    @abstractmethod
    def chunk_pdf_document(self, pdf_path:str, *args, **kwargs) -> List[Any]:
        pass
    
    @abstractmethod
    def chunk_general_document(self, data: Any) -> List[Any]:
        """Check document type and start chunking accordingly"""
        pass

