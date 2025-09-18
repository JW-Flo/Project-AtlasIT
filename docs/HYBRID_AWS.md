# Hybrid AWS Support (Cloudflare + AWS)

This guide describes an optional AWS “backplane” that complements the Cloudflare-first runtime. Use it for long-running, compliance-heavy, or batch flows without changing the default execution model.

## What you get

- Event-driven orchestration beyond Worker limits via EventBridge → Step Functions/Lambda
- Dual evidence storage: Cloudflare R2 + AWS S3 using identical sha256 keys
- Idempotency/workflow tokens via DynamoDB (short TTL)
- Centralized hybrid logs/metrics in CloudWatch (Workers keep Analytics Engine)

## Architecture (ASCII)

```text
Client → Cloudflare Worker → Durable Object/Queue → [Feature flag] → EventBridge Bus → Step Functions/Lambda
                                                                            ↘ evidence dual‑write ↙
                                                                        R2 (primary)     S3 (mirror)

Truth: D1 (SQLite)  |  Idempotency: DynamoDB (TTL 24–72h)
```

## Prerequisites

- AWS account (dev/sandbox) with free‑tier guardrails and budgets
- AWS CLI configured with a dev profile
- Cloudflare account with Wrangler set up for this workspace
- No static AWS keys in repo; we use OIDC/web identity for role assumption

## Trust model (OIDC → IAM role)

Workers call AWS with a short‑lived role assumed via web identity (no long‑lived keys). Create an IAM role trusted by an OIDC provider you control (e.g., Cloudflare Access or your IdP). Bind least‑privilege permissions for the targets you use (S3/DynamoDB/EventBridge).

Example IAM trust policy (template – replace placeholders):

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Effect": "Allow",
         "Principal": { "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/<YOUR_OIDC_ISSUER>" },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
            "StringEquals": {
               "<YOUR_OIDC_ISSUER>:aud": "sts.amazonaws.com"
            },
            "StringLike": {
               "<YOUR_OIDC_ISSUER>:sub": "project-atlasit/*"
            }
         }
      }
   ]
}
```

Example role permissions (scoped):

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Sid": "EventBridgePut",
         "Effect": "Allow",
         "Action": ["events:PutEvents"],
         "Resource": "arn:aws:events:<REGION>:<ACCOUNT_ID>:event-bus/atlasit-dev"
      },
      {
         "Sid": "S3EvidenceMirror",
         "Effect": "Allow",
         "Action": ["s3:PutObject","s3:PutObjectTagging"],
         "Resource": "arn:aws:s3:::atlasit-evidence-dev/sha256/*"
      },
      {
         "Sid": "DynamoIdempotency",
         "Effect": "Allow",
         "Action": ["dynamodb:PutItem","dynamodb:DeleteItem","dynamodb:GetItem"],
         "Resource": "arn:aws:dynamodb:<REGION>:<ACCOUNT_ID>:table/atlasit-idem-dev"
      }
   ]
}
```

## Terraform skeleton (reference)

Place modules under `infra/aws/**` in a separate PR. Minimal layout:

```hcl
infra/aws/
   providers.tf         # aws provider + default tags
   oidc.tf              # aws_iam_openid_connect_provider + role trust
   eventing.tf          # aws_cloudwatch_event_bus/rule/target + IAM policy
   storage.tf           # aws_s3_bucket (+versioning +lifecycle) + aws_dynamodb_table (TTL)
   observability.tf     # log groups, metric filters, budgets
```

S3 lifecycle (example): transition to Glacier after 30 days; expire at 365 days.

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "evidence" {
   bucket = aws_s3_bucket.evidence.id
   rule {
      id     = "evidence-retention"
      status = "Enabled"
      filter { prefix = "sha256/" }
      transition { days = 30 storage_class = "GLACIER" }
      expiration { days = 365 }
   }
}
```

## Integration patterns

- Workers → EventBridge: signed/OIDC calls to PutEvents on a dedicated bus
- Evidence: dual‑write to R2 and S3 using the same sha256 key paths (e.g., `sha256/ab/cd/<fullhash>.json`)
- State: D1 remains source of truth; DynamoDB only for short‑lived tokens/locks (24–72h TTL)

## Dev runbook (copy‑paste zsh)

1) Verify role access (using your dev profile)

```zsh
aws sts get-caller-identity --profile atlasit-dev
```

1) Smoke EventBridge bus

```zsh
aws events put-events \
   --profile atlasit-dev \
   --entries '[{"Source":"atlasit.dev","DetailType":"smoke","Detail":"{\"ok\":true}","EventBusName":"atlasit-dev"}]'
```

1) S3 mirror write (evidence sample)

```zsh
HASH="$(echo -n 'smoke' | shasum -a 256 | awk '{print $1}')"
aws s3api put-object \
   --profile atlasit-dev \
   --bucket atlasit-evidence-dev \
   --key "sha256/${HASH:0:2}/${HASH:2:2}/${HASH}.json" \
   --tagging "purpose=evidence&env=dev" \
   --body <(echo '{"status":"ok","source":"smoke"}')
```

1) DynamoDB idempotency token

```zsh
aws dynamodb put-item \
   --profile atlasit-dev \
   --table-name atlasit-idem-dev \
   --item '{"pk":{"S":"smoke#token"},"sk":{"S":"v1"},"ttl":{"N":"'$(($(date +%s)+86400))'"}}'
```

## Rollback

- Disable hybrid feature flag → all flows remain Cloudflare‑only
- Empty EventBridge rules/targets for the dev bus
- S3: retain objects; lifecycle will expire per policy
- DynamoDB: let TTL reap idempotency rows

## Guardrails

- Free‑tier by default; budgets alarmed to email/Slack
- IAM least privilege with resource‑scoped conditions (bucket ARN/prefix, table name, event‑bus ARN)
- No secrets in repo; use OIDC/web identity
- Hybrid paths feature‑flagged and off by default

## References

- See `docs/ARCHITECTURE.md` for the overall system; this doc scopes the optional AWS backplane only.
