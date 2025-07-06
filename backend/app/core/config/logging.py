from functools import lru_cache
import logging
import os
from pydantic_settings import BaseSettings
from pydantic import Field, ConfigDict


class LoggingSettings(BaseSettings):
    model_config: ConfigDict = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    LOGGING_LEVEL: str = Field("INFO", description="Logging level")
    LOGGING_FILE: str = Field("app.log", description="Logging file")

    DEBUG_LOGGING_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s - %(filename)s - %(module)s - %(lineno)d - %(funcName)s - %(threadName)s - %(processName)s"
    PRODUCTION_LOGGING_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"


def get_logging_settings():
    return LoggingSettings()
