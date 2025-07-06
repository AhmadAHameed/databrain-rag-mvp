import os
import logging
from app.core.config.logging import get_logging_settings


def create_logger(logger_name: str, log_file_name: str = None, level=logging.DEBUG) -> logging.Logger:
    LOGGING_SETTINGS = get_logging_settings()

    logger = logging.getLogger(logger_name)
    logger.setLevel(level)

    if not log_file_name:
        log_file_name = LOGGING_SETTINGS.LOGGING_FILE

    log_file_path = os.path.join(os.getcwd(), "logs", log_file_name)
    
    if not os.path.exists(os.path.dirname(log_file_path)):
        os.makedirs(os.path.dirname(log_file_path))
        
    file_handler = logging.FileHandler(log_file_path)
    file_handler.setLevel(level)

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)

    if not logger.handlers:
        logger.addHandler(file_handler)

    return logger
