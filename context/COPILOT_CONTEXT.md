# COPILOT_CONTEXT.md

# Project Ignite: Unified AI Agent Context (Cursor AI & MCP)

This file is the **canonical, immutable AI policy context** for all Project Ignite services.
It defines behavioral rules, configuration boundaries, inter-service expectations, and allowed mutations.

**Only the `documentation-worker` (AI-controlled, authenticated via dispatch namespace) is permitted to modify this document.** All other agents, services, humans, and external tools must treat this document as read-only.

---

## 1. Global AI Strategy Overview
- AI components operate under a **zero-interaction, zero-guessing, zero-manual** policy.
- Agents must self-resolve failures, reroute logic, and fallback to alternatives autonomously.
- Cursor AI is scoped to **developer environment orchestration** and code/document generation.
- MCP (Master Control Program) is the **central logic router and orchestrator**.
- All tasks are executed via deterministic API dispatch or scheduled CRON triggers.

--Actionable Next Steps Summary

    Resolve Naming Conflicts: Use a consistent workers.dev subdomain and remove any duplicate folder naming (prefer underscores for directory names or standardize as decided).

    Fix Config Files: Update all wrangler.toml files for consistency – correct KV IDs, merge environment var sections, assign routes, and remove any stale or unused config entries.

    Set Secrets: Populate Cloudflare secrets (JWT, Slack, client credentials, API keys) for all services and remove secrets from front-end exposure.

    Finish Integration Logic: Implement missing pieces such as Slack approval callbacks into MCP/1Password, mobile UI actions routing to MCP or DB, and documentation log persistence.

    Verify All Deployments: Deploy each worker in production mode and test their interactions (auth flow, Slack message round-trip, scheduled tasks firing, agent registration, AI responses, etc.).

    Remove Dev Mode Dependencies: Stop using wrangler dev for long-running services – rely on Cloudflare deployment. Use Cloudflare’s built-in tools (cron triggers, Durable Objects, etc.) for continuous operation and self-healing, rather than external scripts.

    Monitor and Iterate: After cleanup and deployment, monitor the system’s performance and autonomy. If any component still requires manual intervention, address it (e.g., automate any remaining approvals or error handling). Leverage Cloudflare observability (logs, tail, alerts) to ensure the MCP and agents remain healthy, and adjust as needed to keep within budget and policy.-

## 2. Cursor AI Agent (Local Dev / Editor Agent)
### Responsibilities
- Auto-generate logic, test scaffolds, inline documentation, and commit messages.
- Follow structure in `context.md`, project-specific rules, and environment variables.
- Inject secure secrets only from `process.env`, never from plaintext.

### Hard Enforcement
- Field names must use `snake_case`.
- Use `wrangler.toml` with proper `[env.production]` and `kv_namespaces` block.
- Commit messages must follow format: `type(scope): message`.
- All code generation must respect IAM and network constraints.

### Example Commit Messages
- `feat(mcp): add Slack action handler for approvals`
- `fix(auth): rotate JWT secret per 7-day policy`
- `chore(doc): regenerate agent table and lifecycle flow`

---

## 3. MCP Worker (Cloudflare Edge Coordinator)
### Responsibilities
- Central orchestration service (aka "brain").
- Delegates to agents based on trigger, token, or event source.
- Writes operational state to KV (`MCP_STORE`) and D1 database.

### Capabilities
- Autonomous agent routing via `dispatcher` binding
- Scheduled task orchestration (ETL, billing checks)
- Recovery fallback routing on agent failure
- Logs dispatch to `documentation-worker`

### Configuration
- Deployed under `project-ignite.workers.dev`
- Must define `MCP_STORE` KV and `dispatcher` namespace
- Secrets required: `JWT_SECRET`, `DISPATCH_AUTH_TOKEN`

---

