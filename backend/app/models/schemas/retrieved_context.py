from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RetrievedContextMetadata(BaseModel):
    """
    Metadata associated with a context, providing additional information
    about its origin, processing, and characteristics.
    """

    source_id: Optional[str] = Field(
        None, description="Unique identifier of the source document"
    )
    chunk_id: Optional[str] = Field(
        None, description="Unique identifier for this specific context chunk"
    )
    document_type: Optional[str] = Field(
        None, description="Type of document the context is derived from"
    )
    department: Optional[str] = Field(
        None, description="Department associated with the context"
    )
    division: Optional[str] = Field(
        None, description="Division associated with the context"
    )

    # Provenance tracking
    created_at: Optional[str] = Field(None, description="Timestamp of context creation")
    processed_by: Optional[str] = Field(
        None, description="Service or method that processed this context"
    )

    # Processing metadata
    relevance_score: Optional[float] = Field(
        None, description="Relevance score of the context"
    )
    extraction_method: Optional[str] = Field(
        None, description="Method used to extract this context"
    )
    document_name: Optional[str] = Field(
        None, description="Name of the document from which the context was extracted"
    )

    document_page_no: Optional[int] = Field(
        None, description="Page number of the document from which the context was extracted"
    )

    def to_dict(self) -> dict:
        """Convert the RetrievedContextMetadata object to a serializable dictionary."""
        return {
            "source_id": self.source_id,
            "chunk_id": self.chunk_id,
            "document_type": self.document_type,
            "department": self.department,
            "division": self.division,
            "created_at": self.created_at,
            "processed_by": self.processed_by,
            "relevance_score": self.relevance_score,
            "extraction_method": self.extraction_method,
            "document_name": self.document_name,
            "document_page_no": self.document_page_no,
        }


class RetrievedContext(BaseModel):
    """
    Represents a context unit with its textual content and associated metadata.
    """

    text: str = Field(..., description="The actual textual content of the context")
    metadata: RetrievedContextMetadata = Field(
        default_factory=RetrievedContextMetadata,
        description="Metadata associated with the context",
    )

    # Optional additional fields for flexibility
    embeddings: Optional[List[float]] = Field(
        None, description="Vector embeddings for the context"
    )
    tags: Optional[List[str]] = Field(
        None, description="Tags associated with the context"
    )

    # Additional context-specific attributes
    start_index: Optional[int] = Field(
        None, description="Starting index of the context in the original document"
    )
    end_index: Optional[int] = Field(
        None, description="Ending index of the context in the original document"
    )

    def to_dict(self) -> dict:
        """Convert the RetrievedContext object to a serializable dictionary."""
        return {
            "content": self.text,
            "score": self.metadata.relevance_score,
            "metadata": self.metadata.to_dict(),
        }


class RetrievedContextCollection(BaseModel):
    """
    A collection of contexts, typically used for batch processing or retrieval.
    """

    contexts: List[RetrievedContext] = Field(
        default_factory=list, description="List of context objects"
    )
    total_contexts: int = Field(
        0, description="Total number of contexts in the collection"
    )

    # Collection-level metadata
    collection_id: Optional[str] = Field(
        None, description="Unique identifier for this collection of contexts"
    )
    retrieval_params: Optional[Dict[str, Any]] = Field(
        None, description="Parameters used for context retrieval"
    )

    def add_context(self, context: RetrievedContext):
        """
        Add a context to the collection.

        :param context: Context to be added
        """
        self.contexts.append(context)
        self.total_contexts = len(self.contexts)

    def filter_by_relevance(
        self, threshold: float = 0.5
    ) -> "RetrievedContextCollection":
        """
        Filter contexts by relevance score.

        :param threshold: Minimum relevance score to include
        :return: New RetrievedContextCollection with filtered contexts
        """
        filtered_contexts = RetrievedContextCollection()
        filtered_contexts.contexts = [
            ctx
            for ctx in self.contexts
            if ctx.metadata.relevance_score is not None
            and ctx.metadata.relevance_score >= threshold
        ]
        filtered_contexts.total_contexts = len(filtered_contexts.contexts)
        return filtered_contexts
