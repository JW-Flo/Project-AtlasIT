/**
 * Centralized help content registry for contextual tooltips
 *
 * Each entry provides brief explanations for complex compliance
 * and security concepts used throughout the platform.
 */

export const helpContent = {
  evidenceImpact: `Evidence **impact** indicates whether this activity strengthens (**positive**) or weakens (**detrimental**) your compliance posture. Positive evidence shows controls in action, while detrimental evidence may require investigation.`,

  automationTriggers: `Automation rules execute when specific **events** occur:
- \`user_joined_group\` — User added to directory group
- \`user_left_group\` — User removed from group
- \`user_created\` — New user provisioned
- \`user_suspended\` — User account disabled
Configure rules to auto-provision access, send notifications, or trigger workflows.`,

  nhiRotation: `**Dynamic credential rotation** automatically replaces API keys and service account credentials on a schedule to limit exposure. Rotated credentials are:
- Stored securely in AWS Secrets Manager
- Distributed to applications via environment variables
- Monitored for usage and expiration`,

  controlState: `Control **state** reflects the current compliance status:
- **Pass** — Control implemented and verified with evidence
- **Fail** — Control not implemented or evidence shows non-compliance
- **Unknown** — Insufficient evidence to determine status
- **In Progress** — Implementation started but not complete`,

  complianceScore: `The compliance **score** is calculated as a weighted average across all controls:
- Verified controls: 100% weight
- Implemented controls: 75% weight
- In-progress controls: 25% weight
- Not started or failing: 0% weight
Scores update automatically as evidence is collected.`,

  evidenceSource: `Evidence **source** indicates where the compliance activity was detected:
- **Directory sync** — User/group changes from identity provider
- **Adapter** — Integrated application (e.g., Okta, AWS, GitHub)
- **Manual** — User-uploaded evidence or attestation
- **Automated rule** — Action triggered by automation engine`,

  policyAcknowledgment: `**Policy acknowledgment** tracks which team members have reviewed and accepted each policy version. Required for:
- SOC 2 Type II compliance
- Employee awareness training
- Audit trail documentation
Acknowledgments include timestamp and user identity.`,

  workflowStatus: `Workflow **status** tracks JML (Joiner/Mover/Leaver) lifecycle automation:
- **Pending** — Workflow queued, not yet started
- **Running** — Steps executing in progress
- **Completed** — All steps finished successfully
- **Failed** — One or more steps encountered errors
View detailed step logs by expanding the workflow row.`,

  accessReviewCampaign: `**Access review campaigns** periodically recertify who has access to what. Reviewers:
1. Receive assignments for users/resources in scope
2. Approve (keep) or revoke (remove) each assignment
3. Provide optional justification notes
Completed reviews generate compliance evidence for SOC 2 CC6.1 and ISO 27001 A.9.2.5.`,

  mfaEnforcement: `**Multi-factor authentication (MFA)** requires users to provide two forms of verification:
1. Something you know (password)
2. Something you have (TOTP app, hardware token)
AtlasIT tracks MFA enrollment across connected identity providers and alerts when enforcement gaps are detected.`,

  frameworkMapping: `**Framework mapping** links AtlasIT controls to specific compliance requirements:
- SOC 2 (Trust Services Criteria)
- ISO 27001:2022 (Annex A controls)
- NIST CSF 2.0 (Functions & Categories)
- HIPAA Security Rule (Administrative/Technical safeguards)
- GDPR (Articles & Recitals)
Each control may map to multiple frameworks.`,

  integrationAdapter: `**Adapters** connect AtlasIT to your applications via OAuth 2.0, API keys, or service accounts. Each adapter:
- Syncs directory data (users, groups, roles)
- Collects compliance evidence automatically
- Supports webhooks for real-time event detection
- Runs security posture checks every 5 minutes`,

  automationRuleTrigger: `Automation **triggers** define when a rule executes:
- **Directory events** — User/group changes
- **Scheduled** — Cron-based execution
- **Webhook** — External system notification
- **Manual** — User-initiated from console
Each trigger includes filter conditions to limit scope.`,

  riskScore: `**Risk score** (0-100) indicates the potential security impact of a non-human identity:
- **High (70-100)** — Production access, long-lived, high privileges
- **Medium (40-69)** — Staging access, moderate privileges
- **Low (0-39)** — Read-only, short-lived, scoped access
Factors include: credential age, last usage, permissions, and exposure.`,

  attestationWindow: `The **attestation window** defines the period for which evidence is collected and reviewed:
- Start date: Beginning of evidence collection
- End date: Cutoff for included evidence
- Default: Last 90 days
- Audit packages: Can specify custom windows for point-in-time compliance snapshots`,

  incidentSeverity: `Incident **severity** determines response priority:
- **Critical** — Immediate action required (data breach, outage)
- **High** — Urgent response needed within 4 hours
- **Medium** — Important but not urgent (24-hour SLA)
- **Low** — Minor issues, informational
Severity affects alerting, escalation, and SLA tracking.`,

  compliancePack: `**Compliance packs** are pre-configured control sets for specific frameworks:
- Controls mapped to framework requirements
- Evidence collection rules
- Scoring calculation logic
- Audit report templates
Installing a pack enables automatic scoring and evidence generation for that framework.`,

  credentialType: `Non-human identity **credential types**:
- **API Key** — Long-lived token for API authentication
- **OAuth Token** — Short-lived access token (typically 1 hour)
- **Service Account** — Robot user with username/password
- **SSH Key** — Public/private key pair for server access
- **Certificate** — X.509 cert for mutual TLS authentication`,

  controlEvidenceCount: `The **evidence count** shows how many compliance activities support this control. Higher counts indicate:
- More frequent validation
- Stronger compliance signal
- Greater audit trail depth
Click the count to view filtered evidence for this control.`,
} as const;

export type HelpContentKey = keyof typeof helpContent;
