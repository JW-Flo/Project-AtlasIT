# Hybrid AWS Support (Cloudflare + AWS)

## Purpose

Add AWS free-tier services as an optional backplane to complement Cloudflare Workers for longer-running, compliance-heavy, or batch tasks.

## Services

- EventBridge → Step Functions/Lambda (J/M/L orchestration that exceeds Worker limits)
- S3 (dual evidence store with R2)
- DynamoDB (idempotency keys, workflow tokens)
- CloudWatch (central logs/metrics for hybrid flows)

## Integration Patterns

- Workers Durable Objects/Queues → EventBridge (signed/OIDC endpoint)
- Evidence dual-write: R2 + S3 with consistent keys and lifecycle policies
- D1 is app truth; DynamoDB holds idempotency + tokens; periodic reconciliation jobs
- Cloudflare-first execution; AWS optional backplane

## Network & Trust Model

- Trust: Cloudflare → AWS OIDC federation. Workers assume a bounded IAM role via web identity; no static keys.
- Ingress: Prefer EventBridge API destinations with auth via OIDC-signed requests; avoid public Lambda URLs for core flows.
- Egress: Writes to S3/DynamoDB are role-scoped to specific ARNs and prefixes; VPC is not required for this pattern.

## Data Paths & Lifecycles

- Evidence: Dual-write to R2 and S3 using identical sha256 keys. Apply S3 lifecycle to transition to Glacier after 30 days and expire after 365 days (configurable).
- Idempotency/Workflow Tokens: DynamoDB table with TTL (24–72h) and conditional writes; periodic reconciliation job compares D1 (truth) vs. DynamoDB residues.
- Analytics/Logs: CloudWatch log groups per service; Workers retain Analytics Engine for edge metrics; optionally export summaries nightly.

## Minimal Runbooks (Dev)

1) Verify OIDC role assumption
   - aws sts get-caller-identity (using web identity) returns expected role ARN.
2) Smoke EventBridge
   - PutEvents to the dedicated bus and confirm target (Step Functions or Lambda) invocation in CloudWatch logs.
3) Evidence mirror check
   - Write a test blob to R2 and S3 with the same hash key; confirm lifecycle tags and object metadata present.
4) Budget alarms
   - Ensure AWS Budgets alarms exist for free-tier guardrails; alerts route to email/Slack.

## Guardrails

- Free-tier by default; fail CI on unapproved instance sizes or regions.
- IAM least privilege with resource-level conditions (bucket ARN/prefix, table name, event bus ARN).
- No secrets in repo; rely on OIDC federation and per-env role mappings.
- Feature-flag any hybrid path; Cloudflare-only remains the default runtime.

### OIDC and IAM Roles

- Configure Cloudflare → AWS OIDC trust to assume a minimal IAM role for EventBridge PutEvents and S3/DynamoDB writes.
- No long-lived access keys; use session-bound identities.

### Terraform Layout

- infra/aws/providers.tf – OIDC provider, AWS region, default tags.
- infra/aws/eventing.tf – EventBridge bus/rule/target, IAM role/policy for PutEvents, Step Functions integration.
- infra/aws/storage.tf – S3 bucket (versioning + lifecycle), DynamoDB tables (PK/SK, TTL for idempotency tokens).
- infra/aws/observability.tf – CloudWatch log groups/metrics filters.

Apply in dev-only accounts; pin to free-tier and add budget alarms.

## Terraform

- Modules live under `infra/aws/**`
- Keep resources in free-tier configurations
- Prefer OIDC federation (no static credentials)

## Security Notes

- No hardcoded secrets; no long-lived keys
- Use Cloudflare → AWS OIDC to assume roles
- Restrictive IAM policies; least privilege
