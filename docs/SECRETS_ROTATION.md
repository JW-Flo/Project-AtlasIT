# Secrets Rotation Playbook

Last Updated: 2025-10-14
Status: v1.0
Owner: Security & Operations Team

## Overview

This playbook defines the procedures, cadence, and responsibilities for rotating secrets and credentials across the AtlasIT platform. Regular rotation reduces the impact of potential credential compromise and is a security best practice.

## Rotation Cadence

| Secret Type                  | Rotation Frequency | Owner      | Automation Status |
| ---------------------------- | ------------------ | ---------- | ----------------- |
| API Keys (external services) | 90 days            | Operations | Manual            |
| Database credentials         | 90 days            | Operations | Manual            |
| JWT signing keys             | 30 days            | Operations | Planned           |
| Service-to-service tokens    | 90 days            | Operations | Manual            |
| AI provider API keys         | 90 days            | Operations | Manual            |
| Webhook secrets              | 90 days            | Operations | Manual            |
| OAuth client secrets         | 180 days           | Operations | Manual            |
| Encryption keys              | 365 days           | Security   | Manual            |

## Secrets Inventory

### Critical Secrets (P0 - Immediate Impact)

These secrets have immediate production impact if compromised:

1. **Cloudflare API Tokens**
   - Used by: CI/CD for deployments
   - Stored in: GitHub Secrets
   - Scope: Workers, Pages, D1, R2, KV
   - Rotation command: Generate new token in Cloudflare Dashboard → Update GitHub Secrets

