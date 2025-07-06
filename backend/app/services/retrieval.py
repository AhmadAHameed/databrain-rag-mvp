from functools import lru_cache
from typing import List, Dict, Any, Optional
from datetime import date
from app.services.embedding import EmbeddingsService
from app.infrastructure.vector_store.qdrant_store import QdrantVectorStore
from app.utils.logging_setup import create_logger
from app.models.schemas.requests import DocumentFilter
from app.models.schemas.search_result import SearchResult  # Add this import

logger = create_logger(__name__)

class RetrievalService:
    def __init__(self):
        self.embeddings_service = EmbeddingsService()
        self.vector_store = QdrantVectorStore()

    async def retrieve_similar(
        self,
        query: str,
        limit: int = 5,
        min_score: float = 0.3,
        filters: Optional[DocumentFilter] = None
    ) -> List[SearchResult]:
        """
        Retrieve similar documents based on query and filters
        
        Args:
            query: The search query text
            limit: Maximum number of results to return
            filters: Optional DocumentFilter for refining search results
            
        Returns:
            List[SearchResult]: List of search results with their metadata and scores
        """
        try:
            # Generate embedding for query
            query_embedding = (await self.embeddings_service.get_embeddings([query]))[0]

            # Search for similar vectors
            search_results_list = await self.vector_store.search_similar(
                query_vector=query_embedding,
                min_score=min_score,
                limit=limit,
                filters=filters  # Pass the DocumentFilter object directly
            )

            # Process and validate results
            processed_results = []
            for result in search_results_list:
                # Skip results with missing required metadata
                payload = result.payload
                if not all(k in payload for k in ["chunk_id", "document_id", "uuid"]):
                    continue
                
                processed_results.append(result)

            return processed_results
        except Exception as e:
            logger.error(f"Error retrieving similar documents: {str(e)}")
            raise

    async def store_embeddings(
        self,
        texts: List[str],
        metadata: List[Dict[str, Any]],
        ids: List[str] = None,
    ):
        """
        Generate and store embeddings for new documents
        """
        try:
            # Generate embeddings for all texts
            embeddings = await self.embeddings_service.get_embeddings(texts)

            # Store embeddings in vector store
            await self.vector_store.store_vectors(
                vectors=embeddings,
                metadata=metadata,
                ids=ids,
            )

            return True
        except Exception as e:
            logger.error(f"Error storing embeddings: {str(e)}")
            raise
    
    async def update_payloads(
        self,
        ids: List[str],
        payloads: List[Dict[str, Any]],
    ):
        """
        Update payloads for existing vectors in the vector store
        """
        try:
            await self.vector_store.update_payloads(
                ids=ids,
                payloads=payloads,
            )
            return True
        except Exception as e:
            logger.error(f"Error updating payloads: {str(e)}")
            raise


    async def search_similar_chunks(
        self, query_text: str, limit: int = 5
    ) -> List[SearchResult]:
        """Search for similar chunks using the query text"""
        try:
            # Use the existing retrieve_similar method
            results = await self.retrieve_similar(
                query=query_text, limit=limit
            )
            return results
        except Exception as e:
            logger.error(f"Error searching similar chunks: {str(e)}")
            raise

@lru_cache(maxsize=128)
def get_retrieval_service() -> RetrievalService:
    """
    Get a singleton instance of the RetrievalService
    """
    return RetrievalService()