# Project Ignite

## Environment Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/JW-Flo/Project-Ignite.git
   cd Project-Ignite
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     OPENAI_API_KEY=your_openai_api_key
     SLACK_WEBHOOK_URL=your_slack_webhook_url
     GDRIVE_FOLDER_ID=your_google_drive_folder_id
     GH_PAT=your_github_personal_access_token
     ```

## Running Tests
1. Run Python tests:
   ```bash
   pytest
   ```
2. Run linting for JavaScript:
   ```bash
   npm run lint
   ```

## Deployment Process
1. Deploy Cloud Functions:
   ```bash
   gcloud functions deploy ingest_alerts --runtime python39 --trigger-http
   ```
2. Deploy the Web UI:
   ```bash
   ./scripts/deploy-webui.sh
   ```
3. Deploy Terraform infrastructure:
   ```bash
   terraform -chdir=terraform init
   terraform -chdir=terraform apply -auto-approve
   ```

## Training Data Storage
- Training data is stored in Google Drive under the folder specified by `GDRIVE_FOLDER_ID`.
- Use the `store_training_data` function in `run_ai_agent.py` to upload data in an organized manner.

## Continuous Integration
- Workflows are configured to run tests, linting, and deployments automatically on push or pull request events.
- Notifications are sent to Slack for success or failure.

## GAM Setup and Usage

### Prerequisites
1. Download the GAM executable from the [official GAM website](https://github.com/jay0lee/GAM).
2. Place the GAM executable in a directory included in your system's PATH or specify its location in the `GAM_PATH` environment variable.

### Environment Variable
- Add the following to your `.env` file:
  ```env
  GAM_PATH=/path/to/gam
  ```

### Using GAM
- The agent uses GAM to manage Google Workspace resources. Example tasks include:
  - Listing all users: `gam print users`
  - Creating a new user: `gam create user newuser@domain.com password TempPass123`

- These commands are executed automatically by the agent as part of its workflows.
