# COPILOT_CONTEXT2.md
# Project Ignite — Cloudflare Workers Setup Only

We are configuring **only** the Cloudflare Workers-for-Platforms dispatch pipeline for Project Ignite. All other services (GCP, AWS, UI, AI agents) are out of scope for this context.

---

## Purpose
- Package and deploy a **dispatch Worker** named `project-ignite`
- Forward requests to sub-Workers in the `dispatcher` namespace
- Automate Wrangler CLI setup and token management
- Provide a GitHub Actions CI pipeline that builds & publishes the Worker on every `main` push

---

## Repo Structure (Workers-only)

```
/
├─ wrangler.toml                     # dispatch Worker config
├─ index.js                          # dispatch Worker entrypoint
├─ scripts/
│   └─ generate_cf_token.sh          # create & output Wrangler API token
├─ .github/
│   └─ workflows/
│       └─ cloudflare-workers.yml    # CI pipeline for Worker deploy
├─ COPILOT_CONTEXT2.md               # this file
└─ .github/copilot.yml               # Copilot scoping
```

---

## wrangler.toml Requirements

```toml
name = "project-ignite"
compatibility_date = "2025-05-16"
main = "index.js"

[[dispatch_namespaces]]
binding   = "dispatcher"
namespace = "<PLACEHOLDER_NAMESPACE_ID>"
```

---

## index.js Requirements

```js
// index.js
export default {
  async fetch(request, env, ctx) {
    try {
      const subWorker = await env.dispatcher.get("customer-worker-1");
      return await subWorker.fetch(request);
    } catch (err) {
      return new Response("Bad Gateway", { status: 502 });
    }
  }
}
```

---

## scripts/generate_cf_token.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

: "${CF_ACCOUNT_ID?Need to set CF_ACCOUNT_ID}"
: "${CF_GLOBAL_API_KEY?Need to set CF_GLOBAL_API_KEY}"
: "${CF_ACCOUNT_EMAIL?Need to set CF_ACCOUNT_EMAIL}"

echo "Creating Cloudflare API token..."
# (Add curl command to create token here)
echo "Token created. Copy and add to GitHub Secrets as WRANGLER_API_TOKEN."
```

---

## .github/workflows/cloudflare-workers.yml

```yaml
name: Deploy Cloudflare Worker
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm install -g @cloudflare/wrangler
      - run: wrangler login --api-token ${{ secrets.WRANGLER_API_TOKEN }}
      - run: npx wrangler publish
      - run: echo "✅ Workers deployed"
```

---

## Script Conventions
- All Bash scripts must start with:
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  ```
- Validate required env vars (e.g. `: "${VAR?Need to set VAR}"`)
- Echo clear progress/failure messages
- Exit non-zero on failure

---

## Environment Variables & Secrets
- CF_ACCOUNT_ID           # Cloudflare Account ID
- WRANGLER_API_TOKEN      # API token for Wrangler publish
- CF_GLOBAL_API_KEY       # (for token creation script)
- CF_ACCOUNT_EMAIL        # (for token creation script)
- GITHUB_TOKEN            # for GH Actions if needed

---

## GitHub Copilot Scoping (.github/copilot.yml)

```yaml
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
```

---

## Copilot Prompt Seeds (Workers-only)

```yaml
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
```