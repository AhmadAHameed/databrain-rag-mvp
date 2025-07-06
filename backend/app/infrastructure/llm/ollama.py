import httpx
from typing import List, Dict, Any
import json

from ollama import chat, embed, ChatResponse, EmbedResponse, AsyncClient, Client

from app.core.config.vector_store import get_vector_store_settings
from app.utils.logging_setup import create_logger


logger = create_logger(__name__)


class OllamaService:
    def __init__(self):
        self.settings = get_vector_store_settings()
        self.embed_url = f"{self.settings.OLLAMA_BASE_URL}/api/embeddings"
        self._async_client = None
        self._client = None
        self.EMBEDDING_MODEL = self.settings.OLLAMA_EMBEDDING_MODEL
        self.CHAT_MODEL = self.settings.OLLAMA_CHAT_MODEL

    @property
    def async_client(self) -> AsyncClient:
        """Get async client for Ollama"""
        if not self._async_client:
            self._async_client = AsyncClient(host=self.settings.OLLAMA_BASE_URL)
        return self._async_client

    @property
    def client(self) -> Client:
        """Get sync client for Ollama"""
        if not self._client:
            self._client = Client(host=self.settings.OLLAMA_BASE_URL)
        return self._client

    async def _get_embedding(self, text_list: List[str]) -> List[float]:
        """Get embeddings for a single text using Ollama"""
        try:
            embed_response = await self.async_client.embed(model=self.EMBEDDING_MODEL, input=text_list)
            return embed_response.embeddings
        except Exception as e:
            logger.error(f"Error getting embedding from Ollama: {str(e)}")
            raise

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for multiple texts"""
        embeddings = await self._get_embedding(texts)
        return embeddings

    async def get_query_embeddings(self, queries: List[str]) -> List[float]:
        """Get embeddings for a single query"""
        try:
            queries_embed_response = await self._get_embedding(queries)
            return queries_embed_response
        except Exception as e:
            logger.error(f"Error getting query embedding from Ollama: {str(e)}")
            raise
    
    async def chat_stream(self, messages: List[Dict[str, str]], temperature: float = 0.7):
        """
        Stream chat completions from Ollama as chunks (for SSE or real-time UI updates).
        Yields each chunk's message content as it arrives.
        """
        logger.debug(f"Streaming chat request to Ollama with {len(messages)} messages")
        if not messages:
            raise ValueError("Messages list cannot be empty")
        if not all(isinstance(m, dict) and 'role' in m and 'content' in m for m in messages):
            raise ValueError("Each message must be a dictionary with 'role' and 'content' keys")
        if not 0.0 <= temperature <= 2.0:
            raise ValueError("Temperature must be between 0.0 and 2.0")

        try:
            # Returns an async generator
            stream = await self.async_client.chat(
                model=self.CHAT_MODEL,
                messages=messages,
                options={"temperature": temperature},
                stream=True
            )
            async for chunk in stream:
                if chunk and 'message' in chunk and 'content' in chunk['message']:
                    yield chunk['message']['content']
        except Exception as e:
            logger.error(f"Ollama streaming error: {str(e)}")
            raise

    async def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> Dict[str, Any]:

        """
        Send a chat request to Ollama
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            temperature: Sampling temperature (0.0 to 1.0)
        """
        try:
            logger.debug(f"Sending chat request to Ollama with {len(messages)} messages")
            
            # Validate input parameters
            if not messages:
                raise ValueError("Messages list cannot be empty")
            
            if not all(isinstance(m, dict) and 'role' in m and 'content' in m for m in messages):
                raise ValueError("Each message must be a dictionary with 'role' and 'content' keys")
            
            if not 0.0 <= temperature <= 2.0:
                raise ValueError("Temperature must be between 0.0 and 2.0")

            try:
                response = await self.async_client.chat(
                    model=self.CHAT_MODEL,
                    messages=messages,
                    options={"temperature": temperature}
                )
                
                if not response or 'message' not in response:
                    raise ValueError("Invalid response from Ollama API")
                    
                return response
                
            except Exception as e:
                logger.error(f"Ollama API error: {str(e)}")
                if "connection" in str(e).lower():
                    raise ConnectionError(f"Failed to connect to Ollama service: {str(e)}")
                raise
                
        except ValueError as e:
            logger.warning(f"Invalid parameters in chat request: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error in chat with Ollama: {str(e)}", exc_info=True)
            raise