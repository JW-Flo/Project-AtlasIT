# AtlasIT Security Policy

## Scope

This policy applies to all AtlasIT platform modules, including:

- Identity Lifecycle (JML)
- Compliance Digital Twin (CDT)
- Security Orchestration
- Vendor Assurance / Third-Party Risk (TPRM)
- Trust Center
- Exposure Management / Threat Scanning

## Supported Versions

AtlasIT follows rolling support for current production and the previous minor release.

| Version        | Supported |
| -------------- | --------- |
| current        | ✅        |
| previous minor | ✅        |
| older          | ❌        |

## Security Design Principles

- Security-first defaults (least privilege, deny-by-default)
- Automation-first control execution with human approval gates for high-risk actions
- Zero static secrets in code; use environment variables + managed secret stores
- Tenant isolation by design (tenant-scoped authZ and data access enforcement)
- Evidence integrity and auditability across all risk and compliance workflows

## Module-Specific Security Controls

### Vendor Assurance / TPRM

- Vendor evidence ingestion is treated as untrusted input and schema-validated
- Questionnaire and document uploads are malware-scanned and type-validated
- Document expiry and reassessment workflows are auditable and immutable

### Trust Center

- Controlled evidence sharing with approval workflows
- Watermarked downloads and request-level audit logs
- Time-bounded access tokens and tenant-configurable access gates
- Access analytics retained for compliance review

### Exposure Management

- Scanner executes against authorized assets only
- Findings normalized and deduplicated before score impact
- External findings linked to remediation workflows with verification steps
- Findings-to-control mappings are versioned and traceable

## Vulnerability Reporting

Please report vulnerabilities privately via your designated security contact channel. Include:

- Affected component(s)
- Reproduction steps
- Impact assessment
- Suggested mitigation (if known)

AtlasIT will acknowledge valid reports, triage severity, and provide remediation timelines based on impact.
