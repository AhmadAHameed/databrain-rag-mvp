from pydantic_settings import BaseSettings
from pydantic import ConfigDict, Field

class AppSettings(BaseSettings):
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = Field("Document Ingestion Service",
                          description="Name of the application")
    APP_VERSION: str = Field("0.0.1", description="Version of the application")
    APP_DESCRIPTION: str = Field("A service to ingest documents",
                                 description="Description of the application")
    APP_AUTHOR: str = Field(
        "IT-Division", description="Author of the application")

    DATABASE_URL: str = Field(
        default="", 
        description="Database connection URL"
    )

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        return self.DATABASE_URL

def get_app_settings():
    """Get app settings. Reads from .env file each time."""
    return AppSettings()
