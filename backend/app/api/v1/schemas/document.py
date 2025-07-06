from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DocumentCreate(BaseModel):
    title: str = Field(..., description="Document title")
    department: str = Field(..., description="Department the document belongs to")
    division: str = Field(..., description="Division the document belongs to")
    location: str = Field(..., description="Document location/storage path")

class DocumentResponse(BaseModel):
    id: int
    uuid: str
    title: str
    department: str
    division: str
    location: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class DocumentChunkResponse(BaseModel):
    id: int
    uuid: str
    content: str
    document_page: Optional[int]
    document_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