2. **Database Master Credentials**
   - Used by: Migration scripts, admin operations
   - Stored in: Wrangler secrets (per environment)
   - Rotation command: See [Database Credential Rotation](#database-credential-rotation)

3. **AI Provider API Keys**
   - Providers: OpenAI, Together AI, Anthropic, Mistral
   - Used by: AI Orchestrator worker
   - Stored in: Wrangler secrets (`AI_GATEWAY_TOKEN`)
   - Rotation command: See [AI Provider Key Rotation](#ai-provider-key-rotation)

### High Priority Secrets (P1 - Service Degradation)

4. **Service API Keys**
   - Used by: Inter-service authentication
   - Stored in: Wrangler secrets (`API_ALLOWED_KEYS`)
   - Rotation command: See [Service API Key Rotation](#service-api-key-rotation)

5. **Slack Webhook URLs**
   - Used by: Notification system
   - Stored in: Wrangler secrets (`SLACK_WEBHOOK_URL`)
   - Rotation command: Regenerate in Slack → Update secrets

6. **Okta API Credentials**
   - Used by: JML integration, directory sync
   - Stored in: Wrangler secrets
   - Rotation command: See [Okta Credential Rotation](#okta-credential-rotation)

### Medium Priority Secrets (P2 - Limited Impact)

7. **Webhook Signatures**
   - Used by: External webhook validation
   - Stored in: Wrangler secrets
   - Rotation command: Generate new HMAC key → Notify webhook consumers

8. **OAuth Client Secrets**
   - Used by: OAuth flows
   - Stored in: Wrangler secrets
   - Rotation command: Regenerate in provider dashboard → Update secrets

## Detailed Rotation Procedures

### Service API Key Rotation

**Frequency:** 90 days  
**Estimated Time:** 15 minutes  
**Risk Level:** Medium (temporary auth failures possible)

#### Steps:

1. **Generate New Key**

   ```bash
   # Generate cryptographically secure random key
   NEW_KEY=$(openssl rand -base64 32)
   echo "New API Key: $NEW_KEY"
   ```

2. **Add New Key (Dual-Key Period)**

   ```bash
   # For each environment (onboarding, orchestrator, compliance)
   cd onboarding
   wrangler secret put API_ALLOWED_KEYS --env production
   # When prompted, enter: OLD_KEY,NEW_KEY (comma-separated)

   cd ../ai-orchestrator
   wrangler secret put API_ALLOWED_KEYS --env production
   # Enter: OLD_KEY,NEW_KEY

   cd ../compliance-worker
   wrangler secret put API_ALLOWED_KEYS --env production
   # Enter: OLD_KEY,NEW_KEY
   ```

3. **Update Consumer Configuration**
   - Update all services consuming the API to use NEW_KEY
   - Allow 24-48 hours for all consumers to update

4. **Remove Old Key**

   ```bash
   # After 48 hours, remove old key
   cd onboarding
   wrangler secret put API_ALLOWED_KEYS --env production
   # Enter: NEW_KEY (only)

   # Repeat for other services
   ```

5. **Verify**

   ```bash
   # Test with new key
   curl -H "x-api-key: $NEW_KEY" https://orchestrator.atlasit.workers.dev/health
   ```

6. **Document**
   - Update rotation log: [Rotation Log](#rotation-log)
   - Notify team in Slack

---

### AI Provider Key Rotation

**Frequency:** 90 days  
**Estimated Time:** 10 minutes  
**Risk Level:** Low (fallback mechanisms in place)

#### Steps:

1. **Generate New Key in Provider Dashboard**
   - OpenAI: https://platform.openai.com/api-keys
   - Together AI: https://api.together.xyz/settings/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys
   - Mistral: https://console.mistral.ai/api-keys

2. **Update Wrangler Secret**

   ```bash
   cd ai-orchestrator
   wrangler secret put AI_GATEWAY_TOKEN --env production
   # Paste new key when prompted
   ```

3. **Test**

   ```bash
   curl -X POST https://orchestrator.atlasit.workers.dev/ai/infer \
     -H "x-api-key: $SERVICE_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "test", "model": "@cf/meta/llama-3.1-8b-instruct"}'
   ```

4. **Revoke Old Key**
   - Return to provider dashboard
   - Revoke/delete old API key

5. **Document**
   - Update rotation log with provider and date

---

### Database Credential Rotation

**Frequency:** 90 days  
**Estimated Time:** 30 minutes  
**Risk Level:** High (requires careful planning)

#### Prerequisites:

- Schedule maintenance window
- Notify team 48 hours in advance
- Prepare rollback plan

#### Steps:

1. **Create New Credentials**

   ```bash
   # Generate new password
   NEW_DB_PASSWORD=$(openssl rand -base64 32)

   # For D1, credentials are managed by Cloudflare
   # Rotation involves creating new bindings if needed
   ```

2. **Update D1 Bindings** (if rotating database IDs)

   ```toml
   # In wrangler.toml
   [[env.production.d1_databases]]
   binding = "ATLAS_CORE_DB"
   database_name = "atlas_core_db"
   database_id = "<new-uuid>"  # New database ID if rotating
   ```

3. **Migrate Data** (if creating new database)

   ```bash
   wrangler d1 export ATLAS_CORE_DB --env production > backup.sql
   wrangler d1 execute NEW_DB --file backup.sql --env production
   ```

4. **Deploy with New Credentials**

   ```bash
   wrangler deploy --env production
   ```

5. **Verify**

   ```bash
   # Check health endpoints
   npm run smoke:deploy:prod
   ```

6. **Decommission Old Database** (after 7 days)

---

### Okta Credential Rotation

**Frequency:** 90 days  
**Estimated Time:** 20 minutes  
**Risk Level:** Medium

#### Steps:

1. **Create New Okta API Token**
   - Login to Okta Admin Console
   - Security → API → Tokens
   - Create new token with same scopes
   - Copy token (shown only once)

2. **Update Wrangler Secret**

   ```bash
   cd compliance-worker  # Or wherever Okta integration lives
   wrangler secret put OKTA_API_TOKEN --env production
   # Paste new token
   ```

3. **Test Integration**

   ```bash
   # Trigger a sync or check health
   curl https://compliance.atlasit.workers.dev/api/v1/directory/sync/test \
     -H "x-api-key: $SERVICE_API_KEY"
   ```

4. **Revoke Old Token**
   - Return to Okta Admin → Tokens
   - Revoke old token

---

## Emergency Rotation Procedures

### Suspected Compromise

If a secret is suspected to be compromised:

1. **Immediate Actions** (within 15 minutes)
   - Revoke compromised secret immediately
   - Generate and deploy new secret
   - Check audit logs for unauthorized access
   - Enable additional logging if needed

2. **Assessment** (within 1 hour)
   - Determine scope of potential access
   - Review recent activity logs
   - Identify any anomalous requests
   - Document timeline of events

3. **Communication** (within 2 hours)
   - Notify security team
   - Post incident in #security-incidents Slack
   - Create incident ticket
   - Prepare incident report

4. **Post-Incident** (within 24 hours)
   - Complete incident report
   - Update security procedures if needed
   - Schedule post-mortem meeting
   - Implement additional safeguards

### Emergency Rotation Commands

Quick reference for emergency rotation:

```bash
# Rotate all service API keys at once
NEW_KEY=$(openssl rand -base64 32)
echo "Emergency rotation key: $NEW_KEY"

# Update all workers
for worker in onboarding ai-orchestrator compliance-worker; do
  cd $worker
  wrangler secret put API_ALLOWED_KEYS --env production <<< "$NEW_KEY"
  cd ..
done

# Run smoke tests
npm run smoke:deploy:prod
```

---

## Automation Roadmap

### Current State: Manual Rotation

All secrets currently require manual rotation following procedures above.

### Phase 1: Rotation Reminders (Q4 2025)

- Implement automated reminders 2 weeks before rotation due
- Calendar events for operations team
- Slack bot notifications

### Phase 2: Semi-Automated Rotation (Q1 2026)

- Script-based rotation with approval gates
- Automated key generation
- Automated multi-environment updates
- Manual verification step required

### Phase 3: Fully Automated Rotation (Q2 2026)

- Automatic rotation on schedule
- Self-healing for failed rotations
- Audit trail of all rotations
- Anomaly detection during rotation

---

## Monitoring & Compliance

### Rotation Tracking

Maintain rotation log in [Rotation Log](#rotation-log) section below.

### Metrics to Track

- Days since last rotation (per secret type)
- Time to complete rotation
- Failed rotation attempts
- Emergency rotations triggered

### Compliance Requirements

| Standard  | Requirement                  | AtlasIT Implementation          |
| --------- | ---------------------------- | ------------------------------- |
| SOC 2     | Document rotation procedures | This playbook                   |
| SOC 2     | Regular rotation schedule    | 90-day cadence                  |
| SOC 2     | Audit trail                  | Rotation log below              |
| ISO 27001 | Cryptographic key management | Encryption key 365-day rotation |
| PCI DSS   | Change default credentials   | All defaults changed            |

---

## Rotation Log

### 2025

| Date       | Secret Type | Environment | Operator | Notes                          |
| ---------- | ----------- | ----------- | -------- | ------------------------------ |
| 2025-10-14 | Initial     | All         | System   | Baseline documentation created |
|            |             |             |          |                                |
|            |             |             |          |                                |

**Template for new entries:**

```
| YYYY-MM-DD | Secret Type | Environment | Operator Name | Rotation reason / notes |
```

---

## Emergency Contacts

| Role               | Contact              | Availability   |
| ------------------ | -------------------- | -------------- |
| Security Lead      | security@atlasit.com | 24/7           |
| Operations Lead    | ops@atlasit.com      | Business hours |
| On-Call Engineer   | PagerDuty            | 24/7           |
| Cloudflare Support | Enterprise Support   | 24/7           |

---

## Related Documentation

- Secrets and Environment Variables: `docs/secrets-and-env.md`
- Deployment Guide: `docs/deployment-guide.md`
- Security Operations: `docs/SECURITY.md`
- Incident Response: `docs/INCIDENT_RESPONSE.md` (to be created)

---

## Pre-Rotation Checklist

Before starting any secret rotation:

- [ ] Review current rotation procedure
- [ ] Check rotation calendar for conflicts
- [ ] Notify team in #operations channel
- [ ] Ensure backup of current secrets (1Password)
- [ ] Verify smoke test suite is operational
- [ ] Prepare rollback plan
- [ ] Schedule post-rotation verification

---

## Post-Rotation Checklist

After completing secret rotation:

- [ ] Run smoke tests (all environments affected)
- [ ] Verify all services operational
- [ ] Update rotation log
- [ ] Update 1Password with new secrets
- [ ] Notify team of completion
- [ ] Schedule next rotation (90 days)
- [ ] Document any issues encountered

---

**Document Version:** 1.0  
**Next Review:** 2025-11-14  
**Owner:** Security & Operations Team

---

## Appendix A: Secret Storage Locations

| Secret            | Dev      | Staging  | Production | Backup    |
| ----------------- | -------- | -------- | ---------- | --------- |
| API_ALLOWED_KEYS  | Wrangler | Wrangler | Wrangler   | 1Password |
| AI_GATEWAY_TOKEN  | Wrangler | Wrangler | Wrangler   | 1Password |
| SLACK_WEBHOOK_URL | Wrangler | Wrangler | Wrangler   | 1Password |
| OKTA_API_TOKEN    | N/A      | Wrangler | Wrangler   | 1Password |
| DB Credentials    | Local    | Wrangler | Wrangler   | 1Password |
| JWT_SECRET        | Local    | Wrangler | Wrangler   | 1Password |

## Appendix B: Rotation Testing Matrix

Test each rotation with these scenarios:

| Test Case                             | Expected Result |
| ------------------------------------- | --------------- |
| Health check with new key             | HTTP 200        |
| Health check with old key (dual-key)  | HTTP 200        |
| Health check with no key              | HTTP 401        |
| Health check with invalid key         | HTTP 401        |
| API call with new key                 | Success         |
| API call with old key (after removal) | HTTP 401        |
