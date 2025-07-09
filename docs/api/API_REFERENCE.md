# DataBrain API Documentation

## 📚 Overview

The DataBrain API provides comprehensive endpoints for document management, AI-powered search, and intelligent content processing. Built with FastAPI, it offers automatic documentation, request validation, and high performance.

**Base URL**: `http://localhost:8008/api/v1`  
**Interactive Documentation**: `http://localhost:8008/docs`

## 🔗 API Endpoints Summary

### 📄 Documents
- `POST /documents/upload/` - Upload document
- `GET /documents/list` - List all documents
- `GET /documents/{document_id}` - Get document details
- `DELETE /documents/{document_id}` - Delete document
- `GET /documents/filter-options` - Get filtering options

### ✂️ Chunks  
- `POST /chunks/document/{document_id}/start-chunking` - Start document chunking
- `GET /chunks/document/{document_id}/chunks` - Get document chunks
- `GET /chunks/document/{document_id}/chunking-status` - Get chunking status
- `POST /chunks/batch/start-chunking` - Batch chunk documents
- `DELETE /chunks/document/{document_id}/chunks` - Delete document chunks

### 🧠 Embeddings
- `POST /embeddings/{document_id}/process` - Generate embeddings
- `POST /embeddings/batch/process` - Batch process embeddings
- `GET /embeddings/search` - Search similar chunks
- `POST /embeddings/search` - Search with filters

### 🔄 Pipeline
- `POST /pipeline/upload-and-process/` - Complete processing pipeline
- `POST /pipeline/{document_id}/process` - Process existing document
- `POST /pipeline/batch/process` - Batch process documents

### 🔍 Retrieval & Generation
- `POST /retrieval/search` - Advanced search
- `POST /generation/stream` - Streaming AI responses
- `POST /generation/ask` - Ask AI questions

### 🏥 Health & Monitoring
- `GET /health/` - System health check
- `GET /health/services` - Service status

---

## 📄 Documents API

### Upload Document
Upload a document for processing.

**Endpoint**: `POST /documents/upload/`

**Parameters**:
- `file` (file): Document file (PDF, DOCX, TXT)
- `title` (string): Document title
- `department` (string): Department name
- `division` (string): Division name

**Response**:
```json
{
  "id": 1,
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Technical Specifications",
  "department": "Engineering",
  "division": "Software",
  "location": "/path/to/file.pdf",
  "status": "uploaded",
  "created_at": "2025-01-09T10:00:00Z"
}
```

**Example**:
```bash
curl -X POST "http://localhost:8008/api/v1/documents/upload/" \
  -F "file=@document.pdf" \
  -F "title=Technical Specifications" \
  -F "department=Engineering" \
  -F "division=Software"
```

### List Documents
Retrieve all documents with pagination.

**Endpoint**: `GET /documents/list`

**Parameters**:
- `skip` (int, optional): Number of documents to skip (default: 0)
- `limit` (int, optional): Maximum documents to return (default: 100)

**Response**:
```json
[
  {
    "id": 1,
    "title": "Technical Specifications",
    "department": "Engineering",
    "division": "Software",
    "status": "completed",
    "created_at": "2025-01-09T10:00:00Z"
  }
]
```

### Get Document
Retrieve specific document details.

**Endpoint**: `GET /documents/{document_id}`

**Response**:
```json
{
  "id": 1,
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Technical Specifications",
  "department": "Engineering",
  "division": "Software",
  "location": "/path/to/file.pdf",
  "status": "completed",
  "created_at": "2025-01-09T10:00:00Z",
  "updated_at": "2025-01-09T10:30:00Z"
}
```

### Delete Document
Remove document and associated file.

**Endpoint**: `DELETE /documents/{document_id}`

**Response**: `204 No Content`

---

## ✂️ Chunks API

### Start Document Chunking
Begin chunking process for a document.

**Endpoint**: `POST /chunks/document/{document_id}/start-chunking`

**Response**:
```json
{
  "message": "Chunking started for document 1",
  "document_id": 1,
  "status": "processing"
}
```

