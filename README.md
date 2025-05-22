# Project Ignite — Cloudflare Workers Dispatch Pipeline

## Overview
This project implements a production-ready Cloudflare Workers dispatch pipeline for Project Ignite. It forwards requests to sub-Workers in the `dispatcher` namespace and is fully automated for CI/CD deployment.

---

## 1. Prerequisites
- Node.js 20+
- Wrangler CLI (`npm install -g @cloudflare/wrangler`)
- Cloudflare Account ID
- Cloudflare API Token (see below)
- GitHub repository with Actions enabled

---

## 2. Environment Variables & Secrets
Set these in your local `.env` (for local dev) and as GitHub Secrets (for CI/CD):

- `CF_ACCOUNT_ID`           # Cloudflare Account ID
- `WRANGLER_API_TOKEN`      # API token for Wrangler publish
- `CF_GLOBAL_API_KEY`       # (for token creation script)
- `CF_ACCOUNT_EMAIL`        # (for token creation script)
- `MCP_HOST`                # Base URL of your MCP context-retrieval endpoint
- `DATTO_EDR_TOKEN`         # API token for Datto EDR Cloud Function
- `ROCKETCYBER_API_TOKEN`   # API token for RocketCyber Cloud Function

See `.env.example` for a template.

---

## 3. Generate a Wrangler API Token
Run the provided script to generate a token with the correct scope:

```sh
./scripts/generate_cf_token.sh
```

Copy the output token and add it to your GitHub repo as `WRANGLER_API_TOKEN`.

---

## 4. Deploying the Worker
### Local Test
```sh
wrangler dev
```

### Production Deploy (CI/CD)
Push to `main` — GitHub Actions will build and deploy automatically using `.github/workflows/cloudflare-workers.yml`.

---

## 5. Smoke Test
After deployment, run:
```sh
./scripts/smoke-test-worker.sh
```
This will curl your Worker's production URL and verify a 200/502 response.

---

## 6. File Structure
```
wrangler.toml                  # Worker config
index.js                       # Dispatch Worker entrypoint
scripts/generate_cf_token.sh   # Token generation
scripts/smoke-test-worker.sh   # Post-deploy smoke test
.github/workflows/cloudflare-workers.yml # CI/CD
.env.example                   # Env var template
```

---

## 7. Troubleshooting
- Check GitHub Actions logs for deploy errors
- Use `wrangler tail` for real-time Worker logs
- Ensure all required secrets are set in GitHub

---

## 8. References
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

# Infrastructure as Code (IaC)

## AWS (production):
- Use SST and Terraform in `infra/terraform/aws/` for real AWS infrastructure.
- See `infra/terraform/aws/README.md` for details.

## GCP (mock/prototype only):
- Use Terraform in `infra/terraform/gcp/` for GCP resource mockups.
- See `infra/terraform/gcp/README.md` for details.

## Cloudflare Workers:
- Use Wrangler + GitHub Actions (no Docker needed).
- All config/secrets handled via Wrangler and GitHub Actions.

---

# Docker
- Docker is NOT used for Cloudflare Worker build/deploy.
- Remove Dockerfile and Docker build steps from Worker pipeline.
- If Docker is needed for other services, keep it in `docker/` and document its purpose.

---

# Directory Structure
- `infra/terraform/aws/` — AWS real infra
- `infra/terraform/gcp/` — GCP mock infra
- `docker/` — (optional, for non-Worker services only)

---

## 9. Python Cloud Functions (GCP)
This project includes a Python-based Cloud Function (`ingest_alerts`) for alert ingestion.

1. Install dependencies:
```sh
pip install -r cloud_functions/requirements.txt
```

2. Ensure the following env vars are set (GCP Console or `gcloud functions deploy`):
- `DATTO_EDR_TOKEN`
- `ROCKETCYBER_API_TOKEN`

3. Deploy the function:
```sh
gcloud functions deploy ingest_alerts \
  --runtime python39 \
  --trigger-http \
  --entry-point ingest_alerts \
  --allow-unauthenticated
```

4. Test via HTTP:
```sh
curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/ingest_alerts
```

## Slack Status Reporter

`scripts/slack_status_reporter.py` runs every 15 minutes, checks system health and MCP status, and posts a summary to Slack.

**Setup:**
- Set `SLACK_WEBHOOK` to your Slack Incoming Webhook URL.
- Set `HEALTH_URL` and `MCP_METRICS` to your endpoints.
- Run the script in the background: `python scripts/slack_status_reporter.py &`

No Slack message content or metadata is logged. Only status summaries are sent.
TOGETHER_API_KEY="tgp_v1_syzzNpWSINRsU-YLmXx8YxeRl07XJE6SiU87azH_P2k"

## Directory Naming Conventions

- All Cloudflare Worker and service directories use **kebab-case** (e.g., `ai-orchestrator`, `documentation-worker`).
- All Python utility/function folders use **snake_case** (e.g., `cloud_functions`, `scripts`).
- Avoid camelCase and mixed styles for consistency.
- No duplicate or ambiguous subfolders—each service or function has a unique, descriptive directory.

---

## 10. Automated Revert Process

### Overview
The automated revert process ensures that the repository can be reverted to a desired state using GitHub Actions workflows and custom scripts.

### Steps to Revert the Repository

1. **Find the Commit Hash**
   Use the `git log` command to find the commit hash of the desired state:
   ```sh
   git log
   ```

2. **Revert the Repository**
   Use the `git revert` command to revert the repository to the desired state:
   ```sh
   git revert <commit-hash>
   ```

3. **Verify the Revert**
   Verify the revert by checking out the commit and reviewing the changes:
   ```sh
   git checkout <commit-hash>
   ```

4. **Commit and Push the Changes**
   Commit and push the changes to the repository:
   ```sh
   git commit -m "Revert to <commit-hash>"
   git push origin main
   ```

### GitHub Actions Workflow
The GitHub Actions workflow is configured to automate the revert process using the specified steps. The workflow files are located in the `.github/workflows` directory.

### Custom Script
A custom script `scripts/revert_repository.sh` has been added to automate the revert process. The script includes steps to find the commit hash, revert the repository, verify the revert, and commit and push the changes.

### CI/CD Pipeline Integration
The revert process is integrated into the existing CI/CD pipeline to ensure that the repository can be reverted to a desired state and deployed to the production environment.
