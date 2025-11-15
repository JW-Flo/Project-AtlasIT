# Security Automation Plan

## Objectives
1. Automate security control validation
2. Emit verifiable evidence for all security checks
3. Enforce zero-trust policies via OPA
4. Maintain NIST 800-53 compliance mappings
5. Prevent secrets in source code

## Security Controls

### NIST-AC-2: Account Management
- Evidence: User provisioning events
- Check: MFA enforcement validation
- Automation: Pre-commit hooks, CI validation

### NIST-AU-2: Audit Events
- Evidence: All agent actions logged
- Check: Evidence artifact completeness
- Automation: Aggregate evidence in CI

### NIST-AU-6: Audit Review
- Evidence: Periodic evidence review logs
- Check: No expired or invalid artifacts
- Automation: Scheduled drift scans

### NIST-CM-3: Configuration Change Control
- Evidence: Routing decisions, drift scans
- Check: Framework manifest validation
- Automation: Drift scan on every PR

### NIST-SA-11: Developer Security Testing
- Evidence: CodeQL results, OPA test outcomes
- Check: Zero high/critical vulnerabilities
- Automation: CodeQL workflow, OPA in CI

### NIST-SI-7: Software Integrity
- Evidence: Rules hash, schema validation
- Check: Rules version matches deployed worker
- Automation: Hash verification in routing worker

## Prohibited Patterns
Automatically escalate to human review if detected:
- `password`, `apikey`, `private_key`, `access_token`
- Hardcoded credentials
- Unencrypted secrets
- Suspicious network calls

## OPA Policy Enforcement
All changes validated against:
- `policies/grammar.rego`: Commit/PR format
- `policies/evidence.rego`: Evidence schema compliance

**Deny Rules:**
- Invalid commit message format
- Missing required evidence fields
- Malformed control IDs
- Potential hardcoded secrets

## CodeQL Integration
- Runs on: `push` to main, `pull_request`, weekly schedule
- Languages: JavaScript, TypeScript
- Queries: `security-extended`
- Action: Block PR on critical findings

## Evidence Retention
- **Active:** `/artifacts` (current run evidence)
- **Deprecated:** `.evidence/` (migration notice only)
- **Index:** `artifacts/INDEX.json` (aggregated metadata)

## Secrets Management
- Use GitHub Actions secrets with TTL rotation
- Vault integration for production secrets
- Never log, echo, or commit secrets
- Pre-commit scanning via `scan-secrets.js`

## Incident Response
**On Security Trigger:**
1. Route to human (critical severity)
2. Emit evidence artifact
3. Block auto-merge
4. Notify security team
5. Require manual approval

## Compliance Reporting
- Evidence aggregation generates compliance snapshot
- NIST control coverage calculated
- Missing evidence flagged in CI
- Periodic audits via `nist-verify.ts`
