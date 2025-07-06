from pydantic import BaseModel, Field

class DocumentChunk(BaseModel):
    id: int = Field(..., description="Unique identifier for the document chunk")
    title: str = Field(..., description="Title of the document chunk")
    department: str = Field(..., description="Department associated with the document chunk")
    division: str = Field(..., description="Division associated with the document chunk")
    location: str = Field(..., description="Location associated with the document chunk")
    content: str = Field(..., description="Content of the document chunk")
    created_at: str = Field(..., description="Timestamp when the document chunk was created")
    updated_at: str = Field(..., description="Timestamp when the document chunk was last updated")
    page: int = Field(..., description="Page number of the document chunk")
    document_id: int = Field(..., description="ID of the document to which this chunk belongs")