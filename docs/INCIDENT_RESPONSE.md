# Incident Response Playbook

Last Updated: 2025-10-14
Status: v1.0
Owner: Operations & Security Team

## Overview

This playbook defines procedures for responding to incidents affecting the AtlasIT platform. It covers incident classification, response procedures, communication protocols, and post-incident review processes.

## Incident Severity Levels

### P0 - Critical

**Definition:** Complete service outage or critical security breach

**Examples:**

- All API endpoints returning 5xx errors
- Database unavailable
- Active security breach or data exposure
- Service completely inaccessible for >5 minutes

**Response Time:** 15 minutes
**Resolution Target:** 4 hours
**Escalation:** Immediate - page on-call engineer

---

### P1 - High

**Definition:** Major functionality broken or significant degradation

**Examples:**

- Core feature unavailable (compliance snapshot, policy generation)
- Performance degradation >50% of baseline
- Critical security vulnerability discovered
- Multiple workers failing
- Data inconsistency affecting operations

**Response Time:** 1 hour
**Resolution Target:** 24 hours
**Escalation:** Notify on-call within 1 hour

---

### P2 - Medium

**Definition:** Minor feature degradation or non-critical issues

**Examples:**

- Single non-critical endpoint failing
- UI rendering issues
- Performance degradation <50% of baseline
- Non-critical security issue
- Elevated error rates (not yet impacting users)

**Response Time:** 4 hours
**Resolution Target:** 1 week
**Escalation:** Regular business hours support

---

### P3 - Low

**Definition:** Cosmetic issues or minor bugs

**Examples:**

- Documentation errors
- UI cosmetic issues
- Non-impacting log warnings
- Feature requests
- Low-priority bugs

**Response Time:** Next business day
**Resolution Target:** 1 month
**Escalation:** None - handle in normal sprint

---

## Incident Response Process

### Phase 1: Detection & Triage (0-15 minutes)

#### Detection Methods

1. **Automated Monitoring**
   - Health endpoint failures
   - Error rate spikes
   - Latency threshold breaches
   - Resource exhaustion alerts

2. **User Reports**
   - Support tickets
   - Slack messages
   - Email reports

3. **Team Discovery**
   - Developer testing
   - Manual health checks
   - Smoke test failures

#### Triage Steps

1. **Acknowledge Alert** (within 5 minutes)

   ```bash
   # Post in #incidents Slack channel
   🚨 INCIDENT DETECTED
   Severity: P[0-3]
   Service: [worker/component]
   Summary: [brief description]
   Responder: @[your-name]
   Time: [UTC timestamp]
   ```

2. **Initial Assessment** (within 15 minutes)
   - Verify the issue is reproducible
   - Determine affected services
   - Estimate user impact
   - Assign severity level
   - Create incident ticket

3. **Declare Incident** (for P0/P1)

   ```bash
   # Create incident channel in Slack
   /incident create [brief description]

   # Example
   /incident create API gateway returning 503 errors
   ```

---

### Phase 2: Investigation & Containment (15-60 minutes)

#### Investigation Checklist

- [ ] Check health endpoints for all workers

  ```bash
  curl https://onboarding.atlasit.workers.dev/health
  curl https://orchestrator.atlasit.workers.dev/health
  curl https://compliance.atlasit.workers.dev/health
  ```

- [ ] Review recent deployments

  ```bash
  git log --oneline -10
  wrangler deployments list
  ```

- [ ] Check CloudFlare dashboard
  - Worker analytics
  - Error rates
  - Request volume
  - Bandwidth usage

- [ ] Review structured logs

  ```bash
  # Check for error patterns
  wrangler tail [worker-name] | grep -i error
  ```

- [ ] Verify database connectivity

  ```bash
  wrangler d1 execute ATLAS_CORE_DB --command="SELECT 1"
  ```

- [ ] Check external dependencies
  - AI provider status pages
  - Cloudflare status
  - Third-party API status

#### Containment Actions

**For service degradation:**

1. Enable feature flags to disable non-critical features
2. Increase rate limits if needed
3. Scale resources if possible

**For suspected security issues:**

1. Rotate compromised credentials immediately
2. Enable additional logging
3. Block suspicious IP addresses if identified
4. Document all suspicious activity

**For data issues:**

1. Stop writes to affected tables (if safe)
2. Create database backup immediately
3. Document data state before any fixes

---

### Phase 3: Communication (Ongoing)

#### Internal Communication

**P0 Incidents:**

- Updates every 30 minutes in incident channel
- Notify leadership immediately
- Keep team informed via Slack

**P1 Incidents:**

- Updates every 2 hours
- Daily summary to leadership
- Team updates via Slack

**P2/P3 Incidents:**

- Daily updates in #operations
- Weekly summary in team meeting

#### External Communication (if applicable)

**Status Page Updates:**

