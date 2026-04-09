# AtlasIT: Cloudflare → AWS Migration Plan

## Cloudflare → AWS Service Mapping

| Cloudflare Service | Resource | AWS Replacement | Terraform Resource |
|---|---|---|---|
| **D1** `atlasit-shared` | Tenants, users, directory, compliance, audit | Aurora PostgreSQL (future) | TBD — `aws_rds_cluster` |
| **D1** `atlas_core_db` | Onboarding, marketplace | Aurora PostgreSQL (shared) | TBD |
| **D1** `atlasit_compliance` | Compliance scoring data | Aurora PostgreSQL (shared) | TBD |
| **D1** `atlas_audit_db` | Audit trail | Aurora PostgreSQL (shared) | TBD |
| **D1** `atlas_audit_shadow` | Audit shadow copies | Aurora PostgreSQL (shared) | TBD |
| **KV** `KV_SESSIONS` | Session tokens | DynamoDB `atlasit-sessions-{env}` | `aws_dynamodb_table.sessions` |
| **KV** `KV_CACHE` | API response cache | DynamoDB `atlasit-cache-{env}` | `aws_dynamodb_table.cache` |
| **KV** `KV_FEATURE_FLAGS` | Feature rollout flags | DynamoDB `atlasit-feature-flags-{env}` | `aws_dynamodb_table.feature_flags` |
| **KV** `MCP_STORE` | MCP agent state | DynamoDB `atlasit-idem-{env}` (reuse) | `aws_dynamodb_table.idempotency` |
| **R2** `atlas-evidence` | Compliance evidence | S3 `atlasit-evidence-{env}-{acct}` | `aws_s3_bucket.evidence` |
| **R2** `atlas-policies` | Policy documents | S3 `atlasit-policies-{env}-{acct}` | `aws_s3_bucket.policies` |
| **R2** `atlas-artifacts` | Compliance artifacts | S3 `atlasit-artifacts-{env}-{acct}` | `aws_s3_bucket.artifacts` |
| **Queues** `atlasit-step-tasks` | Workflow dispatch | SQS `atlasit-step-tasks-{env}` | `aws_sqs_queue.step_tasks` |
| **Cron** `*/5 * * * *` | Compliance scoring | EventBridge `rate(5 minutes)` | `aws_scheduler_schedule.compliance_scoring` |
| **Cron** `0 2 * * *` | Daily evaluation | EventBridge `cron(0 2 * * ? *)` | `aws_scheduler_schedule.daily_evaluation` |
| **Workers** (all) | Compute | Lambda functions | `aws_lambda_function.*` |
| **Pages** (console) | SPA hosting | S3 + CloudFront | `aws_s3_bucket.console` + `aws_cloudfront_distribution.main` |
| **DNS** | atlasit.pro | Route 53 | `aws_route53_zone.primary` |
| **CDN** | Edge caching | CloudFront | `aws_cloudfront_distribution.main` |
| **WAF** | Edge security | AWS WAF | `aws_wafv2_web_acl.edge` |
| **TLS** | Certificates | ACM (us-east-1) | `aws_acm_certificate.main` |

## D1 → Aurora PostgreSQL Migration Strategy

### Schema Translation (SQLite → PostgreSQL)

Key differences to handle:
- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL` / `BIGSERIAL`
- `TEXT` → `TEXT` or `VARCHAR(n)` (no change needed in most cases)
- `REAL` → `DOUBLE PRECISION`
- `BLOB` → `BYTEA`
- `datetime('now')` → `NOW()` / `CURRENT_TIMESTAMP`
- `json_extract()` → `jsonb` operators (`->`, `->>`, `@>`)
- `GROUP_CONCAT()` → `STRING_AGG()`
- Missing `IF NOT EXISTS` for some DDL — add explicitly

### Migration Steps

1. **Export D1 schemas**: `wrangler d1 execute <db> --command ".schema" --remote`
2. **Convert to PostgreSQL DDL**: automated script + manual review
3. **Export D1 data**: `wrangler d1 export <db> --remote --output <file>.sql`
4. **Transform data**: convert SQLite dump to PostgreSQL `COPY` format
5. **Import to Aurora**: `psql -h <aurora-endpoint> -f <converted>.sql`
6. **Validate**: row counts, checksums, sample queries

### Dual-Write Bridge (Transition Period)

During cutover, implement dual-write at the application layer:
- Primary writes go to Aurora
- Shadow writes go to D1 (for rollback safety)
- Read path switches from D1 → Aurora per-service

## KV → DynamoDB Migration

### Table Design

All KV namespaces map to single-table DynamoDB with `pk` as the partition key:

```
KV_SESSIONS → pk = "session#<session-id>", ttl = expiry timestamp
KV_CACHE    → pk = "cache#<key>", ttl = NOW + cache_duration
KV_FLAGS    → pk = "flag#<flag-name>", no TTL (persistent)
MCP_STORE   → pk = "mcp#<agent-id>", ttl = optional
```

### Migration Script Approach

```bash
# Export from Cloudflare KV
wrangler kv key list --namespace-id <id> | jq -r '.[].name' > keys.txt
for key in $(cat keys.txt); do
  wrangler kv key get "$key" --namespace-id <id> > "kv-export/$key"
done

# Import to DynamoDB
aws dynamodb batch-write-item --request-items file://kv-import.json
```

## R2 → S3 Migration

R2 is S3-compatible, so standard tools work:

```bash
# Using rclone (recommended for large transfers)
rclone sync r2:atlas-evidence s3:atlasit-evidence-dev-457335975503 \
  --transfers 16 --checkers 8 --progress

# Verify
rclone check r2:atlas-evidence s3:atlasit-evidence-dev-457335975503
```

## DNS Cutover Procedure

1. **T-72h**: Lower TTL on all atlasit.pro records to 60s
2. **T-0**: Create Route 53 weighted records (Cloudflare=255, AWS=1)
3. **T+1h**: Shift to (Cloudflare=200, AWS=55) — ~20% to AWS
4. **T+4h**: Shift to (Cloudflare=128, AWS=128) — 50/50
5. **T+12h**: Shift to (Cloudflare=1, AWS=255) — ~99% to AWS
6. **T+24h**: Remove Cloudflare records, set AWS weight to 255
7. **T+48h**: Restore TTL to 300s

### Rollback

At any point: set AWS weight=0, Cloudflare weight=255. Takes effect within TTL window (60s during cutover).

## Phase Timeline

| Phase | Target Start | Duration | Status |
|-------|-------------|----------|--------|
| Discovery & inventory | 2026-04-13 | 10 days | **In Progress** |
| AWS landing zone | 2026-04-20 | 10 days | **Done** (basic infra) |
| Data plane buildout | 2026-04-27 | 15 days | **In Progress** (S3/DDB done, Aurora pending) |
| Compute migration | 2026-05-05 | 30 days | **Scaffolded** (Lambda stubs ready) |
| Edge + security | 2026-05-19 | 10 days | **In Progress** (CloudFront/WAF/ACM added) |
| DNS cutover | 2026-06-15 | 7 days | Pending |
| Post-cutover hardening | 2026-06-22 | 14 days | Pending |
