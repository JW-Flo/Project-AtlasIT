# Jira Adapter Evidence Collection Implementation

## Overview

Implements compliance evidence collection endpoint for Jira adapter to enable Trust Center credibility scoring.

## Implementation Details

### New Endpoint

**POST /api/evidence**

- Headers: `X-Tenant-ID` (required)
- Returns: `{ items: EvidenceItem[] }`
- Authentication: Internal adapter auth (Bearer token)

### Evidence Types Collected

1. **Project Permissions** (SOC2-CC6.1)
   - Maps to: Access control requirements
   - Data: Project roles and permissions across all accessible projects
   - Pass criteria: At least one project with defined roles

2. **Audit Log - User Events** (SOC2-CC6.3)
   - Maps to: User lifecycle management
   - Data: User addition/removal events from last 90 days
   - Pass criteria: Audit log accessible (requires admin permissions)

3. **Audit Log - Security Events** (SOC2-CC7.3)
   - Maps to: Incident response
   - Data: Permission changes, role modifications from last 90 days
   - Pass criteria: Audit log accessible

4. **Vulnerability Tracking** (ISO-27001-A.12.6.1)
   - Maps to: Technical vulnerability management
   - Data: Issues labeled "vulnerability" created in last 90 days
   - Pass criteria: At least one vulnerability issue exists
   - Metrics: Total issues, resolved issues, recent issue summaries

5. **Security Incident Tracking** (SOC2-CC7.3, ISO-27001-A.12.1.1)
   - Maps to: Incident response and documented procedures
   - Data: Issues labeled "security" or "compliance" from last 90 days
   - Pass criteria: At least one security/compliance issue exists
   - Metrics: Total issues, resolution rate, recent issue summaries

### API Changes

#### client.ts

Added three new API method groups:

1. **Project Permissions**
   - `getProjectRoles()` - Fetch project role definitions
   - `getProjectRole()` - Fetch specific role details
   - Types: `JiraProjectRole`

2. **Audit Log**
   - `getAuditRecords()` - Fetch audit records with filtering
   - Types: `JiraAuditRecord`, `JiraAuditResponse`
   - Supports: date range filtering, category filtering, pagination

3. **Issue Search** (enhanced)
   - Uses existing `searchIssues()` with JQL filter
   - JQL: `labels in (security, compliance, vulnerability) AND created >= -90d`

#### types.ts

- Added `labels?: string[]` to `JiraIssue.fields` interface

#### index.ts

- Added `POST /api/evidence` route handler
- Imports: `listProjects`, `getProjectRoles`, `getAuditRecords`, `searchIssues`
- Graceful error handling: returns `{ items: [] }` on missing token/config
- Per-evidence-type error handling: returns "unknown" status on API failures

### Testing

Created `evidence.test.ts` with:

- Test cases for missing token/config (returns empty array)
- Test case for successful evidence collection (5 items)
- Test case for API failures (graceful degradation)
- Mock Jira API responses for projects, roles, audit logs, issues

### Compliance Mapping

| Evidence Type              | Framework | Control ID | Description                          |
| -------------------------- | --------- | ---------- | ------------------------------------ |
| project_permissions        | SOC2      | CC6.1      | Logical and Physical Access Controls |
| audit_log_user_events      | SOC2      | CC6.3      | User Access Removal                  |
| audit_log_security_events  | SOC2      | CC7.3      | Incident Detection & Response        |
| vulnerability_tracking     | ISO-27001 | A.12.6.1   | Technical Vulnerabilities Management |
| security_incident_tracking | SOC2      | CC7.3      | Incident Detection & Response        |
| security_incident_tracking | ISO-27001 | A.12.1.1   | Documented Operating Procedures      |

### Expected Evidence Volume

Per tenant with active Jira usage:

- 1 project permissions item (pass if projects exist)
- 2 audit log items (pass if admin access, unknown otherwise)
- 2 issue tracking items (pass if issues exist, unknown otherwise)

**Average: 5 evidence items per collection cycle**

For a tenant with 10 projects and 50 security/compliance issues over 90 days, this provides concrete evidence of:

- Access control implementation
- Security event monitoring
- Vulnerability management process
- Incident response workflow

### Integration with compliance-api

The compliance-api Lambda (`POST /api/v1/evidence/collect`) will:

1. Call `GET {JIRA_ADAPTER_URL}/api/evidence` with `X-Tenant-ID` header
2. Parse returned `items` array
3. For each item, insert into `compliance_evidence` table per `controlRef`:
   - `source`: `adapter:jira`
   - `source_id`: `jira:{type}:{framework}:{controlId}`
   - `evidence_type`: `adapter_pull`
   - `metadata.impact`: `positive` (pass), `detrimental` (fail), `neutral` (unknown)
   - `metadata.confidence`: `0.8` (pass/fail), `0.3` (unknown)

### Deployment Notes

- No wrangler.toml changes required
- No migration files required (uses existing D1 schema)
- Requires `INTERNAL_API_KEY` env var in compliance-api Lambda
- Jira adapter URL must be added to `ADAPTER_URLS` JSON env var in compliance-api

### Permissions Required

Jira OAuth token must have these scopes:

- `read:jira-work` - Read projects and issues
- `read:audit-log:jira` - Read audit records (admin only)

If audit log access is denied (403), evidence items return "unknown" status instead of failing the entire collection.

### Next Steps

1. Add Jira adapter URL to compliance-api `ADAPTER_URLS` environment variable
2. Schedule daily evidence collection via EventBridge cron (existing pattern)
3. Verify compliance score updates after first collection cycle
4. Monitor CloudWatch logs for collection errors