```markdown
[YYYY-MM-DD HH:MM UTC] INVESTIGATING
We are investigating reports of [issue].
Updates will be posted as we learn more.

[YYYY-MM-DD HH:MM UTC] IDENTIFIED
We have identified the issue as [cause].
Working on resolution. ETA: [time]

[YYYY-MM-DD HH:MM UTC] MONITORING
Fix has been deployed. Monitoring for stability.

[YYYY-MM-DD HH:MM UTC] RESOLVED
Issue has been resolved. Service is fully operational.
```

---

### Phase 4: Resolution (Variable timing based on severity)

#### Resolution Checklist

- [ ] Identify root cause
- [ ] Develop and test fix
- [ ] Deploy fix to staging (if time permits)
- [ ] Deploy fix to production
- [ ] Verify fix resolves issue
- [ ] Monitor for 2x resolution time
- [ ] Run smoke tests
  ```bash
  npm run smoke:deploy:prod
  ```

#### Rollback Procedure (if fix fails)

```bash
# Identify previous good deployment
wrangler deployments list

# Rollback to previous version
wrangler rollback --message "Rolling back due to incident"

# Verify rollback successful
npm run smoke:deploy:prod
```

---

### Phase 5: Post-Incident Review (Within 48 hours)

#### Post-Incident Report Template

```markdown
# Incident Report: [Brief Title]

**Incident ID:** INC-YYYY-MM-DD-###
**Severity:** P[0-3]
**Declared:** YYYY-MM-DD HH:MM UTC
**Resolved:** YYYY-MM-DD HH:MM UTC
**Duration:** [X hours Y minutes]
**Responders:** @user1, @user2

## Summary

[2-3 sentence summary of what happened]

## Impact

- **Users Affected:** [number or percentage]
- **Services Affected:** [list]
- **Duration:** [total time]
- **Data Loss:** [yes/no, details if applicable]

## Timeline

| Time (UTC) | Event                 |
| ---------- | --------------------- |
| HH:MM      | Issue began           |
| HH:MM      | Alert triggered       |
| HH:MM      | Incident declared     |
| HH:MM      | Root cause identified |
| HH:MM      | Fix deployed          |
| HH:MM      | Monitoring confirmed  |
| HH:MM      | Incident resolved     |

## Root Cause

[Detailed technical explanation of what caused the incident]

## Resolution

[Description of how the incident was resolved]

## What Went Well

- [Positive observation 1]
- [Positive observation 2]

## What Could Be Improved

- [Improvement area 1]
- [Improvement area 2]

## Action Items

| Action          | Owner | Due Date   | Status |
| --------------- | ----- | ---------- | ------ |
| [Action item 1] | @user | YYYY-MM-DD | Open   |
| [Action item 2] | @user | YYYY-MM-DD | Open   |

## Preventive Measures

- [ ] Add monitoring for early detection
- [ ] Implement additional tests
- [ ] Update runbooks/documentation
- [ ] Add alerting rules
- [ ] Schedule infrastructure improvements
```

---

## Common Incident Scenarios

### Scenario 1: Complete Service Outage

**Symptoms:**

- All health endpoints returning errors
- Users cannot access any functionality

**Quick Response:**

```bash
# Check Cloudflare status
open https://www.cloudflarestatus.com

# Verify worker status
wrangler deployments list

# Check for recent deployments
git log --oneline -5

# Rollback if recent deployment
wrangler rollback

# Verify recovery
npm run smoke:deploy:prod
```

**Common Causes:**

- Bad deployment
- Cloudflare outage
- Misconfigured environment variables
- Certificate expiration

---

### Scenario 2: Database Connection Failures

**Symptoms:**

- D1 connection errors
- Data retrieval failures
- 500 errors on endpoints requiring database

**Quick Response:**

```bash
# Test D1 connectivity
wrangler d1 execute ATLAS_CORE_DB --command="SELECT 1"

# Check bindings in wrangler.toml
cat wrangler.toml | grep -A 5 d1_databases

# Verify database exists
wrangler d1 list

# Check for database issues in Cloudflare dashboard
```

**Common Causes:**

- Incorrect binding configuration
- Database migration failures
- D1 service issues
- Quota exceeded

---

### Scenario 3: Performance Degradation

**Symptoms:**

- High latency on endpoints
- Timeout errors
- Slow response times

**Quick Response:**

```bash
# Check current performance
curl -w "@curl-format.txt" -o /dev/null -s https://orchestrator.atlasit.workers.dev/health

# Check worker analytics
# (View in Cloudflare dashboard)

# Check for errors in logs
wrangler tail orchestrator | grep -i error

# Identify slow queries (if database related)
```

**Common Causes:**

- External API delays (AI providers)
- Inefficient queries
- Resource constraints
- Rate limiting from dependencies

---

### Scenario 4: Security Incident

**Symptoms:**

- Unauthorized access detected
- Suspicious activity in logs
- Security alert triggered
- Credential compromise suspected

**Immediate Actions:**

```bash
# 1. ROTATE ALL CREDENTIALS IMMEDIATELY
npm run rotate:secrets:emergency

# 2. Review audit logs
wrangler tail --format json | jq '.logs[] | select(.level=="error")'

# 3. Check recent API access
# (View in Cloudflare analytics)

# 4. Block suspicious IPs (if identified)
# (Configure in Cloudflare WAF)

# 5. Document everything
```

