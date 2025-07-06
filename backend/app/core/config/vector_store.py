from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings


class VectorStoreSettings(BaseSettings):
    model_config: ConfigDict = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    QDRANT_HOST: str = Field("localhost", description="QDrant server host")
    QDRANT_PORT: int = Field(6333, description="QDrant server port")
    QDRANT_COLLECTION: str = Field("rag_mvp", description="QDrant collection name")
    OLLAMA_BASE_URL: str = Field("http://ollama:11434", description="Ollama API base URL")
    OLLAMA_CHAT_MODEL: str = Field("qwen2.5:0.5b", description="Ollama chat model to use")
    OLLAMA_EMBEDDING_MODEL: str = Field("nomic-embed-text:latest", description="Ollama embedding model to use")
    VECTOR_SIZE: int = Field(768, description="Size of embedding vectors")
    MIN_SIMILARITY_SCORE: float = Field(0.6, description="Minimum similarity score threshold for including results")


def get_vector_store_settings():
    """Get vector store settings. Reads from .env file each time."""
    return VectorStoreSettings()
