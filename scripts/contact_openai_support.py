import os
import requests
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
openai_support_url = "https://api.openai.com/v1/support"  # Replace with the actual OpenAI support endpoint
api_key = os.getenv("OPENAI_API_KEY")

def contact_openai_support(subject, description):
    if not api_key:
        logger.error("OPENAI_API_KEY is not set. Please configure it in your environment.")
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "subject": subject,
        "description": description
    }

    try:
        logger.info("Sending request to OpenAI support...")
        response = requests.post(openai_support_url, headers=headers, json=payload)
        response.raise_for_status()
        logger.info("Support request sent successfully.")
        logger.info(f"Response: {response.json()}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to contact OpenAI support: {e}")

if __name__ == "__main__":
    subject = "Issue with OpenAI SDK Integration"
    description = (
        "We are experiencing issues with the OpenAI SDK integration in our project. "
        "Please provide guidance or assistance. Details: [Include specific details here]."
    )
    contact_openai_support(subject, description)
