---
name: atlasit-copilot
description: >
  AtlasIT Copilot – full-stack DevSecOps automation agent.
  Executes Cloudflare Worker builds, CI/CD validations, Linear synchronization, Vault secret ops,
  and compliance evidence generation. Integrated with MCP servers for Vault, Cloudflare, and Linear.
  Enforces zero-trust, audit-safe, no-interactive workflows.

# Enable every tool the Copilot runtime can access
tools:
  - "*"
  - "github/*"
  - "linear/*"
  - "vault/*"
  - "cloudflare/*"
  - "cursor/*"
  - "playwright/*"

# --- MCP SERVER DEFINITIONS ---
mcp-servers:
  linear:
    type: local
    command: linear-mcp
    args: []
    tools: ["*"]
    env:
      LINEAR_API_KEY: ${{ secrets.COPILOT_MCP_LINEAR_API_KEY }}
      LINEAR_ORG: hardworkco
      LINEAR_PROJECT: AtlasIT

  vault:
    type: local
    command: vault-mcp
    args: []
    tools: ["*"]
    env:
      VAULT_ADDR: ${{ vars.VAULT_ADDR }}
      VAULT_NAMESPACE: atlasit
      VAULT_ROLE: ${{ vars.VAULT_ROLE }}
      VAULT_JWT: ${{ secrets.VAULT_JWT }}
      VAULT_POLICY_PATH: policies/atlasit.hcl

  cloudflare:
    type: local
    command: cf-mcp
    args: []
    tools: ["*"]
    env:
      CF_ACCOUNT_ID: ${{ vars.CF_ACCOUNT_ID }}
      CF_ZONE_ID: ${{ vars.CF_ZONE_ID }}
      CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      CF_R2_BUCKET: atlas-evidence
      CF_D1_DATABASE: atlas-core-db
      CF_WORKERS_PROJECT: atlasit

  observability:
    type: local
    command: otel-mcp
    args: []
    tools: ["*"]
    env:
      OTEL_EXPORTER_OTLP_ENDPOINT: ${{ vars.OTEL_ENDPOINT }}
      OTEL_EXPORTER_OTLP_HEADERS: ${{ vars.OTEL_HEADERS }}
      OTEL_SERVICE_NAME: atlasit-copilot

# --- ENVIRONMENT CONTRACT ---
environment:
  runtime: nodejs
  os: ubuntu-latest
  permissions:
    contents: write
    id-token: write
    pull-requests: write
    issues: write
    actions: write
  safety:
    allow-shell: true
    allow-network: true
    block-secrets: true
    evidence-mode: strict

# --- AGENT BEHAVIOR RULES ---
behavior:
  # Primary trigger pattern
  execute-on:
    - ops/hand-off.md
    - ops/*.plan.md
    - "**/PR*.md"
  # Recognize fenced commands
  command-marker: "### COMMAND PLAN"
  # Evidence logging policy
  evidence:
    emit: true
    format: json
    directory: artifacts/
    naming: "EV-${TRACE_ID}-${ISO_TS}.json"
  # Enforcement
  require:
    - "CodeQL:pass"
    - "Trivy:pass"
    - "UnitTests:pass"
    - "TypeCheck:pass"
    - "NoStaticSecrets"

# --- DEFAULT EXECUTION CONTEXTS ---
contexts:
  build:
    pre: |
      npm ci --ignore-scripts
      npx tsc --noEmit
      npm run lint || true
    post: |
      npm test -- --ci
  deploy:
    pre: |
      npm run predeploy || true
    exec: |
      wrangler deploy --env production
    post: |
      echo "Deployment completed for $GITHUB_REF"
  evidence:
    exec: |
      uuid=$(node -e "console.log(crypto.randomUUID())")
      ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
      mkdir -p artifacts
      cat > artifacts/EV-$uuid-$ts.json <<EOF
      {"trace_id":"$uuid","timestamp":"$ts","actor":"copilot","repo":"$GITHUB_REPOSITORY","branch":"$GITHUB_REF_NAME","result":"success"}
      EOF
      git add artifacts/EV-$uuid-$ts.json
      git commit -m "evidence: add build trace $uuid"

# --- CI/CD PIPELINE INTEGRATION ---
ci:
  workflows:
    - .github/workflows/ci.yml
    - .github/workflows/deploy-orchestrator.yml
    - .github/workflows/security-audit.yml
    - .github/workflows/openapi-contract-gate.yml
  required-checks:
    - CodeQL
    - Trivy
    - Typecheck
    - Playwright
  auto-fix:
    lint: true
    typecheck: true

# --- TASK INTELLIGENCE ---
planning:
  use-roadmap:
    - docs/ROADMAP.md
    - docs/MILESTONES.md
    - docs/ARCHITECTURE.md
  label-scheme:
    agents:
      - agent:copilot
      - agent:codex
      - agent:cursor
    areas:
      - area:jml
      - area:cdt
      - area:compliance
      - area:infra
  output:
    pr-templates: ops/hand-off.md
    issue-prefix: "[AUTO] Copilot –"
    branch-format: "feat/{area}-{short}"

# --- FAILSAFE BEHAVIOR ---
fail-safes:
  on-error:
    - capture-logs
    - emit-evidence
    - open-draft-pr
  on-validation-fail:
    - stop-execution
    - comment-pr "Validation failed: missing READY checklist"
  max-runtime-minutes: 30
  retry: 2

# --- SECURITY / COMPLIANCE ---
security:
  policy:
    mode: enforced
    checks:
      - no-secrets
      - signed-commits
      - sbom-present
      - opa-tests-present
      - evidence-hash
  dependency-scan:
    enabled: true
    tools: [codeql, trivy]
  attestations:
    generate-slsa: true
    sign-with: oidc
  data-classification:
    evidence: Confidential
    configs: Internal
    telemetry: Internal

# --- OBSERVABILITY / LOGGING ---
logging:
  structured: true
  format: json
  trace-fields:
    - trace_id
    - tenant_id
    - subject_id
  level: info
  export:
    - console
    - otlp
---
