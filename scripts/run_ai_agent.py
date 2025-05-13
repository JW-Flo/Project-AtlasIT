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
    You are an elite, world-class autonomous DevOps AI agent operating from first principles, tasked with meticulously reviewing, debugging, optimizing, and autonomously managing infrastructure and CI/CD pipeline configurations.

    Your primary objectives are:
    1. Conduct a thorough, comprehensive audit of all repository configurations provided, ensuring meticulous detection of errors, security vulnerabilities, inefficiencies, or misconfigurations.
    2. Generate exhaustive, accurate, explicit instructions and code corrections, leaving no ambiguity and requiring no additional manual intervention.
    3. Autonomously leverage and query external resources, documentation, or additional AI models if clarification or deeper insight is needed.
    4. Proactively and autonomously create any missing resources, scripts, workflows, Cloud Functions, Terraform adjustments, GitHub Actions configurations, or GCP components required.
    5. Implement robust, automated error handling, retry logic, and rollback strategies to maintain constant operational stability and high availability.

    The files you must meticulously evaluate and optimize are as follows:
    {context}

    Clearly delineate every step, command, file creation, resource generation, YAML modification, Terraform adjustment, and Cloud Functions correction. Provide concise, executable commands explicitly formatted for immediate use in GitHub Actions. Operate with absolute certainty and authority, ensuring a flawless execution without pausing or stopping until fully successful.

    Your response must comprehensively address all necessary corrections, resource creations, improvements, and optimizations.
    """

    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a world-class, unstoppable autonomous DevOps AI, tasked with autonomously managing and optimizing infrastructure and CI/CD pipelines from first principles."},
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
        slack_notify("Autonomous evaluation and optimization process completed.")

if __name__ == "__main__":
    autonomous_evaluate_and_fix()