**Follow-up:**

- Complete security incident report
- Notify security team
- Review access logs thoroughly
- Implement additional safeguards
- Consider external security audit

---

## On-Call Procedures

### On-Call Rotation

| Week    | Primary | Secondary | Backup |
| ------- | ------- | --------- | ------ |
| Current | TBD     | TBD       | TBD    |

### On-Call Responsibilities

**Primary:**

- Respond to all pages within 15 minutes
- Lead incident response
- Coordinate with team members
- Update incident channels

**Secondary:**

- Backup for primary if unavailable
- Assist with major incidents (P0/P1)
- Handle escalations

**Backup:**

- Available for critical situations
- Escalation point for complex issues

### Handoff Checklist

At end of on-call shift:

- [ ] Brief next on-call on any ongoing incidents
- [ ] Transfer any pending investigations
- [ ] Update incident tracker
- [ ] Note any system issues to watch

---

## Tools & Access

### Required Access

- [ ] Cloudflare Dashboard (Workers, D1, R2, KV)
- [ ] GitHub repository (read/write)
- [ ] Slack channels (#incidents, #operations, #alerts)
- [ ] Wrangler CLI configured
- [ ] PagerDuty (for P0/P1 alerts)
- [ ] 1Password (for secrets)

### Useful Commands

```bash
# Check service health
npm run smoke:deploy:prod

# View logs
wrangler tail [worker-name]

# Deploy
cd [worker-dir] && wrangler deploy

# Rollback
wrangler rollback

# Check deployments
wrangler deployments list

# Database query
wrangler d1 execute ATLAS_CORE_DB --command="[SQL]"

# View KV keys
wrangler kv:key list --binding=[BINDING_NAME]
```

### Dashboard Links

- Cloudflare Dashboard: https://dash.cloudflare.com
- Worker Analytics: https://dash.cloudflare.com/[account]/workers
- GitHub Actions: https://github.com/JW-Flo/Project-AtlasIT/actions
- Health Status: [TBD - status page URL]

---

## Metrics & SLOs

Refer to `docs/SLO.md` for detailed SLO definitions.

### Incident Metrics to Track

| Metric                          | Target        | Current |
| ------------------------------- | ------------- | ------- |
| Mean Time to Detect (MTTD)      | <5 minutes    | TBD     |
| Mean Time to Acknowledge (MTTA) | <15 minutes   | TBD     |
| Mean Time to Resolve (MTTR)     | <4 hours (P0) | TBD     |
| Incidents per Month             | <5 (P0/P1)    | TBD     |
| False Positive Rate             | <10%          | TBD     |

---

## Training & Drills

### Quarterly Incident Drill

Schedule quarterly incident response drills:

**Drill Scenarios:**

1. Complete service outage simulation
2. Database failure scenario
3. Security breach simulation
4. Performance degradation scenario

**Objectives:**

- Practice incident procedures
- Identify gaps in runbooks
- Train team members
- Validate communication channels
- Test rollback procedures

---

## Related Documentation

- Service Level Objectives: `docs/SLO.md`
- Secrets Rotation: `docs/SECRETS_ROTATION.md`
- Deployment Guide: `docs/deployment-guide.md`
- Observability: `docs/OBSERVABILITY.md`
- Data Retention: `docs/DATA_RETENTION_MATRIX.md`

---

## Emergency Contacts

| Role               | Primary                   | Secondary | Method            |
| ------------------ | ------------------------- | --------- | ----------------- |
| Operations Lead    | TBD                       | TBD       | PagerDuty + Slack |
| Security Lead      | TBD                       | TBD       | PagerDuty + Email |
| Engineering Lead   | TBD                       | TBD       | Slack + Phone     |
| Cloudflare Support | Enterprise Support Portal | -         | Support Ticket    |

**Support Resources:**

- Cloudflare Enterprise Support: https://dash.cloudflare.com/support
- Emergency Support: support@cloudflare.com
- Status Page: https://www.cloudflarestatus.com

---

## Appendix A: Incident Log

| ID                 | Date       | Severity | Summary  | Duration | Root Cause        |
| ------------------ | ---------- | -------- | -------- | -------- | ----------------- |
| INC-2025-10-14-001 | 2025-10-14 | -        | Baseline | -        | Playbook creation |

---

## Appendix B: curl-format.txt

Create file for timing measurements:

```
     time_namelookup:  %{time_namelookup}s\n
        time_connect:  %{time_connect}s\n
     time_appconnect:  %{time_appconnect}s\n
    time_pretransfer:  %{time_pretransfer}s\n
       time_redirect:  %{time_redirect}s\n
  time_starttransfer:  %{time_starttransfer}s\n
                     ----------\n
          time_total:  %{time_total}s\n
```

---

**Document Version:** 1.0  
**Next Review:** 2025-11-14  
**Owner:** Operations & Security Team
