"""
Service health check utilities for validating external dependencies
"""
import asyncio
import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config.vector_store import get_vector_store_settings
from app.utils.logging_setup import create_logger
from typing import Dict, Any

logger = create_logger(__name__)

class ServiceHealthChecker:
    """Utility class for checking the health of external services"""
    
    @staticmethod
    async def check_database(db: AsyncSession) -> Dict[str, Any]:
        """Check PostgreSQL database connectivity"""
        try:
            await db.execute(text('SELECT 1'))
            return {"status": "healthy", "service": "postgresql", "error": None}
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return {"status": "unhealthy", "service": "postgresql", "error": str(e)}
    
    @staticmethod
    async def check_qdrant() -> Dict[str, Any]:
        """Check Qdrant vector database connectivity"""
        try:
            settings = get_vector_store_settings()
            qdrant_url = f"http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}"
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{qdrant_url}/")
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "healthy", 
                        "service": "qdrant", 
                        "version": data.get("version", "unknown"),
                        "error": None
                    }
                else:
                    return {
                        "status": "unhealthy", 
                        "service": "qdrant", 
                        "error": f"HTTP {response.status_code}"
                    }
        except Exception as e:
            logger.error(f"Qdrant health check failed: {str(e)}")
            return {"status": "unhealthy", "service": "qdrant", "error": str(e)}
    
    @staticmethod
    async def check_qdrant_collection() -> Dict[str, Any]:
        """Check if Qdrant collection exists and is accessible"""
        try:
            settings = get_vector_store_settings()
            qdrant_url = f"http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}"
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{qdrant_url}/collections")
                if response.status_code == 200:
                    collections = response.json()
                    collection_names = [c["name"] for c in collections.get("result", {}).get("collections", [])]
                    
                    if settings.QDRANT_COLLECTION in collection_names:
                        return {
                            "status": "healthy", 
                            "service": "qdrant_collection", 
                            "collection": settings.QDRANT_COLLECTION,
                            "error": None
                        }
                    else:
                        return {
                            "status": "missing", 
                            "service": "qdrant_collection", 
                            "collection": settings.QDRANT_COLLECTION,
                            "available_collections": collection_names,
                            "error": f"Collection '{settings.QDRANT_COLLECTION}' not found"
                        }
                else:
                    return {
                        "status": "unhealthy", 
                        "service": "qdrant_collection", 
                        "error": f"HTTP {response.status_code}"
                    }
        except Exception as e:
            logger.error(f"Qdrant collection health check failed: {str(e)}")
            return {"status": "unhealthy", "service": "qdrant_collection", "error": str(e)}
    
    @staticmethod
    async def check_ollama() -> Dict[str, Any]:
        """Check if Ollama service is available and has required models"""
        try:
            from app.core.config.vector_store import get_vector_store_settings
            settings = get_vector_store_settings()
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if response.status_code == 200:
                    models_data = response.json()
                    available_models = [model["name"] for model in models_data.get("models", [])]
                    
                    # Check if required models are available
                    required_models = [settings.OLLAMA_EMBEDDING_MODEL, settings.OLLAMA_CHAT_MODEL]
                    missing_models = [model for model in required_models if model not in available_models]
                    
                    if missing_models:
                        return {
                            "status": "missing_models", 
                            "service": "ollama", 
                            "available_models": available_models,
                            "required_models": required_models,
                            "missing_models": missing_models,
                            "error": f"Missing required models: {missing_models}"
                        }
                    else:
                        return {
                            "status": "healthy", 
                            "service": "ollama", 
                            "available_models": available_models,
                            "required_models": required_models,
                            "error": None
                        }
                else:
                    return {
                        "status": "unhealthy", 
                        "service": "ollama", 
                        "error": f"HTTP {response.status_code}"
                    }
        except Exception as e:
            logger.error(f"Ollama health check failed: {str(e)}")
            return {"status": "unhealthy", "service": "ollama", "error": str(e)}

    @staticmethod
    async def check_all_services(db: AsyncSession) -> Dict[str, Any]:
        """Check all required services for document processing"""
        try:
            # Run all health checks concurrently
            db_check, qdrant_check, collection_check, ollama_check = await asyncio.gather(
                ServiceHealthChecker.check_database(db),
                ServiceHealthChecker.check_qdrant(),
                ServiceHealthChecker.check_qdrant_collection(),
                ServiceHealthChecker.check_ollama(),
                return_exceptions=True
            )
            
            # Handle any exceptions from the checks
            checks = []
            for check in [db_check, qdrant_check, collection_check, ollama_check]:
                if isinstance(check, Exception):
                    checks.append({"status": "error", "error": str(check)})
                else:
                    checks.append(check)
            
            db_check, qdrant_check, collection_check, ollama_check = checks
            
            # Determine overall health
            all_healthy = all(
                check["status"] == "healthy" 
                for check in [db_check, qdrant_check, collection_check, ollama_check]
            )
            
            # Special cases where we can still proceed:
            # 1. Collection is missing but qdrant is healthy (can create collection)
            # 2. Ollama models are missing but service is running (can download models)
            can_proceed = all_healthy or (
                db_check["status"] == "healthy" and 
                qdrant_check["status"] == "healthy" and 
                collection_check["status"] == "missing" and
                ollama_check["status"] in ["healthy", "missing_models"]
            )
            
            # If only ollama models are missing, still can proceed with a warning
            if (db_check["status"] == "healthy" and 
                qdrant_check["status"] == "healthy" and 
                collection_check["status"] == "healthy" and 
                ollama_check["status"] == "missing_models"):
                can_proceed = True
            
            return {
                "overall_status": "healthy" if all_healthy else ("ready" if can_proceed else "unhealthy"),
                "can_process_documents": can_proceed,
                "services": {
                    "database": db_check,
                    "qdrant": qdrant_check,
                    "qdrant_collection": collection_check,
                    "ollama": ollama_check
                },
                "timestamp": str(asyncio.get_event_loop().time())
            }
            
        except Exception as e:
            logger.error(f"Service health check failed: {str(e)}")
            return {
                "overall_status": "error",
                "can_process_documents": False,
                "error": str(e),
                "timestamp": str(asyncio.get_event_loop().time())
            }
