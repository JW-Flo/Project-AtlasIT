import os
import subprocess
import sys
import logging
import time
from dotenv import load_dotenv

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

from openai import OpenAI
import requests
from github import Github
from google.cloud import storage, firestore, bigquery

# Load environment variables
load_dotenv()

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
model = os.getenv("AI_MODEL", "gpt-4o")
repo_name = os.getenv("GITHUB_REPO")
slack_webhook_url = os.getenv("SLACK_WEBHOOK_URL")

# Initialize Google Cloud clients
storage_client = storage.Client()
firestore_client = firestore.Client()
bigquery_client = bigquery.Client()

# GitHub Initialization
github_token = os.getenv("GH_PAT")
gh = Github(github_token)
repo = gh.get_repo(repo_name)

# Retry decorator for self-resolving operations
def retry_with_backoff(max_retries=5, backoff_factor=2, fallback=None):
    def decorator(func):
        def wrapper(*args, **kwargs):
            retries = 0
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    wait_time = backoff_factor ** retries
                    logger.warning(f"Error: {e}. Retrying in {wait_time} seconds... (Attempt {retries}/{max_retries})")
                    time.sleep(wait_time)
            logger.error(f"Max retries reached for {func.__name__}. Triggering fallback mechanism.")
            if fallback:
                fallback(func.__name__, *args, **kwargs)
            else:
                raise Exception(f"Failed to complete {func.__name__} after {max_retries} retries.")
        return wrapper
    return decorator

# Fallback mechanism to delegate failures back to the AI agent
def fallback_to_ai_agent(function_name, *args, **kwargs):
    logger.error(f"Delegating failure of {function_name} back to the AI agent.")
    failure_report = {
        "function": function_name,
        "args": args,
        "kwargs": kwargs,
        "message": f"{function_name} failed after maximum retries."
    }
    # Re-trigger the AI agent with the failure report
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a world-class autonomous DevOps AI agent."},
                {"role": "user", "content": f"Failure report: {failure_report}"}
            ]
        )
        logger.info("Fallback AI agent response:\n%s", response.choices[0].message.content)
    except Exception as e:
        logger.critical(f"Failed to delegate to AI agent: {e}")

# Slack notification function with retry and fallback
@retry_with_backoff(fallback=fallback_to_ai_agent)
def slack_notify(message: str):
    response = requests.post(slack_webhook_url, json={"text": message})
    if response.status_code != 200:
        raise Exception(f"Slack notification failed with status code {response.status_code}")

# Get repository files with retry and fallback
@retry_with_backoff(fallback=fallback_to_ai_agent)
def get_repo_files(path=""):
    contents = repo.get_contents(path)
    files = []
    while contents:
        file_content = contents.pop(0)
        if file_content.type == "dir":
            contents.extend(repo.get_contents(file_content.path))
        else:
            # Check if the file already exists locally to avoid overwriting
            local_file_path = os.path.join("local_repo", file_content.path)
            if os.path.exists(local_file_path):
                logger.warning(f"File already exists locally: {local_file_path}. Skipping download.")
            else:
                files.append((file_content.path, file_content.decoded_content.decode()))
    return files

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Use a secure vault or GitHub Secrets for this key

# Autonomous evaluation and fix with retry and fallback
@retry_with_backoff(fallback=fallback_to_ai_agent)
def autonomous_evaluate_and_fix():
    files = get_repo_files()
    if not files:
        logger.warning("No new files to process. Exiting.")
        return

    context = "\n\n".join(f"### {path}\n```\n{content}\n```" for path, content in files)

    prompt = f"""
    You are an elite, world-class, unstoppable autonomous DevOps AI agent operating strictly from first principles, tasked with meticulously reviewing, debugging, optimizing, and autonomously managing infrastructure and CI/CD pipeline configurations.

    Your primary objectives are:
    1. Conduct a thorough, comprehensive, deep audit of all repository configurations provided, meticulously detecting and explicitly documenting errors, security vulnerabilities, inefficiencies, or misconfigurations.
    2. Generate exhaustive, precise, explicit, actionable instructions and code corrections with absolute clarity, leaving no ambiguity, requiring zero additional manual intervention.
    3. Proactively leverage external resources, official documentation, or additional AI models whenever deeper insights or further clarity is needed.
    4. Autonomously and proactively create and manage any missing resources, scripts, workflows, Cloud Functions, Terraform adjustments, GitHub Actions configurations, or GCP components required for complete success.
    5. Implement robust, automated error handling, retries, and rollback strategies to ensure constant operational stability, resilience, and high availability.

    The files you must rigorously evaluate and optimize are:
    {context}

    Explicitly delineate every step, command, file creation, resource generation, YAML modification, Terraform adjustment, and Cloud Functions correction. Provide concise, executable commands explicitly formatted for immediate use in GitHub Actions workflows. Operate with absolute certainty, precision, and authority, ensuring flawless execution and uninterrupted progress until fully successful.

    Your response must comprehensively address all necessary corrections, resource creations, improvements, optimizations, and contingencies to guarantee total success.
    """

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a world-class, unstoppable autonomous DevOps AI agent, explicitly tasked with autonomously managing and optimizing infrastructure and CI/CD pipelines from foundational first principles, with unmatched expertise and absolute clarity."},
            {"role": "user", "content": prompt}
        ]
    )

    actions = response.choices[0].message.content
    logger.info("Autonomous Actions:\n%s", actions)

    # Attempt to auto-execute shell commands
    commands = [cmd.strip() for cmd in actions.split('\n') if cmd.strip().startswith(('terraform', 'gcloud', 'git'))]
    for cmd in commands:
        execute_command(cmd)

# Execute shell commands with retry and fallback
@retry_with_backoff(fallback=fallback_to_ai_agent)
def execute_command(cmd):
    logger.info(f"Executing command: {cmd}")
    result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
    logger.info(f"Result: {result.stdout}")
    slack_notify(f"Command '{cmd}' executed successfully.\n{result.stdout}")

if __name__ == "__main__":
    try:
        autonomous_evaluate_and_fix()
    except Exception as e:
        logger.error(f"Critical failure: {e}")
        slack_notify(f"Critical failure: {e}")

# GAM Setup and Connection Script
# This script will autonomously set up GAM, install dependencies, configure environment variables, and verify connectivity.

import os
import subprocess
import sys
import logging
from dotenv import load_dotenv

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 1. Extract GAM Archive
def extract_gam():
    if os.path.exists('gam.tar.gz'):
        logger.info('Extracting gam.tar.gz...')
        subprocess.check_call(['tar', '-xvzf', 'gam.tar.gz'])
    elif os.path.exists('gam.tar.xz'):
        logger.info('Extracting gam.tar.xz...')
        subprocess.check_call(['tar', '-xvJf', 'gam.tar.xz'])
    else:
        logger.error('No GAM archive found.')
        sys.exit(1)

# 2. Install Python Dependencies
def install_dependencies():
    required_packages = [
        'openai',
        'requests',
        'python-dotenv',
        'PyGithub',
        'google-cloud-storage',
        'google-cloud-firestore',
        'google-cloud-bigquery'
    ]
    logger.info('Installing Python dependencies...')
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--upgrade', *required_packages])

# 3. Setup Environment Variables
def ensure_env():
    if not os.path.exists('.env'):
        logger.info('Creating .env file template...')
        with open('.env', 'w') as f:
            f.write('AI_MODEL=gpt-4o\n')
            f.write('GITHUB_REPO=your-repo-name\n')
            f.write('SLACK_WEBHOOK_URL=your-slack-webhook-url\n')
            f.write('GH_PAT=your-github-personal-access-token\n')
            f.write('OPENAI_API_KEY=your-openai-api-key\n')
        logger.warning('Please fill in the .env file with your actual values and re-run the script.')
        sys.exit(1)
    else:
        logger.info('.env file found.')

# 4. Verify GAM Setup
def verify_gam():
    # Example: Check if GAM main script exists after extraction
    gam_main = 'gam/gam.py'  # Adjust path as needed
    if os.path.exists(gam_main):
        logger.info('GAM extracted and main script found.')
    else:
        logger.error('GAM main script not found. Please check extraction.')
        sys.exit(1)

# 5. Main Autonomous Setup Routine
def main():
    extract_gam()
    install_dependencies()
    ensure_env()
    load_dotenv()
    verify_gam()
    logger.info('GAM setup complete. You can now run GAM commands.')

if __name__ == '__main__':
    main()

