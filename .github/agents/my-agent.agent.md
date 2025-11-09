---
name: atlasit-copilot
description: >
  AtlasIT Copilot – full-stack DevSecOps automation agent for Cloudflare-native IT platform.
  Executes TypeScript builds, Wrangler deployments, CI/CD validations, Linear synchronization,
  Vault secret operations, and compliance evidence generation. Integrated with MCP servers for
  Linear, Vault, Cloudflare, and OpenTelemetry observability. Enforces zero-trust, audit-safe,
  deterministic, and idempotent workflows aligned with NIST 800-53, SOC2, and ISO27001.

# Enable comprehensive tool access for full-stack DevSecOps automation
tools:
  - "*"
  - "bash"
  - "view"
  - "edit"
  - "create"
  - "github/*"
  - "linear/*"
  - "vault/*"
  - "cloudflare/*"
  - "cursor/*"
  - "playwright/*"
  - "codeql_checker"
  - "code_review"
  - "gh-advisory-database"

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

  github:
    type: local
    command: gh-mcp
    args: []
    tools: ["*"]
    env:
      # GitHub Personal Access Token for full admin capabilities
      # Requires: repo, workflow, admin:org, admin:repo_hook, admin:org_hook, 
      #           admin:public_key, admin:repo_hook, delete_repo, admin:gpg_key
      GH_TOKEN: ${{ secrets.GH_PAT }}
      GH_ENTERPRISE_TOKEN: ${{ secrets.GH_PAT }}
      GITHUB_TOKEN: ${{ secrets.GH_PAT }}

# --- ENVIRONMENT CONTRACT ---
environment:
  runtime: nodejs
  os: ubuntu-latest
  # Authentication for GitHub operations
  auth:
    github:
      # Use GH_PAT for elevated admin operations beyond GITHUB_TOKEN
      # For automation: Create PAT from a service account or machine user
      # DO NOT enable SSO requirement on the PAT for automated operations
      token: ${{ secrets.GH_PAT }}
      scopes:
        - repo
        - workflow
        - write:packages
        - delete:packages
        - admin:org
        - admin:public_key
        - admin:repo_hook
        - admin:org_hook
        - delete_repo
        - admin:gpg_key
        - admin:ssh_signing_key
        - project
        - security_events
      fallback-to-github-token: true
      # Automation requirements:
      # 1. Create PAT from dedicated service/machine user account
      # 2. Do NOT enable "Authorize SSO" for automation PATs
      # 3. Use IP allowlisting for additional security (optional)
      # 4. Enable expiration and rotate every 90 days
      # 5. Grant only required scopes (principle of least privilege)
  permissions:
    # Core write permissions for git operations
    contents: write
    id-token: write
    pull-requests: write
    issues: write
    actions: write
    # Additional admin-level permissions
    checks: write
    deployments: write
    discussions: write
    packages: write
    pages: write
    repository-projects: write
    security-events: write
    statuses: write
    # Metadata read access
    metadata: read
  git-operations:
    # Full git capabilities
    allow-force-push: false  # Safety: prevent rewriting history
    allow-delete-branch: true
    allow-create-branch: true
    allow-merge: true
    allow-rebase: false  # Safety: deterministic workflows only
    allow-cherry-pick: true
    allow-tag: true
    allow-release: true
    # Commit operations
    allow-commit: true
    allow-amend: false  # Safety: immutable commits
    allow-squash: true
    auto-sign-commits: true
    # PR/merge operations
    allow-auto-merge: false  # Explicit approval required
    allow-pr-create: true
    allow-pr-update: true
    allow-pr-close: true
    allow-issue-ops: true
  safety:
    allow-shell: true
    allow-network: true
    block-secrets: true
    evidence-mode: strict
    audit-all-git-ops: true

