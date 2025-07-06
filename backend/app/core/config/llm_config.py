from pydantic import ConfigDict, Field
from pydantic_settings import BaseSettings

class LLMSettings(BaseSettings):
    model_config: ConfigDict = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


def get_llm_settings():
    """Get LLM settings. Reads from .env file each time."""
    return LLMSettings()