# AtlasIT AWS Infra (Dev Backplane)

This module provides a minimal AWS backplane for development:

- EventBridge bus for hybrid events
- S3 evidence mirror (lifecycle: Glacier at 30d, expire at 365d)
- DynamoDB idempotency table with TTL
- OIDC provider + IAM role trust and scoped permissions
- Observability (CloudWatch log groups; placeholder for budgets)

> Production hardening and budgets are out of scope here and should be added by infra owners.

## Usage

Variables (defaults are dev-safe):

- region (default: us-east-1)
- env (default: dev)
- account_id (no default, required for trust policy)
- oidc_issuer (external OIDC issuer URL; required)

Plan/apply with a remote backend only.

```bash
terraform init
terraform plan -var "account_id=123456789012" -var "oidc_issuer=oidc.example.com" -var "env=dev"
```
