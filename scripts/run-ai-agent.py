import os
import subprocess
import sys
import logging

# Ensure required packages are installed
def install_dependencies():
    required_packages = [
        "openai",
        "requests",
        "python-dotenv",
        "PyGithub",
        "google-cloud-storage",
        "google-cloud-firestore",
        "google-cloud-bigquery"
    ]

    subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", *required_packages])

# Install dependencies first
install_dependencies()

import openai
import requests
from github import Github
from dotenv import load_dotenv
from google.cloud import storage, firestore, bigquery

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("AI_MODEL", "gpt-4o")
repo_name = os.getenv("GITHUB_REPO")
slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")

# Setup Google Cloud authentication
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Initialize Google Cloud clients
storage_client = storage.Client()
firestore_client = firestore.Client()
bigquery_client = bigquery.Client()

# GitHub Initialization
github_token = os.getenv("GITHUB_TOKEN")
gh = Github(github_token)
repo = gh.get_repo(repo_name)

# Slack notification function
def slack_notify(message: str):
    requests.post(slack_webhook_url, json={"text": message})

# Get repository files
def get_repo_files(path=""):
    contents = repo.get_contents(path)
    files = []
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            contents.extend(repo.get_contents(file_content.path))
        else:
            files.append((file_content.path, file_content.decoded_content.decode()))
    return files

# Autonomous evaluation and fix
def autonomous_evaluate_and_fix():
    files = get_repo_files()
    context = "\n\n".join(f"### {path}\n```\n{content}\n```" for path, content in files)

    prompt = f"""
    You're an autonomous senior DevOps AI agent tasked with thoroughly reviewing, debugging, correcting, and optimizing the infrastructure and CI/CD pipeline configurations provided.

    Your task:
    - Review all provided repository files in-depth, identifying any errors, inefficiencies, security issues, or misconfigurations.
    - Provide detailed, explicitly clear, and step-by-step instructions for each required change, ensuring full accuracy.
    - Include exact shell commands (terraform, gcloud, git), GitHub Actions YAML modifications, Terraform configuration adjustments, and Google Cloud Functions corrections.
    - Ensure that all provided fixes and instructions will operate flawlessly within GitHub Actions environments immediately upon application, with absolutely no further manual intervention.
    - Implement robust error handling strategies, including retries and safe rollbacks, to ensure high availability and stability.

    Provided files for evaluation:
    {context}

    Clearly delineate your instructions and make each action explicit and immediately actionable. Provide concise commands and precise, directly executable instructions.
    """

    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": "You autonomously evaluate, debug, correct, and optimize DevOps infrastructure and CI/CD pipeline configurations."},
            {"role": "user", "content": prompt}
        ]
    )

    actions = response.choices[0].message.content
    logger.info("Autonomous Actions:\n%s", actions)

    # Attempt to auto-execute shell commands
    try:
        commands = [cmd.strip() for cmd in actions.split('\n') if cmd.strip().startswith(('terraform', 'gcloud', 'git'))]
        for cmd in commands:
            logger.info("Executing command: %s", cmd)
            result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
            logger.info("Result: %s", result.stdout)
            slack_notify(f"Command '{cmd}' executed successfully.\n{result.stdout}")

    except subprocess.CalledProcessError as e:
        error_msg = f"Error executing command '{cmd}':\n{e.stderr}"
        logger.error(error_msg)
        slack_notify(error_msg)

    except Exception as e:
        general_error = f"General error during autonomous operation: {str(e)}"
        logger.exception(general_error)
        slack_notify(general_error)

    finally:
        slack_notify("Autonomous evaluation and fix completed successfully.")

if __name__ == "__main__":
    autonomous_evaluate_and_fix()
# This script is designed to autonomously evaluate and fix DevOps infrastructure and CI/CD pipeline configurations.
# It uses OpenAI's API to generate commands and instructions, executes them, and sends notifications to Slack.
# Ensure to set up the required environment variables in a .env file:
