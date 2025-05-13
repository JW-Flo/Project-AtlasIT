import os
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_terraform_command(command):
    try:
        logger.info(f"Running Terraform command: {command}")
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        logger.info(f"Command output: {result.stdout}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running Terraform command: {e.stderr}")
        raise

def deploy_terraform():
    logger.info("Deploying Terraform...")
    run_terraform_command("terraform init")
    run_terraform_command("terraform apply -auto-approve")

def deploy_google_cloud_functions():
    logger.info("Deploying Google Cloud Functions...")
    # Add deployment logic here

def main():
    try:
        deploy_terraform()
        deploy_google_cloud_functions()
        logger.info("Infrastructure deployment completed successfully.")
    except Exception as e:
        logger.error(f"Deployment failed: {e}")

if __name__ == "__main__":
    main()
