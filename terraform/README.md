# AtlasIT Infrastructure

Terraform configurations for the AtlasIT multi-tenant IT automation platform on Cloudflare.

## Directory Structure

```
terraform/
├── main.tf                     # Phase 0 baseline (minimal root)
├── variables.tf                # Root variables
├── .conftest.toml              # Conftest (OPA) configuration
├── cloudflare/                 # Standalone Cloudflare worker deployments
│   ├── main.tf
│   └── variables.tf
├── modules/
│   └── cloudflare-platform/    # Reusable module: KV + D1 + R2 + Workers
│       ├── main.tf
│       └── variables.tf
├── environments/               # Per-environment root modules
│   ├── dev/
│   ├── staging/
│   └── prod/
├── aws/                        # AWS modules (separate provider)
│   ├── environments/dev/
│   └── modules/
├── policies/                   # OPA/Rego policy-as-code
│   ├── main.rego               # Entrypoint aggregating all policies
│   ├── cloudflare.rego         # Cloudflare-specific rules
│   ├── security.rego           # Security guardrails
│   ├── naming.rego             # Naming convention enforcement
│   └── test/                   # OPA test suite
│       ├── cloudflare_test.rego
│       ├── security_test.rego
│       └── naming_test.rego
└── README.md
```

## Prerequisites

- Terraform >= 1.6.0
- Cloudflare account and API token
- [conftest](https://www.conftest.dev/) >= 0.46.0 (for policy checks)
- [OPA](https://www.openpolicyagent.org/) >= 0.61.0 (for running policy tests)

## Quick Start

```bash
# Initialize a specific environment
terraform -chdir=terraform/environments/dev init

# Plan
TF_VAR_cloudflare_api_token="..." \
TF_VAR_cloudflare_account_id="..." \
TF_VAR_core_api_worker_content="// stub" \
  terraform -chdir=terraform/environments/dev plan

# Apply
terraform -chdir=terraform/environments/dev apply
```

## Drift Detection

Infrastructure drift is checked automatically via GitHub Actions (daily at 06:00 UTC) and on every PR touching `terraform/**`.

### Running locally

```bash
# Check all environments for drift
./scripts/detect-drift.sh

# Check a single environment
./scripts/detect-drift.sh --module dev

# Detect and interactively fix drift
./scripts/detect-drift.sh --fix
```

Exit codes:
- `0` — No drift
- `1` — Error during plan
- `2` — Drift detected

### State validation

Validates that Terraform state contains the expected resources:

```bash
# Validate all modules
node scripts/validate-tf-state.mjs

# Single module
node scripts/validate-tf-state.mjs --module terraform/environments/dev

# JSON output (for CI)
node scripts/validate-tf-state.mjs --json
```

## Policy-as-Code

Policies are written in [Rego](https://www.openpolicyagent.org/docs/latest/policy-language/) (OPA) and enforced via [conftest](https://www.conftest.dev/).

### Policy categories

| File | Scope | Severity |
|------|-------|----------|
| `cloudflare.rego` | KV naming, D1 location hints, R2 access, worker bindings | deny/warn |
| `security.rego` | No hardcoded secrets, security headers, CORS wildcards | deny/warn |
| `naming.rego` | `atlasit-` prefix, allowed environments | deny/warn |

### Running policies locally

```bash
# Generate a plan JSON
terraform -chdir=terraform/environments/dev plan -out=tfplan
terraform -chdir=terraform/environments/dev show -json tfplan > tfplan.json

# Run conftest
conftest test --policy terraform/policies/ --namespace main tfplan.json
```

### Running policy tests

```bash
# Run all OPA tests
opa test terraform/policies/ -v

# Run with coverage
opa test terraform/policies/ -v --coverage
```

### Adding new policy rules

1. Choose the appropriate file (`cloudflare.rego`, `security.rego`, `naming.rego`) or create a new `.rego` file.
2. Add a `deny` rule (blocks the plan) or `warn` rule (advisory) using the pattern:
   ```rego
   deny contains msg if {
     some rc in input.resource_changes
     # your condition
     msg := sprintf("Explanation: %s", [rc.address])
   }
   ```
3. Add corresponding tests in `terraform/policies/test/`.
4. Run `opa test terraform/policies/ -v` to verify.
5. If you created a new file, import it in `main.rego`.

## CI/CD Integration

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `iac-drift-detection.yml` | Daily schedule + PR on `terraform/**` | Drift detection + policy validation |
| `terraform.yml` | PR on `terraform/**` + 6h schedule | Legacy drift detection |
| `terraform-plan.yml` | PR on `terraform/aws/**` | AWS plan preview |
| `terraform-apply.yml` | Push to main on `terraform/aws/**` | AWS auto-apply |

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers/KV/D1/R2 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

### How drift is reported

- **On PR**: Comments with plan output and policy check results.
- **On schedule**: Creates/updates a GitHub Issue labeled `infrastructure-drift` with the plan diff.
- **Workflow does NOT auto-apply** — all changes require manual review and apply.

## Phase 0 Notes

- Cloudflare Workers + KV + D1 + R2 only (no GCP expansion yet).
- Local Terraform state; remote backend deferred to later phases.
- Secrets managed outside Terraform via `wrangler secret` and GitHub Actions secrets.
