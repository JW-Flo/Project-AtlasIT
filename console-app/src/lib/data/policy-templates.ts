/**
 * Policy template catalog — seed content for new tenants.
 *
 * Each template is short, editable starter text. Tenants customize these
 * after installation. Designed for the onboarding wizard's "seed starter
 * policies" step — pre-selected based on which frameworks the tenant picked.
 */

export interface PolicyTemplate {
  id: string;
  name: string;
  category:
    | "access-control"
    | "incident-response"
    | "data-protection"
    | "vendor"
    | "acceptable-use"
    | "byod"
    | "retention"
    | "business-continuity"
    | "change-management"
    | "other";
  applicableFrameworks: Array<"SOC2" | "ISO27001" | "NIST_CSF" | "HIPAA" | "GDPR">;
  tagline: string;
  content: string;
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "access-control",
    name: "Access Control Policy",
    category: "access-control",
    applicableFrameworks: ["SOC2", "ISO27001", "NIST_CSF", "HIPAA"],
    tagline: "Who gets access to what, how it's granted, reviewed, and revoked",
    content: `# Access Control Policy

## Purpose
Define how access to company systems, applications, and data is granted, modified, reviewed, and revoked to ensure that only authorized personnel can access information appropriate to their role.

## Scope
All employees, contractors, and third parties who require access to company systems.

## Policy
1. **Least privilege.** Access is granted based on the minimum required for the user's job function. Requests for elevated access must be justified and approved by the resource owner.
2. **Provisioning.** New hires are provisioned access through the identity provider (e.g. Okta, Google Workspace) on or after their start date. Role-based groups are used wherever possible.
3. **Quarterly review.** Resource owners and people managers review access for their teams every 90 days. Unused or inappropriate access is removed.
4. **Termination.** Access is revoked within 1 business day of termination or role change. All shared credentials in which the user participated are rotated.
5. **Privileged access.** Administrative access to production systems requires MFA, is time-bound where possible, and is logged to a tamper-evident audit trail.

## Ownership
Security Team owns this policy. Resource owners are accountable for access reviews within their systems.

## Review cadence
Annually, or on any material change to infrastructure or regulatory environment.`,
  },
  {
    id: "incident-response",
    name: "Security Incident Response Policy",
    category: "incident-response",
    applicableFrameworks: ["SOC2", "ISO27001", "NIST_CSF", "HIPAA"],
    tagline: "How we detect, respond to, and learn from security incidents",
    content: `# Security Incident Response Policy

## Purpose
Establish a consistent process for detecting, investigating, containing, and recovering from security incidents — and for learning from them.

## Scope
Any confirmed or suspected security event affecting company systems, data, or users.

## Severity tiers
- **Critical (P0):** active breach, data exfiltration, ransomware, system-wide outage. Response within 15 minutes.
- **High (P1):** credential compromise affecting production, exposure of customer data, widespread phishing. Response within 1 hour.
- **Medium (P2):** isolated malware, unauthorized access attempts blocked. Response within 1 business day.
- **Low (P3):** policy violations, near-misses. Response within 3 business days.

## Process
1. **Detect.** Monitoring tools, employee reports, and vendor notifications feed into the incident tracker.
2. **Triage.** On-call engineer confirms severity, opens an incident, notifies the security team.
3. **Contain.** Isolate affected systems; disable compromised credentials; block malicious network traffic.
4. **Eradicate.** Remove the root cause — patched vulnerability, removed malware, revoked credentials.
5. **Recover.** Return affected systems to service with verified integrity.
6. **Learn.** Post-incident review within 5 business days of resolution. Findings feed back into controls.

## Communication
- Customers are notified of incidents affecting their data within 72 hours of confirmation (sooner where regulation requires).
- Regulators are notified per applicable law (e.g. GDPR Art. 33, HIPAA Breach Notification Rule).

## Ownership
Security Team. Incident Commander is assigned per-incident.`,
  },
  {
    id: "data-protection",
    name: "Data Protection & Encryption Policy",
    category: "data-protection",
    applicableFrameworks: ["SOC2", "ISO27001", "HIPAA", "GDPR"],
    tagline: "How customer and employee data is classified, encrypted, and protected",
    content: `# Data Protection & Encryption Policy

## Purpose
Ensure the confidentiality, integrity, and availability of company and customer data throughout its lifecycle.

## Data classification
- **Restricted:** customer PII, PHI, authentication secrets, source code.
- **Confidential:** internal financial data, HR records, commercial agreements.
- **Internal:** org-wide communications, non-sensitive operational data.
- **Public:** marketing content, public API documentation.

## Encryption requirements
- **At rest:** all Restricted and Confidential data encrypted with AES-256 or equivalent. Database-layer encryption plus disk-layer encryption where both are available.
- **In transit:** TLS 1.2+ for all connections. HSTS enabled on public-facing domains.
- **Key management:** customer data encryption keys managed via a dedicated KMS (AWS KMS, HashiCorp Vault). Key rotation every 12 months or on suspected compromise.

## Access controls
- Production data access requires MFA and is logged.
- Developer access to production databases is time-bound and approval-gated.
- Copies of production data in non-production environments are prohibited unless masked or synthetic.

## Retention
See Data Retention Policy for per-data-class retention schedules.

## Ownership
Security Team owns this policy. Data owners are accountable for classification and controls within their systems.`,
  },
  {
    id: "data-retention",
    name: "Data Retention & Deletion Policy",
    category: "retention",
    applicableFrameworks: ["SOC2", "ISO27001", "HIPAA", "GDPR"],
    tagline: "How long we keep data and how we delete it when it's time",
    content: `# Data Retention & Deletion Policy

## Purpose
Define how long data is retained and how it is permanently deleted when no longer needed — minimizing risk and complying with regulatory obligations.

## Retention schedule (indicative)
| Data type | Retention period |
|---|---|
| Customer account data | While active + 90 days after cancellation |
| Audit logs | 7 years |
| Application logs | 90 days |
| Backups | 35 days rolling |
| HR records | Tenure + 7 years |
| Financial records | 7 years |
| Marketing contact data | Until opt-out or 24 months of inactivity |

## Deletion process
1. Expired data is purged automatically on a daily schedule.
2. Customer deletion requests (GDPR Article 17, CCPA) are honored within 30 days.
3. Deleted data is removed from primary storage, backups on next cycle, and cold storage on archive rotation.
4. Deletion is logged and attested by the responsible system owner.

## Legal hold
Data under legal hold is exempt from routine deletion. Legal initiates and releases holds.

## Ownership
Legal Team. Security Team implements technical deletion controls.`,
  },
  {
    id: "vendor-management",
    name: "Vendor & Third-Party Risk Management Policy",
    category: "vendor",
    applicableFrameworks: ["SOC2", "ISO27001"],
    tagline: "How we assess, onboard, and monitor vendors that handle our data",
    content: `# Vendor & Third-Party Risk Management Policy

## Purpose
Manage security, privacy, and operational risk from vendors and third parties that access company systems or data.

## Vendor tiers
- **Tier 1 (Critical):** vendors with access to Restricted or Confidential data or to production infrastructure. Require SOC 2 Type II, annual reassessment, and signed DPA.
- **Tier 2 (Important):** vendors with access to Internal data or supporting core business processes. Require security questionnaire, biennial reassessment.
- **Tier 3 (Standard):** vendors with no data access. Standard contract terms; no additional assessment.

## Onboarding process
1. Requestor completes a vendor intake form describing data access, business purpose, and alternative vendors considered.
2. Security reviews: SOC 2 report, security questionnaire, privacy impact assessment (where required).
3. Legal reviews: DPA, contract terms, indemnification.
4. Approved vendors are added to the vendor registry.

## Ongoing monitoring
- Annual reassessment for Tier 1, biennial for Tier 2.
- Subscribe to vendor security advisories; act on critical findings.
- Deprovision access within 5 business days of contract end or changed business need.

## Ownership
Security Team runs the review. Business Owner is accountable for ongoing vendor relationship.`,
  },
  {
    id: "acceptable-use",
    name: "Acceptable Use Policy",
    category: "acceptable-use",
    applicableFrameworks: ["SOC2", "ISO27001"],
    tagline: "What employees can and cannot do with company systems",
    content: `# Acceptable Use Policy

## Purpose
Set expectations for how employees use company systems, networks, and data.

## Acceptable use
- Company systems are for legitimate business purposes. Incidental personal use is permitted where it does not interfere with work, violate this policy, or expose the company to risk.
- Use strong, unique passwords. Store them in the company-provided password manager.
- Enable MFA on every account that supports it.
- Lock your screen when you step away; do not leave devices unattended in public places.
- Report lost or stolen devices to IT immediately.

## Prohibited activities
- Sharing or reusing passwords.
- Circumventing security controls (disabling MFA, installing unauthorized software, using personal VPNs to bypass network controls).
- Installing unlicensed or unapproved software.
- Downloading customer data to personal devices or personal cloud storage.
- Accessing systems or data outside your authorized scope.
- Using company resources for illegal activity, harassment, or activity that damages the company's reputation.

## Consequences
Violations may result in disciplinary action up to and including termination, and may be reported to law enforcement where illegal.

## Ownership
People Operations owns this policy. Security Team provides guidance and monitoring.`,
  },
  {
    id: "change-management",
    name: "Change Management Policy",
    category: "change-management",
    applicableFrameworks: ["SOC2", "ISO27001", "NIST_CSF"],
    tagline: "How we review and deploy changes to production systems",
    content: `# Change Management Policy

## Purpose
Ensure changes to production systems are reviewed, tested, approved, and auditable.

## Scope
Any change to production infrastructure, application code, database schema, or security configuration.

## Change classes
- **Standard change:** pre-approved, low-risk change types following a documented runbook (e.g. dependency patch, adding a log statement). Can be deployed without additional review.
- **Normal change:** code or configuration change. Requires peer review, passing CI, and approval by a second engineer before deploy.
- **Emergency change:** break-glass fix for active incident. Requires paired review post-deploy and a retrospective within 2 business days.

## Required controls for normal changes
- Pull request with description of intent, testing, rollback plan.
- At least one approving review from a qualified engineer.
- All required status checks (unit tests, lint, type-check) pass.
- Signed commits where feasible.
- Deploy through the standard pipeline — no manual production edits.

## Records
All merged PRs, approvals, and deploys are recorded in GitHub and the deploy system. Audit logs retained 7 years.

## Ownership
Engineering Team owns day-to-day application. Security Team owns infrastructure and security-relevant changes.`,
  },
  {
    id: "business-continuity",
    name: "Business Continuity & Disaster Recovery Policy",
    category: "business-continuity",
    applicableFrameworks: ["SOC2", "ISO27001"],
    tagline: "How we keep the service running through disruptions",
    content: `# Business Continuity & Disaster Recovery Policy

## Purpose
Maintain service availability and recover from disruptions within defined objectives.

## Objectives
- **RPO (Recovery Point Objective):** ≤ 1 hour of data loss for customer-facing production data.
- **RTO (Recovery Time Objective):** ≤ 4 hours to restore critical services.

## Controls
- Daily automated backups; retained per the Data Retention Policy.
- Backups encrypted at rest; access restricted to on-call engineers.
- Multi-AZ deployment for production databases.
- Documented runbooks for common failure scenarios.
- Quarterly restore test — randomly selected backup is restored to a non-production environment and verified.
- Annual disaster recovery drill exercising a full regional failover scenario.

## Roles
- **Incident Commander** coordinates response per the Incident Response Policy.
- **BC/DR Owner** (Security Team) maintains runbooks and schedules tests.

## Ownership
Security Team. Engineering owns the technical implementation.`,
  },
  {
    id: "byod",
    name: "Bring-Your-Own-Device (BYOD) Policy",
    category: "byod",
    applicableFrameworks: ["SOC2", "ISO27001", "HIPAA"],
    tagline: "Security requirements for personal devices accessing company systems",
    content: `# Bring-Your-Own-Device (BYOD) Policy

## Purpose
Allow employees to access company systems from personal devices while protecting company and customer data.

## Eligibility
BYOD is permitted for employees in roles where it is compatible with business need and regulatory obligations. Some roles (e.g. those handling PHI or regulated financial data) may be excluded.

## Required device controls
- Device OS must be supported and up to date (no unpatched EOL versions).
- Full-disk encryption enabled.
- Screen lock with PIN or biometric, auto-lock within 5 minutes.
- Installed and current anti-malware (where applicable to the platform).
- Enrolled in the company's MDM if accessing Restricted data.

## Prohibited uses
- Storing unencrypted customer data locally.
- Jailbroken or rooted devices.
- Sharing the device with others who may have access to company data.

## Termination
On separation, company data is remotely wiped (via MDM selective wipe where possible). Non-MDM devices must be attested as cleared.

## Ownership
IT + Security. Device owners are accountable for maintaining required controls.`,
  },
  {
    id: "gdpr-data-subject-rights",
    name: "Data Subject Rights Procedure (GDPR)",
    category: "data-protection",
    applicableFrameworks: ["GDPR"],
    tagline: "How we handle GDPR data subject access, rectification, and deletion requests",
    content: `# Data Subject Rights Procedure (GDPR)

## Purpose
Describe how the company receives, verifies, and responds to requests from data subjects exercising their rights under the GDPR.

## Covered rights
- **Access (Art. 15):** a copy of personal data the company holds.
- **Rectification (Art. 16):** correction of inaccurate data.
- **Erasure (Art. 17):** deletion of personal data, subject to retention obligations.
- **Restriction (Art. 18):** limit processing in specific circumstances.
- **Portability (Art. 20):** machine-readable copy in common format.
- **Objection (Art. 21):** stop processing based on legitimate interest.

## Process
1. Requests are received at privacy@company.com or through the in-product privacy center.
2. Identity is verified (account login or equivalent identity proof) before any personal data is disclosed.
3. Response is provided within 30 days. Extensions up to 60 additional days for complex requests, with explanation to the data subject.
4. Requests, verifications, and responses are logged for audit.

## Fees
Standard requests are free. Manifestly unfounded or excessive requests may carry a reasonable fee or be refused, with reason recorded.

## Ownership
Privacy Team (DPO where designated). Security Team handles technical deletion.`,
  },
  {
    id: "hipaa-breach-notification",
    name: "HIPAA Breach Notification Procedure",
    category: "incident-response",
    applicableFrameworks: ["HIPAA"],
    tagline: "How we identify, investigate, and notify for HIPAA breaches",
    content: `# HIPAA Breach Notification Procedure

## Purpose
Define the process for identifying, investigating, and notifying regarding breaches of unsecured Protected Health Information (PHI) under HIPAA.

## Breach assessment
When an event involving PHI occurs, the Security Team performs a four-factor risk assessment (45 CFR 164.402):
1. Nature and extent of PHI involved.
2. Unauthorized person(s) who used/received the PHI.
3. Whether PHI was actually acquired or viewed.
4. Extent to which risk has been mitigated.

Low probability of compromise may exclude the event from breach notification requirements, with documented rationale.

## Notification requirements
If the event is a reportable breach:
- **Affected individuals:** notify without unreasonable delay and within 60 days.
- **HHS Secretary:** notify within 60 days if ≥500 individuals affected; annually for smaller breaches (by March 1 of the following year).
- **Media:** notify prominent media serving the affected state/jurisdiction if ≥500 individuals affected within that state.
- **Covered Entity (if company is a Business Associate):** notify the Covered Entity per the Business Associate Agreement (typically 30-60 days).

## Content of notification
- Brief description of what happened.
- Types of PHI involved.
- Steps affected individuals should take.
- Steps the company has taken to investigate and mitigate.
- Contact information.

## Records
All suspected breaches — reportable or not — are logged with supporting documentation for 6 years.

## Ownership
Security Team + Privacy Team (HIPAA Privacy Officer). Legal reviews notifications before release.`,
  },
];

/**
 * Default template selection for a given framework set.
 * Used by the onboarding wizard to pre-check relevant templates.
 */
export function defaultTemplatesFor(frameworks: string[]): string[] {
  const selected = new Set<string>();
  for (const t of POLICY_TEMPLATES) {
    if (t.applicableFrameworks.some((f) => frameworks.includes(f))) {
      selected.add(t.id);
    }
  }
  return Array.from(selected);
}
