from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.v1.routes import api_router
from app.utils.logging_setup import create_logger

logger = create_logger(__name__)
app = FastAPI()

# Add CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3030,http://localhost:5173,http://frontend:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(api_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Enterprise RAG MVP", "status": "running"}


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)


if __name__ == "__main__":
    logger.info("Starting server...")
    import uvicorn

    # Read port from environment variable
    api_port = int(os.getenv("API_PORT", "8000"))
    api_host = os.getenv("API_HOST", "0.0.0.0")
    
    uvicorn.run("main:app", host=api_host, port=api_port, reload=False)
    logger.info("Stopping server...")
