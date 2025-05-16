# COPILOT_CONTEXT.md

## Project Ignite — Cloudflare Workers Setup Only  
We are configuring **only** the Cloudflare Workers-for-Platforms dispatch pipeline for Project Ignite. All other services (GCP, AWS, UI, AI agents) are out of scope for this context.

---

## Purpose  
- Package and deploy a **dispatch Worker** named `project-ignite`  
- Forward requests to sub-Workers in the `dispatcher` namespace  
- Automate Wrangler CLI setup and token management  
- Provide a GitHub Actions CI pipeline that builds & publishes the Worker on every `main` push

---

## Repo Structure (Workers-only)

```text
/
├─ wrangler.toml                     # dispatch Worker config
├─ index.js                          # dispatch Worker entrypoint
├─ scripts/
│   └─ generate_cf_token.sh          # create & output Wrangler API token
├─ .github/
│   └─ workflows/
│       └─ cloudflare-workers.yml    # CI pipeline for Worker deploy
├─ COPILOT_CONTEXT.md                # this file
└─ .github/copilot.yml               # Copilot scoping

wrangler.toml Requirements

    name = "project-ignite"

    compatibility_date = "<today’s date>"

    main = "index.js"

    [[dispatch_namespaces]]
    binding   = "dispatcher"
    namespace = "<PLACEHOLDER_NAMESPACE_ID>"

index.js Requirements

    Export a fetch handler that:

        Retrieves sub-Worker via env.dispatcher.get("customer-worker-1")

        Forwards the incoming request

        Catches errors and returns a 502 response

scripts/generate_cf_token.sh

    Shebang: #!/usr/bin/env bash + set -euo pipefail

    Uses curl to call Cloudflare’s API, creates a token scoped for Worker script read/write

    Outputs the token for manual copy into GitHub Secrets as WRANGLER_API_TOKEN

GitHub Actions Workflow

Location: .github/workflows/cloudflare-workers.yml

    Trigger: push to main

    Steps:

        Checkout code (actions/checkout@v3)

        Install Node.js & Wrangler (npm ci + npm install -g @cloudflare/wrangler)

        Authenticate Wrangler via wrangler login --api-token ${{ secrets.WRANGLER_API_TOKEN }}

        Run npx wrangler publish

        Exit non-zero on failure; print “✅ Workers deployed” on success

Script Conventions

    All Bash scripts must start with:

#!/usr/bin/env bash
set -euo pipefail

Validate required env vars:

    : "${WRANGLER_API_TOKEN?Need to set WRANGLER_API_TOKEN}"

    Echo clear progress/failure messages

Environment Variables & Secrets

CF_ACCOUNT_ID           # Cloudflare Account ID
WRANGLER_API_TOKEN      # API token for Wrangler publish
CF_GLOBAL_API_KEY       # (for token creation script)
CF_ACCOUNT_EMAIL        # (for token creation script)
GITHUB_TOKEN            # for GH Actions if needed

GitHub Copilot Scoping (.github/copilot.yml)

version: 1
suggestions:
  enable: true
  languages:
    toml: true
    javascript: true
    yaml: true
    bash: true
  paths:
    include:
      - wrangler.toml
      - index.js
      - scripts/generate_cf_token.sh
      - .github/workflows/cloudflare-workers.yml
    exclude:
      - infra/**
      - ai/**
      - cloud-functions/**
      - src/**
      - .github/workflows/sandbox-pipeline.yml

project: project-ignite
prompts:
  - name: cf-token
    description: "Generate a Cloudflare API token scoped for Worker script read/write"
  - name: wrangler-config
    description: "Create a wrangler.toml with dispatch namespace binding"
  - name: cf-dispatch-worker
    description: "Implement index.js dispatch Worker forwarding requests"
  - name: cf-deploy-workflow
    description: "Generate GitHub Actions YAML to install Wrangler and publish Worker"
  - name: smoke-test-worker
    description: "Write a shell script to curl the Worker URL and verify HTTP 200"