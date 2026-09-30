"""
UrbanPulse Structured Logging
Provides consistent logging format across all modules.
"""

import sys
import logging
from backend.app.core.config import settings

def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(name)s] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    
    root_logger = logging.getLogger("urbanpulse")
    root_logger.setLevel(log_level)
    root_logger.handlers = [handler]
    
    return root_logger

logger = setup_logging()
