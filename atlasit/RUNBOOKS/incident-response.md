# Incident Response Runbook

**Purpose**: Guide for responding to security incidents and service outages.

**Owner**: Security + Platform Teams  
**Last Updated**: 2025-11-05

## Prerequisites

- Access to Cloudflare dashboard
- Access to GitHub (for emergency fixes)
- Access to monitoring/alerting tools
- Incident Slack channel membership

## Severity Levels

### P0 (Critical)

- Complete service outage
- Data breach or exfiltration
- Authentication system compromise

**Response Time**: Immediate  
**Notification**: All stakeholders, customers (status page)

### P1 (High)

- Partial service degradation
- Potential security vulnerability
- Data integrity issues

**Response Time**: <15 minutes  
**Notification**: Engineering team, on-call

### P2 (Medium)

- Non-critical service issues
- Performance degradation
- Minor security concerns

**Response Time**: <1 hour  
**Notification**: Engineering team

### P3 (Low)

- Cosmetic issues
- Feature requests
- Documentation gaps

**Response Time**: Next business day  
**Notification**: Engineering team (async)

## Incident Response Phases

### 1. Detection & Alert

**Actions**:

1. Monitor alerts from CI/CD, APM, or user reports
2. Confirm incident (not false positive)
3. Create incident in tracking system
4. Assign severity level
5. Notify on-call engineer

### 2. Containment

**For Security Incidents**:

1. Identify affected systems/tenants
2. Revoke compromised credentials immediately
3. Block malicious IPs/domains at Cloudflare level
4. Isolate affected Durable Objects (if tenant-specific)
5. Preserve evidence (logs, metrics, evidence artifacts)

**For Service Outages**:

1. Identify failing component(s)
2. Check recent deployments (possible cause)
3. Review recent config changes
4. Enable maintenance mode if needed
5. Communicate status to users

### 3. Eradication

1. Identify root cause (use evidence artifacts, logs)
2. Remove threat or fix bug
3. Patch vulnerabilities
4. Deploy hotfix if critical
5. Update firewall rules, policies as needed

### 4. Recovery

1. Restore service from backup if needed
2. Verify data integrity (compare evidence hashes)
3. Test functionality with smoke tests
4. Gradually restore traffic (canary deployment)
5. Monitor for recurrence

### 5. Post-Mortem

**Within 48 hours of resolution**:

1. Document timeline of events
2. Identify root cause(s)
3. List what went well / what didn't
4. Create action items (with owners + due dates)
5. Update runbooks based on lessons learned
6. Share findings with team

## Communication Templates

### Status Page Update

```
[SEVERITY] [SERVICE] - Brief Description

We are currently investigating [issue description].

Status: [Investigating | Identified | Monitoring | Resolved]
Impact: [description of user impact]
Next Update: [timestamp]

Updates will be posted every [frequency].
```

### Internal Slack

```
:rotating_light: [SEVERITY] INCIDENT: [Title]

Severity: [P0/P1/P2/P3]
Incident Lead: @[name]
Status: [Investigating/Contained/Resolved]
Impact: [description]

Current Actions:
- [action 1]
- [action 2]

Join: #incident-[YYYYMMDD-HHMM]
```

## Escalation

### When to Escalate

- Unable to resolve within 1 hour (P0/P1)
- Requires permissions/access you don't have
- Customer data may be at risk
- Legal/compliance implications
- Multi-system coordination needed

### Escalation Path

1. **On-call engineer** → Team lead
2. **Team lead** → Engineering manager
3. **Engineering manager** → CTO
4. **CTO** → CEO (for customer communication, legal, PR)

## Tools & Access

- **Monitoring**: Cloudflare Analytics, Grafana (planned)
- **Logs**: Cloudflare Logs, R2 evidence artifacts
- **Secrets**: Cloudflare Dashboard → Workers → Secrets
- **Deployment**: GitHub Actions, Wrangler CLI
- **Communication**: Slack #incidents, status page

## Post-Incident Checklist

- [ ] Incident resolved and verified
- [ ] Root cause documented
- [ ] Evidence artifacts saved
- [ ] Customers notified (if applicable)
- [ ] Post-mortem scheduled
- [ ] Action items created in GitHub Issues
- [ ] Runbooks updated with lessons learned
- [ ] Team debriefed

## References

- [Security Model](../SECURITY.md)
- [Deployment Runbook](deployment.md)
- [Rollback Runbook](rollback.md)
