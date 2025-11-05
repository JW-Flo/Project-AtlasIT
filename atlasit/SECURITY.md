# AtlasIT Security Model

**Status**: Baseline  
**Owner**: Security Team  
**Last Updated**: 2025-11-05

## Security Principles

1. **Zero Trust Architecture**: No implicit trust; verify every request
2. **Least Privilege**: Grant minimum necessary permissions
3. **Defense in Depth**: Multiple layers of security controls
4. **Audit Everything**: Comprehensive logging with evidence generation
5. **Fail Securely**: Default deny, explicit allow model

## Authentication & Authorization

### Authentication

- **Cloudflare Access**: Primary authentication layer
- **Tenant-scoped tokens**: JWT with tenant claims
- **API keys**: Scoped per service, rotated regularly
- **OIDC**: Future integration with HashiCorp Vault

### Authorization

- **Policy-driven**: All access decisions via Policy Engine
- **Attribute-based (ABAC)**: User, resource, and context attributes
- **Explicit grants**: No default permissions
- **Audit trail**: All authorization decisions logged with evidence

## Secrets Management

### Current (PR0)

- **No static secrets in code**: Placeholders only
- **Environment variables**: For local development (`.env.example`)
- **Cloudflare Secrets**: For Workers/Durable Objects
- **Mock credentials**: For testing adapters

### Future (PR5)

- **HashiCorp Vault**: Dynamic credential generation
- **OIDC authentication**: Workload identity for Workers
- **Automatic rotation**: Secrets rotated every 24-48 hours
- **Audit log**: All secret access logged to evidence system

## Threat Model

### Threats

1. **Unauthorized access**: Attacker gains access to tenant data
2. **Privilege escalation**: User gains admin permissions
3. **Data exfiltration**: Sensitive data leaked externally
4. **Evidence tampering**: Audit trail modified or deleted
5. **Supply chain attack**: Malicious dependency introduced

### Mitigations

1. **Multi-factor authentication (MFA)**: Required for all admin access
2. **Role-based access control (RBAC)**: Granular permission model
3. **Data encryption**: At rest (R2) and in transit (TLS 1.3+)
4. **Content-addressed storage**: Immutable evidence with SHA-256 hashes
5. **Dependency scanning**: Trivy, CodeQL, and GitHub Advisories

## Data Protection

### Data Classification

- **Public**: Documentation, public APIs
- **Internal**: Logs, metrics, non-PII operational data
- **Confidential**: Tenant configs, policies, user attributes
- **Restricted**: PII, credentials, payment information

### Encryption

- **At rest**: R2 encryption with Cloudflare-managed keys
- **In transit**: TLS 1.3+ for all API communication
- **Client-side**: Optional encryption for PII fields (future)

### Data Retention

- **Evidence**: Indefinite (configurable per tenant)
- **Logs**: 90 days (standard), 1 year (compliance tier)
- **Metrics**: 30 days (high resolution), 13 months (aggregated)
- **Backups**: 30-day retention, encrypted

## Secure Development

### Code Review

- **Peer review**: All changes require approval
- **Security review**: High-risk changes reviewed by security team
- **Automated checks**: CodeQL, ESLint security rules, Trivy

### CI/CD Security

- **Branch protection**: Main branch requires PR + checks
- **Secrets scanning**: Pre-commit hooks and CI checks
- **Dependency updates**: Renovate bot with security priority
- **SBOM generation**: Software Bill of Materials for all releases

### Testing

- **Unit tests**: 80%+ code coverage target
- **Integration tests**: End-to-end workflows with mock adapters
- **Security tests**: OWASP Top 10 validation
- **Penetration testing**: Annual third-party assessment (planned)

## Incident Response

### Phases

1. **Detection**: Automated alerts + manual reporting
2. **Containment**: Isolate affected systems/tenants
3. **Eradication**: Remove threat, patch vulnerabilities
4. **Recovery**: Restore services, validate integrity
5. **Post-mortem**: Root cause analysis, lessons learned

### Communication

- **Internal**: Incident Slack channel + PagerDuty
- **Customer**: Status page + email notifications (for affected tenants)
- **Public**: Security advisories for CVEs

### Runbooks

See [RUNBOOKS/incident-response.md](RUNBOOKS/incident-response.md) for detailed procedures.

## Compliance

### Frameworks

- **SOC2 Type II**: Architecture designed for audit readiness
- **GDPR**: Data subject rights, data minimization, retention policies
- **CCPA**: California privacy law compliance (for US customers)

### Controls

- **Access control**: MFA, RBAC, least privilege
- **Audit logging**: Comprehensive evidence generation
- **Data encryption**: At rest and in transit
- **Incident response**: Documented procedures, regular drills
- **Vendor management**: Third-party risk assessment

### Evidence Generation

All security-relevant actions emit evidence:

- Authentication events
- Authorization decisions
- Configuration changes
- Data access (PII/confidential)
- Policy evaluations

Evidence stored with SHA-256 hashes in content-addressed R2 storage.

## Security Contacts

- **Security issues**: security@atlasit.example.com
- **Vulnerability disclosure**: [Security Policy](../.github/SECURITY.md)
- **Emergency hotline**: TBD (PagerDuty integration planned)

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [Cloudflare Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)
- [HashiCorp Vault Docs](https://developer.hashicorp.com/vault/docs)