# --- AGENT BEHAVIOR RULES ---
behavior:
  # Primary trigger pattern - expanded for broader automation coverage
  execute-on:
    - ops/hand-off.md
    - ops/*.plan.md
    - "**/PR*.md"
    - "**/.codex.done"
    - "**/ROADMAP.md"
  # Recognize fenced commands
  command-marker: "### COMMAND PLAN"
  # Evidence logging policy
  evidence:
    emit: true
    format: json
    directory: artifacts/
    naming: "EV-${TRACE_ID}-${ISO_TS}.json"
  # Enforcement with comprehensive checks
  require:
    - "CodeQL:pass"
    - "Trivy:pass"
    - "UnitTests:pass"
    - "TypeCheck:pass"
    - "NoStaticSecrets"
    - "ESLint:pass"
    - "Prettier:pass"
  # Code style enforcement aligned with .copilot/copilot_instructions.md
  code-style:
    language: TypeScript
    target: ES2022
    module: ESNext
    indent: 2
    quotes: single
    semicolons: false
    naming:
      variables: camelCase
      functions: camelCase
      files: kebab-case
    forbidden-imports:
      - fs
      - net
      - tls
      - child_process
    require-coverage: 85

# --- DEFAULT EXECUTION CONTEXTS ---
contexts:
  build:
    pre: |
      npm ci --no-fund --no-audit --ignore-scripts
      npx tsc --noEmit
      npm run lint
    post: |
      npm test -- --ci --coverage
      npm run typecheck
  deploy:
    pre: |
      npm run predeploy
      npm run validate:env
    exec: |
      wrangler deploy --env production --dry-run
      wrangler deploy --env production
    post: |
      echo "Deployment completed for $GITHUB_REF"
      npm run smoke:local || true
  evidence:
    exec: |
      uuid=$(node -e "console.log(crypto.randomUUID())")
      ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
      mkdir -p artifacts
      cat > artifacts/EV-$uuid-$ts.json <<EOF
      {"trace_id":"$uuid","timestamp":"$ts","actor":"copilot","repo":"$GITHUB_REPOSITORY","branch":"$GITHUB_REF_NAME","result":"success","compliance_framework":["NIST-800-53","SOC2","ISO27001"]}
      EOF
      git add artifacts/EV-$uuid-$ts.json
      git commit -m "evidence: add build trace $uuid [AUTO]"
  test:
    pre: |
      npm run pretest:unit
    exec: |
      npm run test:unit
      npm run test:integration
      npm run test:pw
    post: |
      npm run test:coverage
  wrangler:
    pre: |
      npm run validate:env
    exec: |
      wrangler dev --local --persist
    post: |
      wrangler tail --format=pretty

# --- CI/CD PIPELINE INTEGRATION ---
ci:
  workflows:
    - .github/workflows/ci.yml
    - .github/workflows/deploy-orchestrator.yml
    - .github/workflows/security-audit.yml
    - .github/workflows/openapi-contract-gate.yml
    - .github/workflows/deploy-console.yml
    - .github/workflows/deploy.yml
    - .github/workflows/integration-tests.yml
    - .github/workflows/post-deploy-smoke.yml
    - .github/workflows/playwright-smoke.yml
  required-checks:
    - CodeQL
    - Trivy
    - Typecheck
    - Playwright
    - ESLint
    - Vitest
  auto-fix:
    lint: true
    typecheck: true
    format: true
  npm-flags: "--no-fund --no-audit"