**Example**:
```bash
curl -X POST "http://localhost:8008/api/v1/chunks/document/1/start-chunking"
```

### Get Document Chunks
Retrieve all chunks for a document.

**Endpoint**: `GET /chunks/document/{document_id}/chunks`

**Response**:
```json
[
  {
    "id": 1,
    "document_id": 1,
    "uuid": "chunk-uuid-123",
    "content": "This is the first chunk of the document...",
    "document_page": 1,
    "chunk_metadata": {
      "chunk_type": "text",
      "extraction_method": "docling_hybrid_chunker"
    },
    "status": "pending",
    "created_at": "2025-01-09T10:15:00Z"
  }
]
```

### Chunking Status
Check the chunking progress for a document.

**Endpoint**: `GET /chunks/document/{document_id}/chunking-status`

**Response**:
```json
{
  "document_id": 1,
  "document_title": "Technical Specifications",
  "document_status": "chunked",
  "total_chunks": 15,
  "pending_chunks": 0,
  "embedded_chunks": 15,
  "error_chunks": 0
}
```

### Batch Chunking
Start chunking for multiple documents.

**Endpoint**: `POST /chunks/batch/start-chunking`

**Request Body**:
```json
[1, 2, 3, 4, 5]
```

**Response**:
```json
{
  "message": "Started chunking for 5 documents",
  "processed_documents": [
    {"id": 1, "title": "Document 1"},
    {"id": 2, "title": "Document 2"}
  ],
  "total_processed": 5,
  "total_requested": 5
}
```

---

## 🧠 Embeddings API

### Generate Embeddings
Process document chunks to generate embeddings.

**Endpoint**: `POST /embeddings/{document_id}/process`

**Response**:
```json
{
  "message": "Embedding generation started for document 1",
  "document_id": 1,
  "status": "processing"
}
```

### Batch Embeddings
Generate embeddings for multiple documents.

**Endpoint**: `POST /embeddings/batch/process`

**Request Body**:
```json
[1, 2, 3]
```

**Response**:
```json
{
  "message": "Started embedding processing for 3 documents",
  "processed_documents": [
    {"id": 1, "title": "Document 1"}
  ],
  "total_processed": 3
}
```

### Search Similar Chunks
Find similar content using text queries.

**Endpoint**: `GET /embeddings/search`

**Parameters**:
- `query` (string): Search query text
- `limit` (int, optional): Maximum results (default: 5)

**Response**:
```json
[
  {
    "chunk_id": 123,
    "content": "Relevant content snippet...",
    "score": 0.95,
    "document_id": 1,
    "document_title": "Technical Specifications",
    "metadata": {
      "department": "Engineering",
      "division": "Software",
      "page": 5
    }
  }
]
```

**Example**:
```bash
curl "http://localhost:8008/api/v1/embeddings/search?query=database architecture&limit=3"
```

### Advanced Search (POST)
Search with complex filters and parameters.

**Endpoint**: `POST /embeddings/search`

**Request Body**:
```json
{
  "query": "database architecture",
  "limit": 10,
  "filters": {
    "departments": ["Engineering"],
    "divisions": ["Software"],
    "min_score": 0.7
  }
}
```

---

## 🔄 Pipeline API

### Upload and Process
Complete pipeline: upload → chunk → embed.

**Endpoint**: `POST /pipeline/upload-and-process/`

**Parameters**:
- `file` (file): Document file
- `title` (string): Document title  
- `department` (string): Department
- `division` (string): Division

**Response**:
```json
{
  "id": 1,
  "title": "Technical Specifications",
  "status": "uploaded", 
  "processing_status": "started",
  "message": "Document uploaded and processing started"
}
```

### Process Existing Document
Run complete pipeline on existing document.

**Endpoint**: `POST /pipeline/{document_id}/process`

**Response**:
```json
{
  "message": "Processing started for document 1",
  "document_id": 1,
  "document_title": "Technical Specifications",
  "processing_status": "started"
}
```

