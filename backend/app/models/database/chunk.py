import datetime
from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func, Index, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .sqlalchemy_base import SqlAlchemyBase


class DocumentChunk(SqlAlchemyBase):
    __tablename__ = "document_chunks"

    # Primary and unique identifiers
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True)
    document_id = Column(
        Integer, ForeignKey("documents.id"), nullable=False, index=True
    )

    # Content fields
    content = Column(
        Text, nullable=False
    )  # Using Text instead of String for larger content
    document_page = Column(Integer, nullable=True)

    chunk_metadata = Column(JSONB, nullable=True)
    # Metadata fields
    created_at = Column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    document = relationship("Document", back_populates="chunks")

    status = Column(String, nullable=False, default="pending")

    # Add useful indexes
    __table_args__ = (
        Index("idx_document_chunks_document_page", "document_id", "document_page"),
    )

    def __repr__(self):
        return (
            f"<DocumentChunk id={self.id} uuid={self.uuid} doc_id={self.document_id}>"
        )
