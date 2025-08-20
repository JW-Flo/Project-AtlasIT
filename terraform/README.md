# AtlasIT Infrastructure

This directory contains the Infrastructure as Code (IaC) configurations for AtlasIT using Terraform.

## Infrastructure Components

- Cloudflare Workers for serverless edge computing
- Google Cloud Platform (GCP) for cloud functions and services
- Storage and database resources
- Networking and security configurations

## Directory Structure

```
terraform/
├── cloudflare/         # Cloudflare Workers configuration
├── gcp/               # Google Cloud Platform resources
├── modules/           # Reusable Terraform modules
└── environments/      # Environment-specific configurations
    ├── dev/
    ├── staging/
    └── prod/
```

## Prerequisites

- Terraform >= 1.0.0
- Cloudflare account and API token
- GCP account and credentials
- Required provider configurations

## Quick Start

1. Initialize Terraform:

```bash
terraform init
```

2. Plan the deployment:

```bash
terraform plan -var-file=environments/dev/terraform.tfvars
```

3. Apply the configuration:

```bash
terraform apply -var-file=environments/dev/terraform.tfvars
```

## Modules

### Cloudflare Workers

- API Gateway
- Authentication
- Event Processing
- Application Services

### GCP Resources

- Cloud Functions
- Cloud Storage
- Cloud SQL
- Pub/Sub
- Secret Manager

## Environment Variables

Create a `terraform.tfvars` file in each environment directory with the following variables:

```hcl
cloudflare_account_id = "your_account_id"
cloudflare_api_token  = "your_api_token"
gcp_project_id        = "your_project_id"
gcp_region            = "your_region"
environment           = "dev|staging|prod"
```

## Security Notes

- All secrets are managed through cloud provider secret management services
- Access controls are implemented using least-privilege principle
- Network security follows zero-trust architecture
- Regular security scanning and updates are automated

## Next Steps

1. Implement core infrastructure modules
2. Set up CI/CD pipeline
3. Configure monitoring and alerting
4. Implement backup and disaster recovery
5. Add security compliance checks

---

### Phase 0 Minimal Baseline Addendum

For current MVP foundation we will defer full multi-cloud build-out and focus on:

- Cloudflare Workers + KV + D1 (no GCP expansion yet) to keep PoC free.
- Single `main.tf` with provider + placeholder resources (to be added) instead of full env matrix.
- Local Terraform state; remote backend deferred to Phase 4 (pricing & prod hardening).
- Secrets remain outside Terraform (managed via `wrangler secret` and GitHub Actions secrets).

Future sections in this document (GCP modules) are placeholders until cost justification in later phases.