### Batch Processing
Process multiple documents through complete pipeline.

**Endpoint**: `POST /pipeline/batch/process`

**Request Body**:
```json
[1, 2, 3]
```

**Response**:
```json
{
  "message": "Started complete pipeline processing for 3 documents",
  "processed_documents": [
    {"id": 1, "title": "Document 1"}
  ],
  "total_processed": 3,
  "total_requested": 3
}
```

---

## 🔍 Retrieval API

### Advanced Search
Comprehensive search with filtering and ranking.

**Endpoint**: `POST /retrieval/search`

**Request Body**:
```json
{
  "query": "What are the system requirements?",
  "limit": 5,
  "filters": {
    "departments": ["Engineering"],
    "document_types": ["Technical Report"],
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  },
  "min_score": 0.7
}
```

**Response**:
```json
{
  "results": [
    {
      "chunk_id": 123,
      "content": "System requirements include...",
      "score": 0.95,
      "document_metadata": {
        "title": "Technical Specifications",
        "department": "Engineering",
        "page": 3
      }
    }
  ],
  "total_results": 1,
  "processing_time": 0.156
}
```

---

## 🧠 Generation API

### Streaming Responses
Get real-time AI responses via Server-Sent Events.

**Endpoint**: `POST /generation/stream`

**Request Body**:
```json
{
  "question": "What are the key system requirements?",
  "filters": {
    "departments": ["Engineering"]
  },
  "config": {
    "temperature": 0.7,
    "max_chunks": 5
  }
}
```

**Response**: Stream of JSON objects
```json
{"type": "chunk", "content": "Based on the documentation, "}
{"type": "chunk", "content": "the key system requirements are:"}
{"type": "sources", "sources": [{"title": "Tech Specs", "page": 3}]}
{"type": "done"}
```

### Ask Questions  
Get AI responses with source attribution.

**Endpoint**: `POST /generation/ask`

**Request Body**:
```json
{
  "question": "Explain the database architecture",
  "context_limit": 5,
  "include_sources": true
}
```

**Response**:
```json
{
  "answer": "The database architecture consists of...",
  "sources": [
    {
      "document_title": "Architecture Guide",
      "page": 12,
      "relevance_score": 0.92
    }
  ],
  "processing_time": 1.23,
  "tokens_used": 156
}
```

---

## 🏥 Health API

### System Health
Check overall system health.

**Endpoint**: `GET /health/`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-09T10:00:00Z",
  "uptime": "2h 15m 30s"
}
```

### Service Status
Detailed service health information.

**Endpoint**: `GET /health/services`

**Response**:
```json
{
  "database": {
    "status": "healthy",
    "response_time": "12ms"
  },
  "vector_store": {
    "status": "healthy", 
    "response_time": "8ms"
  },
  "llm_service": {
    "status": "healthy",
    "response_time": "145ms"
  },
  "can_process_documents": true
}
```

---

## 🔐 Authentication & Security

### API Security Features
- Request validation via Pydantic models
- File type restrictions (PDF, DOCX, TXT only)
- File size limits (configurable)
- CORS configuration for cross-origin requests
- Input sanitization and error handling

### Rate Limiting (Future Enhancement)
- Per-endpoint rate limits
- User-based quotas
- Burst handling

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 🛠️ Error Handling

### Standard Error Response
```json
{
  "detail": "Error description",
  "type": "validation_error",
  "errors": [
    {
      "field": "document_id",
      "message": "Document not found"
    }
  ]
}
```

### Validation Errors
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 📈 Performance Guidelines

### Best Practices
- Use batch endpoints for multiple operations
- Implement proper pagination for large datasets
- Monitor response times via health endpoints
- Cache frequently accessed data

### Optimization Tips
- Limit result sets with appropriate pagination
- Use specific filters to reduce search scope
- Prefer POST for complex queries with filtering
- Monitor service health before bulk operations

---

*For interactive API exploration, visit: `http://localhost:8008/docs`*
