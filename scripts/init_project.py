import os
import logging
import subprocess

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Directories to create
DIRECTORIES = [
    "logs",
    "data",
    "configs",
    "scripts",
    "cloud-functions",
    "terraform",
]

# Files to initialize
FILES = {
    ".env.example": "OPENAI_API_KEY=\nGITHUB_REPO=\nSLACK_WEBHOOK_URL=\n",
    "configs/config.json": "{}",
}

def create_directories():
    for directory in DIRECTORIES:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logger.info(f"Created directory: {directory}")
        else:
            logger.info(f"Directory already exists: {directory}")

def create_files():
    for filepath, content in FILES.items():
        if not os.path.exists(filepath):
            with open(filepath, "w") as f:
                f.write(content)
            logger.info(f"Created file: {filepath}")
        else:
            logger.info(f"File already exists: {filepath}")

if __name__ == "__main__":
    logger.info("Initializing project environment...")
    create_directories()
    create_files()
    logger.info("Project environment initialized successfully.")
