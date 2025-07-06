from qdrant_client import QdrantClient
from qdrant_client import models



def update_payload(client: QdrantClient, collection_name: str, doc_id: str, payload: dict):
    """
    Update the payload of a document in Qdrant.

    Args:
        client (QdrantClient): The Qdrant client instance.
        collection_name (str): The name of the collection.
        doc_id (str): The ID of the document to update.
        payload (dict): The new payload to set for the document.

    Returns:
        None
    """
    client.update_payload(
        collection_name=collection_name,
        points_selector=models.PointIdsListSelector(point_ids=[doc_id]),
        payload=payload,
    )

if __name__ == "__main__":
    # Example usage
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    
    from app.core.config.vector_store import get_vector_store_settings
    from app.models.database import DocumentChunk
    
    vector_store_settings = get_vector_store_settings()
    client = QdrantClient(
        host=vector_store_settings.QDRANT_HOST, 
        port=vector_store_settings.QDRANT_PORT, 
        prefer_grpc=True
    )
    
    update_payload(
        client=client, collection_name=vector_store_settings.QDRANT_COLLECTION
    )
    