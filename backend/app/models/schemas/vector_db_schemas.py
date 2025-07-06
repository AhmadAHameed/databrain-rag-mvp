from pydantic import BaseModel, Field

# TODO: CONTINUE HERE!!!!!!!!!!!!!!
class RecordSchema(BaseModel):
    id: str = Field(..., description="Unique identifier for the record")
    