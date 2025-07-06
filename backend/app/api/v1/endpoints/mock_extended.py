"""
Mock API Testing and Demo Endpoints

This module provides mock endpoints for testing and demonstrating the API functionality
without requiring actual services to be running. Useful for frontend development and testing.
"""

from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import random
import uuid
from datetime import datetime, timedelta

router = APIRouter()

class MockSystemInfo(BaseModel):
    system_status: str = Field(..., description="Overall system status")
    api_version: str = Field(..., description="API version")
    active_connections: int = Field(..., description="Number of active connections")
    total_documents: int = Field(..., description="Total documents in system")
    total_chunks: int = Field(..., description="Total document chunks")
    vector_db_status: str = Field(..., description="Vector database status")
    llm_status: str = Field(..., description="LLM service status")
    uptime: str = Field(..., description="System uptime")

class MockPerformanceMetrics(BaseModel):
    avg_search_time: float = Field(..., description="Average search time in milliseconds")
    avg_generation_time: float = Field(..., description="Average generation time in milliseconds")
    cache_hit_rate: float = Field(..., description="Cache hit rate percentage")
    requests_per_minute: int = Field(..., description="Requests per minute")
    error_rate: float = Field(..., description="Error rate percentage")

class MockQuerySuggestion(BaseModel):
    query: str = Field(..., description="Suggested query text")
    category: str = Field(..., description="Query category")
    popularity: int = Field(..., description="Query popularity score")

@router.get("/mock/system-info", response_model=MockSystemInfo)
async def mock_get_system_info():
    """
    Mock endpoint for system information and health status
    """
    return MockSystemInfo(
        system_status="healthy",
        api_version="1.0.0",
        active_connections=random.randint(5, 25),
        total_documents=random.randint(100, 1000),
        total_chunks=random.randint(1000, 10000),
        vector_db_status="operational",
        llm_status="operational",
        uptime=f"{random.randint(1, 30)} days, {random.randint(0, 23)} hours"
    )

@router.get("/mock/performance", response_model=MockPerformanceMetrics)
async def mock_get_performance_metrics():
    """
    Mock endpoint for performance metrics
    """
    return MockPerformanceMetrics(
        avg_search_time=random.uniform(150, 300),
        avg_generation_time=random.uniform(2000, 5000),
        cache_hit_rate=random.uniform(75, 95),
        requests_per_minute=random.randint(10, 50),
        error_rate=random.uniform(0.1, 2.0)
    )

@router.get("/mock/suggestions", response_model=List[MockQuerySuggestion])
async def mock_get_query_suggestions(category: Optional[str] = None):
    """
    Mock endpoint for query suggestions
    """
    suggestions = [
        MockQuerySuggestion(query="What are the safety procedures for pipeline maintenance?", category="safety", popularity=95),
        MockQuerySuggestion(query="How to calibrate pressure measurement equipment?", category="technical", popularity=87),
        MockQuerySuggestion(query="Environmental compliance requirements for industrial operations", category="environmental", popularity=78),
        MockQuerySuggestion(query="Quality control standards for material inspection", category="quality", popularity=82),
        MockQuerySuggestion(query="Project management best practices for engineering projects", category="project", popularity=75),
        MockQuerySuggestion(query="Emergency response procedures for equipment failure", category="safety", popularity=91),
        MockQuerySuggestion(query="Maintenance schedules for rotating equipment", category="technical", popularity=68),
        MockQuerySuggestion(query="Waste management protocols and procedures", category="environmental", popularity=71),
        MockQuerySuggestion(query="Document control and version management", category="quality", popularity=64),
        MockQuerySuggestion(query="Risk assessment methodologies", category="project", popularity=79),
    ]
    
    if category:
        suggestions = [s for s in suggestions if s.category == category]
    
    return suggestions

@router.get("/mock/trending-queries")
async def mock_get_trending_queries():
    """
    Mock endpoint for trending search queries
    """
    trending = [
        {"query": "safety procedures", "count": 156, "trend": "+12%"},
        {"query": "equipment maintenance", "count": 134, "trend": "+8%"},
        {"query": "environmental compliance", "count": 112, "trend": "+15%"},
        {"query": "quality standards", "count": 98, "trend": "+5%"},
        {"query": "project guidelines", "count": 87, "trend": "+3%"},
    ]
    
    return {
        "trending_queries": trending,
        "time_period": "last 7 days",
        "total_searches": sum(item["count"] for item in trending)
    }

@router.get("/mock/departments")
async def mock_get_departments():
    """
    Mock endpoint for available departments
    """
    departments = [
        {"name": "Safety", "document_count": 45, "last_updated": "2024-05-28"},
        {"name": "Engineering", "document_count": 78, "last_updated": "2024-05-29"},
        {"name": "Quality", "document_count": 32, "last_updated": "2024-05-27"},
        {"name": "Environmental", "document_count": 28, "last_updated": "2024-05-30"},
        {"name": "Project Management", "document_count": 41, "last_updated": "2024-05-26"},
        {"name": "Operations", "document_count": 56, "last_updated": "2024-05-29"},
        {"name": "HSE", "document_count": 39, "last_updated": "2024-05-28"},
    ]
    
    return {
        "departments": departments,
        "total_departments": len(departments),
        "total_documents": sum(dept["document_count"] for dept in departments)
    }

