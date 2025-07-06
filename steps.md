# Project Setup Steps

## Prerequisites: Infrastructure Installation

Before starting, ensure you have the following tools installed on your system:

1. **Docker Desktop**
   - Download and install Docker Desktop from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Docker is required for running backend, frontend, and model services in containers.

2. **Visual Studio Code (VS Code)**
   - Download and install VS Code from [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - Recommended for editing code, managing containers, and using extensions.

3. **Git**
   - Download and install Git from [https://git-scm.com/downloads](https://git-scm.com/downloads)
   - Required for cloning the repository and version control.


# Project Setup Steps

## Initial Configuration


Before proceeding, make sure to create the following configuration files by copying the provided example files:

- `backend/.env.example` → `backend/.env`
- `frontend/.env.example` → `frontend/.env` (if exists)
- Any other `.env.example` files in the project structure → corresponding `.env` files
- `backend/migrations/alembic.ini.example` → `backend/migrations/alembic.ini`

After copying, review and update the variables in each `.env` and `alembic.ini` file as needed for your local setup.


1. **Apply database migrations inside the backend Docker container:**
   - Run the following command from the project root:
     ```sh
     docker compose -f docker/docker-compose.yml exec backend sh -c 'alembic -c migrations/alembic.ini upgrade head'
     ```
   - This will apply all pending Alembic migrations to the database.
   - Ensure the command output shows successful migration steps.


2. **Pull the Ollama embedding model using the ollama Docker service:**
   - Run the following command from the project root:
     ```sh
     docker compose -f docker/docker-compose.yml exec ollama ollama pull nomic-embed-text
     ```
   - This will download the `nomic-embed-text` embedding model for use with Ollama.

3. **Pull the Ollama language model using the ollama Docker service:**
   - Run the following command from the project root:
     ```sh
     docker compose -f docker/docker-compose.yml exec ollama ollama pull qwen2.5:0.5b
     ```
   - This will download the `qwen2.5:0.5b` language model for use with Ollama.

4. **Chunk a document or documents using the API (via FastAPI docs):**
   - Open your browser and go to [http://localhost:8008/docs](http://localhost:8008/docs) (replace `8008` with your backend's external port if different).
   - Use the `POST /document/{document_id}/start-chunking` endpoint to chunk a single document by its ID.
   - Or use the `POST /batch/start-chunking` endpoint to chunk multiple documents by providing a list of document IDs in the request body.
   - You can also check chunking status and results using the related endpoints in the docs UI.

5. **Create embeddings for document chunks using the API (via FastAPI docs):**
   - In the FastAPI docs at [http://localhost:8008/docs](http://localhost:8008/docs), locate the embedding endpoints (usually under `/embedding` or similar).
   - Use the `POST /embedding/{document_id}/start` endpoint to start embedding for all chunks of a specific document.
   - Or use the `POST /embedding/batch/start` endpoint to start embedding for multiple documents by providing a list of document IDs in the request body.
   - You can monitor embedding progress and results using the related embedding status endpoints in the docs UI.
