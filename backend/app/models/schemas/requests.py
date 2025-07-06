from datetime import date
from typing import Dict, Optional, List, Union
from pydantic import BaseModel, Field

from app.utils.logging_setup import create_logger

logger = create_logger(__name__)

class DocumentFilter(BaseModel):
    """Filter parameters for document retrieval"""
    division: Optional[Union[str, List[str]]] = Field(None, description="Filter by division(s)")
    department: Optional[Union[str, List[str]]] = Field(None, description="Filter by department(s)")
    document_id: Optional[Union[int, List[int]]] = Field(None, description="Filter by document ID(s) (integer or list of integers)")
    document_name: Optional[Union[str, List[str]]] = Field(None, description="Filter by document name(s)")
    
    @classmethod
    def from_dict(cls, data: dict) -> "DocumentFilter":
        """Create a DocumentFilter instance from a dictionary"""
        valid_keys = {'division', 'department', 'document_id', 'document_name'}
        invalid_keys = set(data.keys()) - valid_keys
        if invalid_keys:
            logger.error(f"Invalid keys found: {invalid_keys}")
        return cls(**{k: v for k, v in data.items() if k in valid_keys})

    class Config:
        """Configuration for the DocumentFilter model"""
        json_schema_extra = {
            "example": {
                "division": ["Engineering", "Operations"],
                "department": ["IT", "HR"],
                "document_id": [123, 456],
                "document_name": ["Pipeline Safety", "Maintenance Guide"]
            }
        }


class RetrievalRequest(BaseModel):
    """Request parameters for document retrieval"""
    query: str = Field(..., description="The search query text", min_length=1)
    limit: int = Field(
        default=5, description="Maximum number of results to return", ge=1, le=20)
    offset: int = Field(
        default=0, description="Number of results to skip for pagination", ge=0)
    min_score: float = Field(
        default=0.0, description="Minimum similarity score threshold", ge=0.0, le=1.0)
    filters: Optional[DocumentFilter] = Field(
        None, description="Optional filtering parameters")

    class Config:
        """Configuration for the RetrievalRequest model"""
        json_schema_extra = {
            "example": {
                "query": "search query text",
                "limit": 5,
                "offset": 0,
                "min_score": 0.0,
                "filters": {
                    "division": ["Piping", "Civil"],
                    "department": ["Pipeline", "Design"],
                    "document_id": [12, 17],
                    "document_name": ["Pipeline Safety", "Maintenance Guide"]
                }
            }
        }


class GenerationRequest(BaseModel):
    """Request parameters for document generation with LLM"""
    query: str = Field(...,
                       description="The user's query or prompt", min_length=1)
    temperature: float = Field(
        default=0.7, description="LLM temperature parameter", ge=0.0, le=1.0)
    num_chunks: int = Field(
        default=5, description="Number of relevant chunks to retrieve", ge=1, le=100)
    min_score: float = Field(
        default=0.0, description="Minimum similarity score threshold", ge=0.0, le=1.0)
    type: str = Field(default="all", description="Type of search to perform")
    filters: Optional[DocumentFilter] = Field(
        None, description="Optional filtering parameters")
    context: Optional[str] = Field(
        None, description="Additional context for the generation")

    class Config:
        """Configuration for the GenerationRequest model"""
        json_schema_extra = {
            "example": {
                "query": "What are the safety procedures for pipeline maintenance?",
                "temperature": 0.7,
                "num_chunks": 3,
                "min_score": 0.3,
                "filters": {
                    "division": ["Piping", "Civil"],
                    "department": ["Pipeline", "Design"],
                    "document_id": [12, 17],
                    "document_name": ["Pipeline Safety", "Maintenance Guide"]
                }
            }
        }
