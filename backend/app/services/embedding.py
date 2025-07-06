# Provider-agnostic EmbeddingsService: wraps OllamaService (or other providers in future)
from app.infrastructure.llm.ollama import OllamaService
from app.utils.logging_setup import create_logger


logger = create_logger(__name__)


class EmbeddingsService:
    """
    Service for handling text embeddings, acting as a layer between API/business logic and embedding providers (Ollama, etc).
    Use this class in retrieval, generation, etc. to decouple from provider details.
    """

    def __init__(self, provider=None):
        # Default to OllamaService, but allow injection for testing or future providers
        self.provider = provider or OllamaService()

    async def get_embedding(self, text: str):
        """
        Get the embedding vector for a single text (async).
        Returns a list of floats.
        """
        try:
            # OllamaService expects a list of texts
            embeddings = await self.provider.get_embeddings([text])
            return embeddings[0]
        except Exception as e:
            logger.error(f"Failed to get embedding: {e}")
            raise

    async def get_embeddings(self, texts: list):
        """
        Get embeddings for a list of texts (async).
        Returns a list of embedding vectors.
        """
        try:
            return await self.provider.get_embeddings(texts)
        except Exception as e:
            logger.error(f"Failed to get embeddings: {e}")
            raise
