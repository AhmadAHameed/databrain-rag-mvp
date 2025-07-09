# DataBrain RAG MVP Documentation

## 🚀 Project Overview

**DataBrain** is an intelligent Enterprise Retrieval-Augmented Generation (RAG) system that transforms how organizations manage and interact with their document repositories. Built with cutting-edge AI technology, it provides intelligent search, document processing, and conversational AI capabilities.

### ✨ Key Features

- **🤖 AI-Powered Assistant**: Conversational interface for intelligent document queries
- **🔍 Advanced Search**: Semantic search with contextual understanding
- **📄 Document Processing**: Automated chunking, embedding, and indexing
- **🎯 Real-time Streaming**: Live response generation with source attribution
- **🔄 Complete Pipeline**: Upload → Process → Chunk → Embed → Search
- **📊 Admin Dashboard**: Comprehensive document management interface

## 🏗️ Architecture Overview

### Technology Stack

**Backend:**
- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Robust relational database for metadata storage
- **Qdrant**: High-performance vector database for embeddings
- **Ollama**: Local LLM inference with Qwen2.5:0.5b model
- **Docling**: Advanced document processing and chunking
- **SQLAlchemy**: Modern ORM with async support

**Frontend:**
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Material-UI**: Professional component library
- **Vite**: Fast build tool and dev server

**Infrastructure:**
- **Docker**: Containerized deployment
- **Docker Compose**: Multi-service orchestration
- **Alembic**: Database migration management

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Databases     │
│   (React)       │────│   (FastAPI)     │────│   PostgreSQL    │
│                 │    │                 │    │   Qdrant        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   AI Services   │
                       │   (Ollama)      │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Git
- 8GB+ RAM recommended

### Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/AhmadAHameed/databrain-rag-mvp.git
   cd databrain-rag-mvp
   ```

2. **Setup Environment**
   ```bash
   cp backend/.env.example backend/.env
   cp backend/migrations/alembic.ini.example backend/migrations/alembic.ini
   ```

3. **Build & Start Services**
   ```bash
   docker compose -f docker/docker-compose.yml build
   docker compose -f docker/docker-compose.yml up -d
   ```

4. **Initialize Database**
   ```bash
   docker compose -f docker/docker-compose.yml exec backend sh -c 'alembic -c migrations/alembic.ini upgrade head'
   ```

5. **Download AI Models**
   ```bash
   docker compose -f docker/docker-compose.yml exec ollama ollama pull nomic-embed-text
   docker compose -f docker/docker-compose.yml exec ollama ollama pull qwen2.5:0.5b
   ```

### Access Application
- **Frontend**: http://localhost:3030
- **Backend API**: http://localhost:8008
- **API Documentation**: http://localhost:8008/docs

## 📋 Core Features

### Document Processing Pipeline

1. **Upload**: Secure file upload with validation
2. **Chunking**: Intelligent document segmentation using Docling
3. **Embedding**: Vector representation generation
4. **Storage**: Metadata in PostgreSQL, vectors in Qdrant
5. **Retrieval**: Semantic search with relevance scoring

### AI Assistant

- **Conversational Interface**: Natural language queries
- **Source Attribution**: Traceable responses with document references  
- **Real-time Streaming**: Live response generation via SSE
- **Advanced Filtering**: Contextual search with multiple filters
- **Multi-modal Support**: PDF, DOCX, TXT processing

### Admin Dashboard

- **Document Management**: Upload, edit, delete operations
- **System Statistics**: Usage metrics and performance data
- **Batch Operations**: Bulk document processing
- **Health Monitoring**: Service status and diagnostics

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
# Database
POSTGRES_USER=username
POSTGRES_PASSWORD=password
POSTGRES_DB=databrain
POSTGRES_HOST=postgresql
POSTGRES_PORT=5432

# Vector Database
QDRANT_HOST=qdrant
QDRANT_PORT=6333

# AI Services
OLLAMA_HOST=ollama
OLLAMA_PORT=11434

# API
API_HOST=0.0.0.0
API_PORT=8000
API_EXTERNAL_PORT=8008
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8008
```

## 📊 Performance & Scalability

### Optimization Features
- **Batch Processing**: Efficient multi-document operations
- **Async Operations**: Non-blocking I/O throughout
- **Vector Indexing**: Optimized similarity search
- **Caching**: Strategic response caching
- **Health Checks**: Comprehensive service monitoring

### Scalability Considerations
- Horizontal scaling via Docker Swarm/Kubernetes
- Database connection pooling
- Vector database partitioning
- Load balancing support

## 🛠️ Development

### Project Structure
```
databrain/
├── backend/           # FastAPI application
├── frontend/          # React application  
├── docker/            # Container configurations
├── docs/              # Documentation
└── logs/              # Application logs
```

### Development Commands
```bash
# Backend development
cd backend && uvicorn main:app --reload

# Frontend development  
cd frontend && npm run dev

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 🔒 Security Features

- Input validation and sanitization
- File type restrictions
- Error handling and logging
- Health check endpoints
- CORS configuration

## 📈 Monitoring & Logging

- Structured logging with custom formatters
- Service health monitoring
- Performance metrics tracking
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Developer**: Ahmad Abdulhameed
- **Email**: a.a.elhameed@gmail.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by Ahmad Abdulhameed | Transforming enterprise data management with AI*
