from enum import Enum


class DocumentStatus(str, Enum):
    """
    Enum for document processing status
    
    Status Flow:
    PENDING -> PROCESSING -> CHUNKED -> PROCESSING -> COMPLETED
                         \\-> ERROR (at any stage)
    """
    PENDING = "pending"         # Document uploaded, not yet processed
    PROCESSING = "processing"   # Currently being chunked or having embeddings generated
    CHUNKED = "chunked"        # Chunking completed, ready for embedding
    COMPLETED = "completed"     # Fully processed (chunked + embedded)
    ERROR = "error"            # Processing failed at any stage

    def __str__(self):
        return self.value

    @classmethod
    def get_description(cls, status: str) -> str:
        """Get human-readable description of the status"""
        descriptions = {
            cls.PENDING: "Document uploaded, waiting to be processed",
            cls.PROCESSING: "Document is currently being processed", 
            cls.CHUNKED: "Document has been chunked, ready for embedding generation",
            cls.COMPLETED: "Document has been fully processed and is ready for use",
            cls.ERROR: "An error occurred during document processing"
        }
        return descriptions.get(status, "Unknown status")

    @classmethod
    def is_processing_status(cls, status: str) -> bool:
        """Check if status indicates active processing"""
        return status in [cls.PROCESSING]

    @classmethod
    def is_completed_status(cls, status: str) -> bool:
        """Check if status indicates completion"""
        return status in [cls.CHUNKED, cls.COMPLETED]

    @classmethod
    def is_error_status(cls, status: str) -> bool:
        """Check if status indicates an error"""
        return status == cls.ERROR

    @classmethod
    def can_be_chunked(cls, status: str) -> bool:
        """Check if document can be chunked from current status"""
        return status in [cls.PENDING, cls.ERROR, cls.CHUNKED]  # Allow re-chunking

    @classmethod
    def can_be_embedded(cls, status: str) -> bool:
        """Check if document can have embeddings generated from current status"""
        return status in [cls.CHUNKED, cls.ERROR, cls.COMPLETED]  # Allow re-embedding
