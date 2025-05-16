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
This will curl your Worker’s production URL and verify a 200/502 response.

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
