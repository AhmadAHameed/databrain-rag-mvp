from typing import List, Dict, Any, Optional
from datetime import date
import httpx
from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Filter, FieldCondition, MatchValue, Range
from app.core.config.vector_store import get_vector_store_settings
from app.utils.logging_setup import create_logger
from app.models.schemas.search_result import SearchResult
from app.models.schemas.requests import DocumentFilter

logger = create_logger(__name__)


class QdrantVectorStore:
    def __init__(self):
        self.settings = get_vector_store_settings()
        self.client = QdrantClient(
            host=self.settings.QDRANT_HOST, port=self.settings.QDRANT_PORT
        )
        self.async_client = AsyncQdrantClient(
            host=self.settings.QDRANT_HOST, port=self.settings.QDRANT_PORT
        )
        self._ensure_collection_exists()

    def _ensure_collection_exists(self):
        """Ensure the collection exists, create it if it doesn't"""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]

            if self.settings.QDRANT_COLLECTION not in collection_names:
                self.client.create_collection(
                    collection_name=self.settings.QDRANT_COLLECTION,
                    vectors_config=models.VectorParams(
                        size=self.settings.VECTOR_SIZE, distance=models.Distance.COSINE
                    ),
                )
                logger.info(f"Created collection: {self.settings.QDRANT_COLLECTION}")
        except Exception as e:
            logger.error(f"Error ensuring collection exists: {str(e)}")
            raise

    def _process_filter_value(self, field: str, value):
        """Helper to process and normalize filter values for Qdrant FieldCondition."""
        try:
            if field == "document_id":
                # Always cast to int(s)
                if isinstance(value, list):
                    return [int(v) for v in value]
                else:
                    return int(value)
            else:
                # Convert string(s) to lowercase for consistency
                if isinstance(value, list):
                    return [str(v).lower() for v in value]
                else:
                    return str(value).lower()
        except Exception as e:
            print(f"Error processing filter value for field '{field}': {e}")
            return value  # fallback to original value if something goes wrong

    def _build_filter(self, filters: Optional[DocumentFilter]) -> Optional[Filter]:
        """Build Qdrant filter from DocumentFilter"""
        try:
            if not filters:
                return None

            must_conditions = []

            for field in ["division", "department", "document_id", "document_name"]:
                value = getattr(filters, field, None)
                if value:
                    processed_value = self._process_filter_value(field, value)

                    if isinstance(processed_value, list):
                        # OR logic for multiple values in one field
                        or_conditions = [
                            FieldCondition(key=field, match=MatchValue(value=v))
                            for v in processed_value
                        ]
                        must_conditions.append(
                            Filter(should=or_conditions)
                        )
                    else:
                        # Single condition
                        must_conditions.append(
                            FieldCondition(
                                key=field, match=MatchValue(value=processed_value)
                            )
                        )

            if must_conditions:
                return Filter(must=must_conditions)

            return None

        except Exception as e:
            print(f"Error building filter: {e}")
            return None

    async def store_vectors(
        self,
        vectors: List[List[float]],
        metadata: List[Dict[str, Any]],
        ids: List[str] = None,
    ):
        """Store vectors with their metadata in QDrant"""
        try:
            points = []
            for i, (vector, meta) in enumerate(zip(vectors, metadata)):
                point_id = ids[i] if ids and i < len(ids) else i
                points.append(
                    models.PointStruct(id=point_id, vector=vector, payload=meta)
                )

            self.client.upsert(
                collection_name=self.settings.QDRANT_COLLECTION, points=points
            )
            logger.info(f"Stored {len(vectors)} vectors in QDrant")
        except Exception as e:
            logger.error(f"Error storing vectors: {str(e)}")
            raise

    async def search_similar(
        self,
        query_vector: List[float],
        limit: int = 5,
        min_score: float = 0.3,
        filters: Optional[DocumentFilter] = None,
    ) -> List[SearchResult]:
        """
        Search for similar vectors in QDrant

        Args:
            query_vector: The vector to search for
            limit: Maximum number of results to return
            filters: Optional DocumentFilter to apply to the search

        Returns:
            List of SearchResult objects containing matched documents with their
            similarity scores and metadata
        """
        try:
            # Build filter if provided
            search_filter = self._build_filter(filters) if filters else None

            results = await self.async_client.search(
                collection_name=self.settings.QDRANT_COLLECTION,
                query_vector=query_vector,
                score_threshold=min_score,
                limit=limit,
                query_filter=search_filter,
            )

            search_results = []
            for hit in results:
                try:
                    # Extract payload and ensure required fields exist
                    payload = {k: v for k, v in hit.payload.items() if k != "content"}
                    content = hit.payload.get("content", "")

                    # Create SearchResult with validated data
                    result = SearchResult(
                        id=int(hit.id),
                        score=float(hit.score),
                        content=content,
                        payload=payload,
                    )
                    search_results.append(result)
                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping invalid search result: {str(e)}")
                    continue

            return search_results
        except Exception as e:
            logger.error(f"Error searching vectors: {str(e)}")
            raise

    async def update_payloads(
        self,
        ids: List[str],
        payloads: List[Dict[str, Any]],
    ):
        """Update payloads for existing vectors in QDrant"""
        for point_id, payload in zip(ids, payloads):
            try:
                await self.async_client.set_payload(
                    collection_name=self.settings.QDRANT_COLLECTION,
                    points=[point_id],
                    payload=payload,
                )
                logger.info(f"Updated payloads for {len(ids)} vectors in QDrant")
            except Exception as e:
                logger.error(f"Error updating payloads: {str(e)}")
                raise
