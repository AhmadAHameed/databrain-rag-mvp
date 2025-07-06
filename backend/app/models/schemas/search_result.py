from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class SearchResult(BaseModel):
    id: int = Field(..., description="Unique identifier for the search result")
    score: float = Field(
        ..., description="Similarity score of the search result (0.0 to 1.0)"
    )
    content: str = Field(..., description="Content of the search result")
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata associated with the search result",
    )

    @field_validator("score")
    def validate_score(cls, v):
        """Ensure score is between 0 and 1"""
        if not 0 <= v <= 1:
            raise ValueError("Score must be between 0 and 1")
        return v

    @field_validator("payload")
    def validate_payload(cls, v):
        """Ensure required payload fields are present"""
        required_fields = {"chunk_id", "document_id", "uuid"}
        if not all(field in v for field in required_fields):
            raise ValueError(f"Payload must contain fields: {required_fields}")
        return v

    def to_dict(self) -> dict:
        """Convert the SearchResult instance to a dictionary."""
        return {
            "id": self.id,
            "score": self.score,
            "content": self.content,
            "payload": self.payload,
        }

    def to_json(self) -> str:
        """Convert the SearchResult instance to a JSON string."""
        return self.model_dump_json()

    class Config:
        json_encoders = {
            # Round similarity scores to 4 decimal places
            float: lambda v: round(v, 4)
        }