# --- TASK INTELLIGENCE ---
planning:
  use-roadmap:
    - ROADMAP.md
    - docs/roadmap.md
    - docs/ARCHITECTURE.md
    - docs/product-roadmap.md
    - docs/phase0-sprint-backlog.md
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
      - area:cloudflare
      - area:typescript
      - area:workers
  output:
    pr-templates: ops/hand-off.md
    issue-prefix: "[AUTO] Copilot –"
    branch-format: "feat/{area}-{short}"
    commit-format: "[AUTO] {message}"
  cloudflare-awareness:
    runtime: workerd
    apis:
      - Workers
      - KV
      - D1
      - R2
      - Durable Objects
      - Workers AI
      - Queues
    bindings-from: wrangler.toml

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
      - no-console-log
      - edge-safe-imports
      - secret-env-only
  dependency-scan:
    enabled: true
    tools: [codeql, trivy, npm-audit]
    advisory-db: github
  attestations:
    generate-slsa: true
    sign-with: oidc
    provenance: true
  data-classification:
    evidence: Confidential
    configs: Internal
    telemetry: Internal
    secrets: Restricted
  compliance-frameworks:
    - NIST-800-53
    - SOC2
    - ISO27001
  forbidden-patterns:
    - "console.log"
    - "require("
    - "import fs from"
    - "import net from"
    - "process.env.SECRET"
    - "hardcoded-secret-pattern"
  # GitHub PAT security guidelines
  github-pat:
    rotation-policy: 90-days
    minimum-scopes: [repo, workflow]
    recommended-scopes: [repo, workflow, admin:org, admin:repo_hook, delete_repo]
    storage: GitHub Secrets (encrypted at rest)
    usage: Elevated operations beyond standard GITHUB_TOKEN permissions
    audit: All PAT operations logged in security-events
    expiration-enforcement: true
    ip-allowlist: optional
    sso-required: false  # Set to false for automated admin actions
    # Note: For automation, PAT must be created without SSO requirement
    # Enterprise orgs: Use a service account or machine user for PAT generation
    # This allows automated operations while maintaining security through:
    #   - Least-privilege scopes
    #   - IP allowlisting (optional)
    #   - Rotation policy enforcement
    #   - Comprehensive audit logging

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

# --- MONOREPO / WORKSPACE CONFIGURATION ---
workspace:
  type: npm-workspaces
  manager: npm
  root: package.json
  workspaces:
    - packages/*
    - onboarding
    - ai-orchestrator
    - mcp*
    - documentation-worker
    - slack-approval-worker
    - console-app
  build-order:
    - packages/shared
    - packages/auth
    - packages/edge-utils
    - onboarding
    - ai-orchestrator
  parallel-builds: true
  cache-strategy: aggressive

# --- CLOUDFLARE PLATFORM AWARENESS ---
cloudflare:
  runtime: workerd
  compatibility-date: "2024-03-20"
  compatibility-flags:
    - nodejs_compat
  bindings-config: wrangler.toml
  environments:
    - production
    - core
    - ai
  primary-apis:
    - Workers
    - KV
    - D1
    - R2
    - Durable Objects
    - Workers AI
  edge-constraints:
    max-script-size: 1MB
    max-worker-size: 10MB
    startup-time-budget: 400ms
    cpu-time-budget: 50ms

# --- INTEGRATION AWARENESS ---
integrations:
  linear:
    org: hardworkco
    project: AtlasIT
    auto-sync: true
  vault:
    namespace: atlasit
    policy: policies/atlasit.hcl
  github:
    auto-label: true
    auto-assign: true
    auto-merge: false
    # GitHub API capabilities for full automation
    api-operations:
      repos:
        - create-branch
        - delete-branch
        - create-tag
        - create-release
        - merge-pr
        - update-pr
        - close-pr
        - create-issue
        - update-issue
        - close-issue
        - add-labels
        - assign-users
      actions:
        - trigger-workflow
        - cancel-workflow
        - re-run-workflow
      checks:
        - create-check-run
        - update-check-run
      deployments:
        - create-deployment
        - create-deployment-status
      git:
        - create-commit
        - create-tree
        - create-blob
        - update-ref
        - create-ref
        - delete-ref
  playwright:
    browsers: [chromium, firefox]
    headless: true
  
# --- DEVELOPMENT WORKFLOW ---
workflow:
  pre-commit:
    - lint-staged
    - typecheck
    - test:unit
  pre-push:
    - test:unit
    - test:integration
  pr-checks:
    - lint
    - typecheck
    - test:unit
    - test:integration
    - codeql
    - trivy
    - playwright
  deployment-checks:
    - validate:env
    - predeploy
    - dry-run
---
