from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ChunkMetadata(BaseModel):
    chunk_id: Optional[int]
    document_id: Optional[int]
    document_page: Optional[int]
    uuid: Optional[str]
    document_type: Optional[str]
    department: Optional[str]
    division: Optional[str]
    document_nature: Optional[str]
    created_at: Optional[datetime]

class SearchResultItem(BaseModel):
    score: float = Field(..., description="Similarity score of the result")
    content: str = Field(..., description="Text content of the chunk")
    metadata: ChunkMetadata = Field(..., description="Metadata about the chunk")
    extra_info: Optional[Dict[str, Any]] = Field(None, description="Additional metadata from chunk_metadata")

class SearchResponse(BaseModel):
    results: List[SearchResultItem] = Field(..., description="List of search results")
    query: str = Field(..., description="Original search query")
    total_results: int = Field(..., description="Total number of results found")
