# Project Ignite Copilot Context

## Vision & Purpose
Build a secure, serverless orchestration platform that automates critical IT workflows—contractor lifecycle, security remediation, license & cost analytics, and AWS WorkSpaces provisioning—so Flosports IT can focus on strategic initiatives, all within a \$400/month budget.

## Key Capabilities
- **Jira → Okta contractor onboarding** (ETSSM project; 90‑day timer + notifications)
- **Minimal Web UI** for IT admin approvals (React+Tailwind SPA health endpoint)
- **Okta user‑lifecycle automation** (group‑based license removal via group templates)
- **AWS WorkSpaces** for SRE contractors (Terraform sandbox accounts + VPC peering)
- **Automated docs** (Cloud Functions auto‑publish Confluence pages with troubleshooting)
- **API health checks** (Datto EDR & RocketCyber connectivity)
- **Cost analytics** (BigQuery/Firestore schema stubs + smoke tests)
- **CI/CD** (GitHub Actions with OIDC deploy, static scans, tests, smoke, manual sign‑off)

## Repo Structure
\`\`\`
/
├─ src/                # Cloud Functions & Web UI code
├─ terraform/          # Terraform modules (VPC, IAM, AWS WorkSpaces, Okta groups)
├─ scripts/            # CI scripts (install-mistral.sh, check-*.sh, smoke_test.sh, prod-deploy.sh)
├─ .copilotrc          # Copilot prompt definitions
└─ COPILOT_CONTEXT.md  # (this file)
\`\`\`

## CI/CD Workflow Phases
1. **Prerequisite**
   - install-mistral.sh (venv & Mistral install)
   - terraform init & apply scaffold; terraform plan
2. **Post‑Meeting** (after infra‑mgr 3 PM)
   - apply VPC & IAM Terraform modules for AWS sandbox
3. **Urgent** (due Today 9 AM)
   - check-jira-connection.sh (HTTP 200 on ETSSM)
   - check-okta-connection.sh (HTTP 200 on Okta API)
   - deploy-webui.sh stub
   - ingest-alerts.sh stub (Datto & RocketCyber ping)
   - init-schema.sh stub (BigQuery & Firestore smoke write/read)
4. **Dev**
   - stub-create-group.sh (Okta group removal)
5. **CI‑Scans**
   - Run pinned Checkov, tfsec, ESLint, tflint
6. **Smoke**
   - smoke_test.sh health checks
7. **Manual Approval**
8. **Prod Deploy**
   - prod-deploy.sh (blue/green)

## Script Conventions
- Shebang: \`#!/usr/bin/env zsh\`
- \`set -euo pipefail\`
- Validate required env vars, echo descriptive logs
- Exit non‑zero on failure

## Environment Variables (GitHub Secrets)
\`\`\`
JIRA_BASE_URL, JIRA_API_USER, JIRA_API_TOKEN, JIRA_PROJECT_KEY=ETSSM
OKTA_DOMAIN, OKTA_API_TOKEN_SA, GROUP_ID_SRE_CONTRACTORS
DATTO_EDR_TOKEN, ROCKETCYBER_API_TOKEN
ZIP_API_KEY, NETSUITE_TOKEN
GCP_PROJECT_ID, GCP_OIDC_PROVIDER, GCP_SA_EMAIL
AWS_ACCESS_KEY_ID_SANDBOX, AWS_SECRET_ACCESS_KEY_SANDBOX, AWS_REGION
\`\`\`

## Guardrails & Risks
- **No secrets in code**; all in GitHub Actions vault
- **OIDC only** for GCP/AWS authentication
- **Budget cap** \$400/mo via Terraform budget & GCP alerts
- **Risks:**
  | Risk                           | Mitigation                                  |
  |--------------------------------|---------------------------------------------|
  | Prereq failures                | CI gate with \`needs: prereq\`; fail-fast   |
  | Over‑privileged scaffold       | Peer review + \`terraform plan\` check      |
  | Okta lockdown breaks CF        | Post-lockdown smoke invocation & rollback   |
  | API rate limits                | Exponential backoff; alert on 429           |
  | Schema stub errors             | Smoke write/read test                       |
  | Web UI delays                  | Static HTML fallback                        |

## Copilot Prompt Seeds (\`.copilotrc\`)
\`\`\`yaml
project: ignite
prompts:
  - name: install-mistral
    description: "Install and verify Mistral in isolated venv for CI"
  - name: check-jira-connection
    description: "Ping Jira project ETSSM and verify HTTP 200"
  - name: check-okta-connection
    description: "Call Okta API health endpoint and verify HTTP 200"
  - name: deploy-webui
    description: "Build and deploy a minimal React+Tailwind SPA to Cloud Run"
  - name: ingest-alerts
    description: "Ping Datto EDR & RocketCyber APIs and verify JSON response"
  - name: init-schema
    description: "Create BigQuery & Firestore schema stubs and smoke test write/read"
  - name: stub-create-group
    description: "Generate a Cloud Function stub to remove a user from an Okta group"
  - name: smoke-test
    description: "Write a zsh smoke test that validates all health endpoints and CLI tools"
  - name: prod-deploy
    description: "Blue/green deploy script for production rollout"
\`\`\`

## Cloud-Native Architecture
- All services (dashboard, cloud functions) run in GCP (Cloud Run, Cloud Functions)
- No local-only execution; all secrets injected via GitHub Actions vault
- Dockerized Flask dashboard, Python cloud functions, Terraform infra

## CI/CD Pipeline
- GitHub Actions phase-gated pipeline (see .github/workflows/ignite-deploy.yml)
- Secrets injected as env vars for all deploy steps
- Automated deploy scripts: scripts/deploy-webui.sh, scripts/ingest-alerts.sh
- Blue/Green deploy, smoke tests, manual sign-off

## Secrets Management
- No secrets in code or config files
- All secrets in GitHub Actions vault, injected at deploy
- Code uses os.environ.get() for all sensitive config

## URLs
- Dashboard: Deployed to Cloud Run, URL output by deploy-webui.sh
- Cloud Functions: Deployed to GCF, URL output by ingest-alerts.sh

## Guardrails
- OIDC for all cloud auth
- Least-privilege IAM, static scans, budget guardrails
- Confluence docs auto-generated by CF/Terraform
