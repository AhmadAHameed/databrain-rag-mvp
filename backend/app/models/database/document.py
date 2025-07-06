from sqlalchemy import Column, DateTime, Integer, String, ForeignKey, func
from sqlalchemy.orm import relationship
import datetime

from .sqlalchemy_base import SqlAlchemyBase
from ..enums import DocumentStatus


class Document(SqlAlchemyBase):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    department = Column(String, nullable=False)
    division = Column(String, nullable=False)
    location = Column(String, nullable=False)
    created_at = Column(
        DateTime(timezone=True), default=func.now(), server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )

    chunks = relationship("DocumentChunk", back_populates="document")

    status = Column(String, nullable=False, default=DocumentStatus.PENDING.value)

    def __repr__(self):
        return f"<Document {self.title}>"