## 4. MCP-Mobile Worker (UI Gateway)
### Responsibilities
- Browser dashboard for approved operators.
- Issues commands, views logs, status snapshots.
- Requires secure login and signed JWT from IDP.

### Rules
- No `CLIENT_SECRET` exposed in frontend
- All routes must call MCP securely via Bearer token
- Reads status only from MCP or shared KV

---

## 5. IDP Worker (Auth Server)
### Responsibilities
- Validates OAuth `client_id` + `client_secret`
- Issues and introspects JWTs signed with `JWT_SECRET`
- Restricts token TTL to 1 hour max

### Allowed Grants
- `client_credentials` only (no implicit/user grants)

### Bound Resources
- KV: `CLIENTS`
- Env vars: `JWT_SECRET`, `CLIENT_ID`, `CLIENT_SECRET`

---

## 6. Slack Approval Worker
### Responsibilities
- Verifies incoming Slack interactive payloads
- Confirms button presses (approve, reject, defer)
- Relays approval to MCP or secrets store

### Config
- Env: `SLACK_SIGNING_SECRET`
- Route: `slack-approval.project-ignite.workers.dev`
- Actions: Must be non-blocking and ACK all Slack requests

---

## 7. Documentation Worker (AI-Maintained Only)
### Responsibilities
- Maintains tail logs from MCP and agents
- Updates this `Unified AI Agent Context` document
- Routes structured updates to Confluence or R2 bucket

### Enforcement
- Only this agent can mutate this file
- All changes must be signed, tracked, and include:
  - Change rationale
  - Source worker
  - Timestamp (auto)

---

## 8. Okta–Ramp Sync (GCP Function)
### Responsibilities
- Listen to Okta group membership changes
- Map to Ramp roles and apply via API
- Auth via GCP Secret: `ramp_api_token`

### Deployment
- Directory: `cloud_functions/oktaRampSync/`
- Must respond to Okta verification challenge
- Must log all mapping actions to GCP Logs

---

## 9. AI Worker (Cloudflare AI Orchestrator)
### Responsibilities
- Run summarization, report generation, auto-tagging, etc.
- Can call OpenAI, Together, or Cloudflare AI Gateway

### Config
- Env: `AI_PROVIDER`, `AI_GATEWAY_TOKEN`
- Must be rate-limited and cost-bounded
- Only callable by MCP and documentation-worker

---

## Global Policy Constraints
| Policy                          | Applies To            |
|--------------------------------|------------------------|
| No manual prompts              | All agents             |
| Must verify JWT before action  | MCP, Mobile UI, IDP    |
| Secrets from env only          | Cursor, MCP, IDP       |
| No side-effects on dev         | Cursor AI              |
| Writes to logs or R2 only      | Documentation worker   |
| Only AI-doc-agent may edit     | This document          |

---

## Immutable Enforcement Logic
This file is checked and enforced at runtime by the `documentation-worker`.
If any other agent attempts to modify it, MCP must:
- Reject the change
- Log the origin IP, token, and action attempted
- Lock file edits for 5 minutes

---

## Deployment Workflow Summary
1. All worker configs validated via `wrangler.toml` schema.
2. Secrets injected via CLI (`wrangler secret put`) or secret store.
3. MCP `/configure` endpoint hit with agent manifest.
4. MCP sets `autonomous_mode = true`
5. Dispatch namespace updated with agent handles.
6. Logs piped to documentation-worker.
7. Tail events forwarded with timestamp, origin, and result.

---

**Last validated by `documentation-worker`:** {{AUTO_INSERT_TIMESTAMP}}

---

To suggest edits, route structured requests to `documentation-worker` via MCP internal API:
```json
{
  "request_type": "update_ai_context",
  "proposed_by": "agent-name",
  "rationale": "Describe the need for the update",
  "affected_section": "e.g., AI Worker Config",
  "change": "Actual text to inject or replace"
}
```

All changes are evaluated by the AI-doc agent and, if accepted, committed to this file with full audit trace.




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