@router.get("/mock/document-types")
async def mock_get_document_types():
    """
    Mock endpoint for available document types
    """
    doc_types = [
        {"type": "PDF", "count": 156, "percentage": 62.4},
        {"type": "DOCX", "count": 78, "percentage": 31.2},
        {"type": "TXT", "count": 16, "percentage": 6.4},
    ]
    
    return {
        "document_types": doc_types,
        "total_documents": sum(doc["count"] for doc in doc_types)
    }

@router.post("/mock/feedback")
async def mock_submit_feedback(
    query: str = Query(..., description="Original query"),
    response_quality: int = Query(..., ge=1, le=5, description="Response quality rating (1-5)"),
    helpful: bool = Query(..., description="Was the response helpful?"),
    comments: Optional[str] = Query(None, description="Additional comments")
):
    """
    Mock endpoint for user feedback submission
    """
    feedback_id = str(uuid.uuid4())
    
    return {
        "feedback_id": feedback_id,
        "message": "Thank you for your feedback!",
        "query": query,
        "rating": response_quality,
        "helpful": helpful,
        "comments": comments,
        "submitted_at": datetime.now().isoformat()
    }

@router.get("/mock/search-history")
async def mock_get_search_history(limit: int = Query(10, ge=1, le=50)):
    """
    Mock endpoint for user search history
    """
    history_items = [
        {
            "query": "safety procedures for pipeline maintenance",
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
            "results_count": 8,
            "response_time": 1.2
        },
        {
            "query": "equipment calibration standards",
            "timestamp": (datetime.now() - timedelta(hours=5)).isoformat(),
            "results_count": 12,
            "response_time": 0.9
        },
        {
            "query": "environmental compliance requirements",
            "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
            "results_count": 6,
            "response_time": 1.5
        },
        {
            "query": "quality control procedures",
            "timestamp": (datetime.now() - timedelta(days=2)).isoformat(),
            "results_count": 15,
            "response_time": 1.1
        },
        {
            "query": "project management guidelines",
            "timestamp": (datetime.now() - timedelta(days=3)).isoformat(),
            "results_count": 9,
            "response_time": 1.3
        }
    ]
    
    return {
        "search_history": history_items[:limit],
        "total_searches": len(history_items),
        "user_id": "mock_user_001"
    }

@router.get("/mock/export-data")
async def mock_export_data(
    format: str = Query("json", regex="^(json|csv|xml)$"),
    include_metadata: bool = Query(True)
):
    """
    Mock endpoint for data export functionality
    """
    export_id = str(uuid.uuid4())
    
    # Simulate export preparation
    estimated_size = random.randint(1024, 10240)  # KB
    
    return {
        "export_id": export_id,
        "format": format,
        "status": "preparing",
        "estimated_size_kb": estimated_size,
        "estimated_completion": (datetime.now() + timedelta(minutes=5)).isoformat(),
        "download_url": f"/api/v1/mock/download/{export_id}",
        "include_metadata": include_metadata
    }

@router.get("/mock/download/{export_id}")
async def mock_download_export(export_id: str):
    """
    Mock endpoint for downloading exported data
    """
    # Simulate different export statuses
    statuses = ["completed", "processing", "failed"]
    status = random.choice(statuses)
    
    if status == "completed":
        return {
            "status": "completed",
            "download_url": f"https://mock-api.example.com/exports/{export_id}.zip",
            "file_size_kb": random.randint(1024, 8192),
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
    elif status == "processing":
        return {
            "status": "processing",
            "progress": random.randint(20, 80),
            "message": "Preparing export file..."
        }
    else:
        raise HTTPException(status_code=500, detail="Export failed due to system error")

@router.post("/mock/bulk-operations")
async def mock_bulk_operation(
    operation: str = Query(..., regex="^(delete|reprocess|update-metadata)$"),
    document_ids: List[int] = Query(..., description="List of document IDs"),
    dry_run: bool = Query(False, description="Perform dry run without actual changes")
):
    """
    Mock endpoint for bulk operations on documents
    """
    operation_id = str(uuid.uuid4())
    
    return {
        "operation_id": operation_id,
        "operation": operation,
        "document_count": len(document_ids),
        "dry_run": dry_run,
        "status": "queued",
        "estimated_duration": f"{len(document_ids) * 2} minutes",
        "created_at": datetime.now().isoformat()
    }

@router.get("/mock/statistics")
async def mock_get_statistics():
    """
    Mock endpoint for comprehensive system statistics
    """
    return {
        "documents": {
            "total": random.randint(500, 2000),
            "processed_today": random.randint(10, 50),
            "processing_queue": random.randint(0, 15),
            "failed_processing": random.randint(0, 5)
        },
        "search": {
            "total_queries": random.randint(10000, 50000),
            "queries_today": random.randint(100, 500),
            "avg_response_time": random.uniform(0.8, 2.5),
            "popular_terms": ["safety", "maintenance", "procedures", "standards", "compliance"]
        },
        "generation": {
            "total_generations": random.randint(5000, 25000),
            "generations_today": random.randint(50, 200),
            "avg_generation_time": random.uniform(3.0, 8.0),
            "avg_tokens_generated": random.randint(150, 300)
        },
        "system": {
            "uptime_hours": random.randint(100, 8760),
            "cpu_usage": random.uniform(20, 80),
            "memory_usage": random.uniform(40, 85),
            "disk_usage": random.uniform(30, 70),
            "active_sessions": random.randint(5, 50)
        }
    }
