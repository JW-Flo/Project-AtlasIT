import { g as generateAI } from './ai-J0pj_lx1.js';

const POLICY_TEMPLATES = {
  access_control: {
    title: "Access Control Policy",
    systemPrompt: `Generate a comprehensive access control policy. Cover user provisioning,
deprovisioning, least privilege, role-based access, periodic reviews, and emergency access.
Reference specific compliance controls from the tenant's frameworks.`,
    sections: [
      "Purpose and Scope",
      "User Access Provisioning",
      "Role-Based Access Control",
      "Least Privilege Principle",
      "Access Reviews and Recertification",
      "Privileged Access Management",
      "Emergency and Break-Glass Access",
      "Access Termination and Offboarding",
      "Monitoring and Enforcement"
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "NIST_CSF", "HIPAA"]
  },
  incident_response: {
    title: "Incident Response Policy",
    systemPrompt: `Generate an incident response policy covering detection, classification,
escalation, containment, eradication, recovery, and lessons learned. Include SLAs for
different severity levels.`,
    sections: [
      "Purpose and Scope",
      "Incident Classification and Severity Levels",
      "Detection and Reporting",
      "Escalation Procedures",
      "Containment and Eradication",
      "Recovery and Restoration",
      "Communication Plan",
      "Post-Incident Review"
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "NIST_CSF"]
  },
  data_handling: {
    title: "Data Handling and Classification Policy",
    systemPrompt: `Generate a data handling policy covering data classification levels,
handling requirements per level, encryption standards, retention, and disposal.
Address cross-border data transfers if GDPR is a framework.`,
    sections: [
      "Purpose and Scope",
      "Data Classification Levels",
      "Handling Requirements by Classification",
      "Encryption Standards",
      "Data Retention and Disposal",
      "Cross-Border Transfers",
      "Third-Party Data Sharing"
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "GDPR", "HIPAA"]
  },
  password: {
    title: "Password and Authentication Policy",
    systemPrompt: `Generate a password and authentication policy covering password
complexity, rotation, MFA requirements, SSO, and service account credentials.`,
    sections: [
      "Purpose and Scope",
      "Password Requirements",
      "Multi-Factor Authentication",
      "Single Sign-On",
      "Service Account and API Key Management",
      "Password Storage and Transmission",
      "Account Lockout and Recovery"
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "NIST_CSF", "HIPAA"]
  },
  acceptable_use: {
    title: "Acceptable Use Policy",
    systemPrompt: `Generate an acceptable use policy covering permitted and prohibited
use of company systems, SaaS applications, AI tools, personal devices, and data access.`,
    sections: [
      "Purpose and Scope",
      "Permitted Use of Company Systems",
      "Prohibited Activities",
      "SaaS and Cloud Application Usage",
      "AI and Generative AI Tool Usage",
      "Personal Device Policy",
      "Monitoring and Enforcement",
      "Violations and Consequences"
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "GDPR"]
  }
};
function buildSystemPrompt(policyType, tenantContext) {
  const template = POLICY_TEMPLATES[policyType];
  const applicableFrameworks = template.relevantFrameworks.filter((f) => tenantContext.selectedFrameworks.includes(f));
  return `You are a compliance policy writer for "${tenantContext.tenantName}".

${template.systemPrompt}

## Context
- Compliance frameworks: ${applicableFrameworks.join(", ") || tenantContext.selectedFrameworks.join(", ")}
- Connected applications: ${tenantContext.connectedApps.join(", ") || "none yet"}
- Active automation rules: ${tenantContext.automationRuleCount}
- Current compliance scores: ${Object.entries(tenantContext.complianceScores).map(([k, v]) => `${k}: ${v}%`).join(", ") || "not yet scored"}
- Evidence status: ${tenantContext.evidenceSummary}

## Required Sections
${template.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Output Format
Return a JSON object with sections array:
{
  "sections": [
    { "title": "Section Title", "content": "Section content in markdown..." },
    ...
  ]
}

Write professional, actionable policy language. Reference the tenant's actual connected
apps and automation setup where relevant. Each section should be 2-4 paragraphs.
Do not include disclaimers about being AI-generated.`;
}
async function generateSecurityPolicy(env, tenantContext, policyType) {
  const template = POLICY_TEMPLATES[policyType];
  const applicableFrameworks = template.relevantFrameworks.filter((f) => tenantContext.selectedFrameworks.includes(f));
  const basedOn = applicableFrameworks.length > 0 ? applicableFrameworks : tenantContext.selectedFrameworks;
  const isDeterministic = env.AI_DETERMINISTIC === "1";
  const hasAI = !!(env.GROQ_API_KEY || env.OPENAI_API_KEY || env.AWS_ACCESS_KEY_ID);
  if (isDeterministic || !hasAI) {
    return buildTemplateFallback(policyType, tenantContext, basedOn);
  }
  const messages = [
    { role: "system", content: buildSystemPrompt(policyType, tenantContext) },
    {
      role: "user",
      content: `Generate the ${template.title} for ${tenantContext.tenantName} following the required sections.`
    }
  ];
  const provider = env.AWS_ACCESS_KEY_ID ? "bedrock" : "groq";
  const model = provider === "bedrock" ? env.DIGEST_MODEL || "us.anthropic.claude-haiku-4-5-20251001-v1:0" : "qwen/qwen3-32b";
  const response = await generateAI(messages, env, {
    provider,
    model,
    temperature: 0.4,
    maxTokens: 4096,
    fallbackProviders: provider === "bedrock" ? ["groq"] : []
  });
  let jsonStr = response.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  let sections;
  try {
    const parsed = JSON.parse(jsonStr);
    sections = parsed.sections ?? [];
  } catch {
    sections = [{ title: template.title, content: jsonStr }];
  }
  return {
    title: template.title,
    type: policyType,
    sections,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    basedOn
  };
}
const SECTION_CONTENT = {
  access_control: {
    "Purpose and Scope": (ctx, fw) => `This policy establishes requirements for managing user access to ${ctx.tenantName}'s information systems and data. It applies to all employees, contractors, and third-party users who access organizational resources.

This policy supports compliance with ${fw} and governs access across all ${ctx.connectedApps.length > 0 ? ctx.connectedApps.length + " integrated applications including " + ctx.connectedApps.slice(0, 5).join(", ") : "organizational applications"}.

**Policy Owner:** Information Security Team
**Review Cycle:** Annual or upon significant infrastructure changes
**Effective Date:** ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`,
    "User Access Provisioning": (ctx, _fw) => `All access requests must be submitted through the designated access request workflow and approved by the resource owner and the requester's manager before provisioning.

**Provisioning Requirements:**
- Access is granted based on the principle of least privilege
- New hire access is provisioned through the JML (Joiner-Mover-Leaver) workflow within 24 hours of start date
- Temporary access requires an expiration date and documented business justification
- Service accounts and API keys follow the Non-Human Identity (NHI) governance process

${ctx.connectedApps.length > 0 ? `Currently, ${ctx.tenantName} manages provisioning across: ${ctx.connectedApps.join(", ")}.` : `Access provisioning procedures apply to all applications as they are integrated.`}`,
    "Role-Based Access Control": (ctx, _fw) => `${ctx.tenantName} implements Role-Based Access Control (RBAC) to ensure users receive only the permissions necessary for their job function.

**RBAC Principles:**
- Roles are defined based on job function, not individual identity
- Each role has a documented set of permissions and entitlements
- Role assignments are reviewed during access recertification cycles
- Conflicting roles (separation of duties) are identified and require compensating controls
- Role changes triggered by internal transfers are processed through the Mover workflow`,
    "Least Privilege Principle": (_ctx, fw) => `All users are granted the minimum level of access required to perform their duties, consistent with ${fw} requirements.

**Implementation:**
- Default access for new accounts is restricted to basic authentication only
- Elevated privileges require documented justification and time-limited approval
- Administrative access is logged and monitored continuously
- Unused permissions are identified through periodic entitlement reviews and revoked`,
    "Access Reviews and Recertification": (ctx, fw) => `Access reviews are conducted to verify that all user entitlements remain appropriate and aligned with ${fw} control requirements.

**Review Schedule:**
- Quarterly: Privileged and administrative access across all systems
- Semi-annually: Standard user access for all integrated applications
- Ad-hoc: Upon role change, department transfer, or security incident

Reviews are tracked through the Access Reviews module. ${ctx.automationRuleCount > 0 ? `${ctx.automationRuleCount} automation rule(s) assist with flagging stale or excessive permissions.` : "Automation rules can be configured to flag anomalous access patterns."}`,
    "Privileged Access Management": (ctx, _fw) => `Privileged accounts (system administrators, database administrators, cloud infrastructure operators) at ${ctx.tenantName} are subject to enhanced controls.

**Requirements:**
- Privileged accounts must use multi-factor authentication (MFA)
- Shared administrative credentials are prohibited; named accounts are required
- Privileged sessions are logged with full audit trails
- Just-in-time (JIT) access is preferred over standing privileges
- Privileged access is reviewed quarterly by the security team`,
    "Emergency and Break-Glass Access": (ctx, _fw) => `${ctx.tenantName} maintains emergency access procedures for business-critical situations where standard approval workflows cannot be followed.

**Break-Glass Procedures:**
- Emergency access credentials are stored securely and access is audited
- Use of emergency access triggers an automatic incident report
- All actions performed under emergency access are reviewed within 24 hours
- Emergency access is revoked immediately after the incident is resolved
- Break-glass events are included in the quarterly access review`,
    "Access Termination and Offboarding": (ctx, _fw) => `When an employee or contractor separates from ${ctx.tenantName}, all access must be revoked promptly through the Leaver workflow.

**Termination Requirements:**
- Access revocation is initiated within 4 hours of separation notification
- All application accounts are disabled or removed across ${ctx.connectedApps.length > 0 ? ctx.connectedApps.length + " integrated systems" : "all connected systems"}
- Shared credentials the departing user had access to are rotated
- Hardware and physical access tokens are collected
- Completion is verified by IT and the departing user's manager`,
    "Monitoring and Enforcement": (ctx, fw) => `${ctx.tenantName} continuously monitors access activity to detect unauthorized access attempts and policy violations, supporting ${fw} monitoring requirements.

**Monitoring Controls:**
- Failed authentication attempts are logged and alerts trigger after 5 consecutive failures
- Access from unrecognized locations or devices triggers step-up authentication
- Dormant accounts (no login for 90 days) are automatically flagged for review
- Policy violations result in access suspension pending investigation

${ctx.evidenceSummary}`
  },
  incident_response: {
    "Purpose and Scope": (ctx, fw) => `This policy establishes ${ctx.tenantName}'s procedures for identifying, responding to, and recovering from information security incidents. It supports ${fw} requirements for incident management.

This policy applies to all employees, contractors, and third parties. All suspected security incidents must be reported immediately regardless of severity.`,
    "Incident Classification and Severity Levels": (ctx, _fw) => `${ctx.tenantName} classifies security incidents by severity to ensure appropriate response:

| Severity | Description | Response SLA | Examples |
|----------|-------------|-------------|----------|
| **Critical (P1)** | Active breach or data loss | 15 minutes | Ransomware, confirmed data exfiltration |
| **High (P2)** | Imminent threat or significant vulnerability | 1 hour | Compromised credentials, active exploitation |
| **Medium (P3)** | Contained threat, limited impact | 4 hours | Phishing success (no data loss), malware detected and quarantined |
| **Low (P4)** | Minor event, no immediate risk | 24 hours | Policy violation, suspicious but unconfirmed activity |`,
    "Detection and Reporting": (ctx, _fw) => `**Detection Sources:**
- Automated alerts from integrated security tools${ctx.connectedApps.length > 0 ? " across " + ctx.connectedApps.join(", ") : ""}
- Employee reports via the incident reporting portal
- Third-party notifications (vendors, partners, law enforcement)
- Compliance monitoring and audit findings

**Reporting Requirements:**
- All suspected incidents must be reported within 1 hour of discovery
- Reports should include: what was observed, when, affected systems, and actions taken
- Anonymous reporting is available for sensitive situations`,
    "Escalation Procedures": (ctx, _fw) => `**Escalation Matrix:**

- **P1 Critical:** Security Lead → CISO → Executive Team → Legal (within 15 min)
- **P2 High:** Security Lead → CISO (within 1 hour)
- **P3 Medium:** Assigned analyst → Security Lead (within 4 hours)
- **P4 Low:** Assigned analyst (within 24 hours)

If the primary contact is unavailable, escalation proceeds to the next level automatically after the SLA window. ${ctx.tenantName}'s on-call rotation ensures 24/7 coverage for P1 and P2 incidents.`,
    "Containment and Eradication": (_ctx, _fw) => `**Containment Steps:**
1. Isolate affected systems from the network (do not power off)
2. Preserve forensic evidence (memory dumps, logs, disk images)
3. Block identified IOCs (IPs, domains, hashes) at perimeter
4. Revoke compromised credentials and rotate secrets
5. Notify affected users if credentials are compromised

**Eradication:**
- Remove malware, unauthorized access, and persistence mechanisms
- Patch exploited vulnerabilities
- Verify eradication through scanning and log review before restoring access`,
    "Recovery and Restoration": (_ctx, _fw) => `**Recovery Procedures:**
1. Restore systems from verified clean backups
2. Re-enable services in a staged manner with enhanced monitoring
3. Verify system integrity before returning to production
4. Monitor recovered systems for 72 hours for signs of reinfection

**Recovery Validation:**
- All restored systems must pass security scan before reconnection
- User access is re-provisioned through standard provisioning workflow
- Recovery completion is documented and signed off by the incident commander`,
    "Communication Plan": (ctx, _fw) => `**Internal Communication:**
- Incident status updates to stakeholders every 2 hours for P1/P2
- Post-containment summary to all affected teams within 24 hours

**External Communication (if required):**
- Regulatory notification within timeframes mandated by applicable law
- Customer notification coordinated through Legal and Communications
- ${ctx.tenantName} will not disclose incident details publicly until investigation is complete
- All external communications are approved by Legal before release`,
    "Post-Incident Review": (ctx, _fw) => `A post-incident review (PIR) is conducted within 5 business days of incident closure.

**PIR Deliverables:**
- Timeline of events from detection to resolution
- Root cause analysis
- What worked well and what needs improvement
- Action items with owners and due dates
- Policy or procedure updates required

PIR findings are shared with ${ctx.tenantName}'s leadership team and tracked to completion. Lessons learned are incorporated into training and tabletop exercises.`
  },
  data_handling: {
    "Purpose and Scope": (ctx, fw) => `This policy defines how ${ctx.tenantName} classifies, handles, stores, and disposes of data across all systems. It ensures compliance with ${fw} and applicable data protection regulations.

This policy applies to all data processed, stored, or transmitted by ${ctx.tenantName}, including data held in ${ctx.connectedApps.length > 0 ? ctx.connectedApps.join(", ") : "all connected applications"}.`,
    "Data Classification Levels": (_ctx, _fw) => `All data must be classified into one of the following levels:

| Level | Label | Examples | Handling |
|-------|-------|----------|----------|
| **1** | Public | Marketing materials, public docs | No restrictions |
| **2** | Internal | Internal communications, procedures | Access limited to employees |
| **3** | Confidential | Customer data, financial records, PII | Encrypted at rest and in transit |
| **4** | Restricted | Credentials, encryption keys, PHI | Need-to-know basis, full audit trail |

Data owners are responsible for assigning classification. When uncertain, data should be classified at the higher level.`,
    "Handling Requirements by Classification": (_ctx, _fw) => `**Internal (Level 2):**
- Store on approved company systems only
- Do not share externally without manager approval

**Confidential (Level 3):**
- Encrypt at rest (AES-256) and in transit (TLS 1.2+)
- Access logged and auditable
- Sharing requires data owner approval and secure transfer method
- Laptops and mobile devices must use full-disk encryption

**Restricted (Level 4):**
- All Level 3 requirements plus:
- Access requires MFA and documented justification
- Data must not be stored in email, chat, or unapproved cloud services
- Printing and downloading require explicit approval`,
    "Encryption Standards": (_ctx, fw) => `${fw} requires appropriate encryption controls for data protection.

**At Rest:** AES-256 encryption for all Confidential and Restricted data
**In Transit:** TLS 1.2 or higher for all data transmissions
**Key Management:**
- Encryption keys are managed through a dedicated key management system
- Key rotation occurs annually or upon suspected compromise
- Key access is restricted to authorized personnel with audit logging`,
    "Data Retention and Disposal": (ctx, _fw) => `${ctx.tenantName} retains data only as long as required by business need or legal obligation.

**Retention Periods:**
- Audit logs: 1 year minimum
- Customer data: duration of contract plus 90 days
- Employee records: duration of employment plus 7 years
- Financial records: 7 years

**Disposal:** Data beyond retention period is securely deleted using NIST 800-88 compliant methods. Disposal is logged and verified.`,
    "Cross-Border Transfers": (ctx, fw) => `${fw.includes("GDPR") ? `Under GDPR, ${ctx.tenantName} ensures that personal data transferred outside the EEA is protected by Standard Contractual Clauses (SCCs) or an adequacy decision.

` : ""}**Transfer Requirements:**
- All cross-border data transfers require a documented legal basis
- Data processing agreements must be in place with all international processors
- Transfer impact assessments are conducted for new international data flows`,
    "Third-Party Data Sharing": (ctx, _fw) => `${ctx.tenantName} shares data with third parties only when necessary and under appropriate safeguards.

**Requirements:**
- Data processing agreements executed before sharing begins
- Third parties are assessed for security posture before engagement
- Shared data is limited to the minimum necessary (data minimization)
- Third-party access is reviewed annually and revoked when no longer needed`
  },
  password: {
    "Purpose and Scope": (ctx, fw) => `This policy establishes authentication standards for ${ctx.tenantName} to protect against unauthorized access. It supports ${fw} requirements and applies to all users, systems, and service accounts.`,
    "Password Requirements": (_ctx, _fw) => `**Minimum Standards:**
- Length: 12 characters minimum (16+ for privileged accounts)
- Complexity: mix of uppercase, lowercase, numbers, and symbols
- History: last 12 passwords may not be reused
- Expiration: 90 days for standard accounts, 60 days for privileged
- No dictionary words, usernames, or common patterns

Password managers are strongly recommended and provided to all employees.`,
    "Multi-Factor Authentication": (ctx, _fw) => `MFA is required for all ${ctx.tenantName} systems and applications.

**Requirements:**
- All user accounts must enable MFA
- Preferred methods: hardware security keys (FIDO2), authenticator apps (TOTP)
- SMS-based MFA is permitted only as a temporary fallback
- MFA is mandatory for: VPN, cloud console, email, and all ${ctx.connectedApps.length > 0 ? ctx.connectedApps.length + " integrated applications" : "connected applications"}`,
    "Single Sign-On": (ctx, _fw) => `${ctx.tenantName} uses SSO to centralize authentication and reduce password fatigue.

- All applications supporting SAML 2.0 or OIDC must be integrated with the SSO provider
- SSO sessions expire after 12 hours of inactivity
- Applications that do not support SSO require MFA and are documented as exceptions`,
    "Service Account and API Key Management": (ctx, _fw) => `Non-human identities (service accounts, API keys, OAuth tokens) at ${ctx.tenantName} are managed through the NHI governance process.

**Requirements:**
- Every service account has a designated human owner
- API keys are rotated every 90 days
- Service accounts use the minimum permissions required
- Unused service accounts are disabled after 30 days of inactivity`,
    "Password Storage and Transmission": (_ctx, _fw) => `**Storage:** Passwords are hashed using PBKDF2 (or bcrypt/argon2) with per-user salts. Plaintext passwords are never stored.

**Transmission:** Passwords are transmitted only over TLS 1.2+ encrypted connections. Password fields must not be logged or included in error messages.

**Secrets Management:** Application secrets, database credentials, and API keys are stored in a dedicated secrets manager — never in source code, configuration files, or environment variables.`,
    "Account Lockout and Recovery": (_ctx, _fw) => `**Lockout Policy:**
- Accounts are locked after 5 consecutive failed login attempts
- Lockout duration: 30 minutes (auto-unlock) or manual unlock by IT
- Lockout events are logged and reviewed for brute-force patterns

**Recovery:**
- Self-service password reset is available via verified MFA
- Identity verification by IT helpdesk requires two forms of identification
- Recovery of privileged accounts requires approval from the security team`
  },
  acceptable_use: {
    "Purpose and Scope": (ctx, fw) => `This policy defines acceptable and prohibited uses of ${ctx.tenantName}'s information systems, networks, and data. It supports ${fw} requirements and applies to all employees, contractors, and authorized third parties.`,
    "Permitted Use of Company Systems": (ctx, _fw) => `${ctx.tenantName}'s IT resources are provided for business purposes. Limited personal use is permitted provided it does not:

- Interfere with job responsibilities
- Consume excessive bandwidth or storage
- Violate any other organizational policy
- Expose the organization to legal or security risk`,
    "Prohibited Activities": (_ctx, _fw) => `The following activities are strictly prohibited:

- Unauthorized access to systems, data, or accounts belonging to others
- Installing unauthorized software or browser extensions
- Circumventing security controls (VPNs to bypass monitoring, proxy avoidance)
- Transmitting Confidential or Restricted data through unapproved channels
- Using company resources for illegal activities, harassment, or discrimination
- Cryptocurrency mining on company infrastructure
- Connecting unauthorized devices to the corporate network`,
    "SaaS and Cloud Application Usage": (ctx, _fw) => `Only approved SaaS applications may be used for business data.${ctx.connectedApps.length > 0 ? ` Currently approved: ${ctx.connectedApps.join(", ")}.` : ""}

**Requirements:**
- New SaaS tools must be vetted by IT Security before use
- Business data must not be stored in personal cloud accounts
- File sharing with external parties requires approved tools and encryption`,
    "AI and Generative AI Tool Usage": (ctx, _fw) => `${ctx.tenantName} permits use of approved AI tools subject to the following:

- Confidential and Restricted data must never be entered into external AI tools
- AI-generated outputs used in production must be reviewed by a human
- AI tool usage is logged for compliance and audit purposes
- Unapproved AI tools (including browser-based chatbots) are prohibited for work tasks`,
    "Personal Device Policy": (_ctx, _fw) => `Personal devices may access company resources only through approved MDM (Mobile Device Management) enrollment.

**Requirements:**
- Device must have full-disk encryption, screen lock, and current OS patches
- Company data is accessed through containerized apps or virtual desktop
- Remote wipe capability must be enabled for company data partition
- Lost or stolen devices must be reported within 4 hours`,
    "Monitoring and Enforcement": (ctx, _fw) => `${ctx.tenantName} reserves the right to monitor use of company systems for security and compliance purposes.

- Network traffic, email, and application usage may be monitored
- Monitoring is conducted in accordance with applicable privacy laws
- Users have no expectation of privacy when using company systems

${ctx.evidenceSummary}`,
    "Violations and Consequences": (ctx, _fw) => `Violations of this policy may result in:

1. Verbal warning and mandatory policy re-training
2. Written warning with documented performance impact
3. Suspension of system access pending investigation
4. Termination of employment or contract
5. Legal action where criminal activity is involved

${ctx.tenantName} investigates all reported violations. The severity of the consequence is proportional to the nature and impact of the violation.`
  }
};
function buildTemplateFallback(policyType, tenantContext, basedOn) {
  const template = POLICY_TEMPLATES[policyType];
  const fwStr = basedOn.join(", ");
  const contentLookup = SECTION_CONTENT[policyType] || {};
  const sections = template.sections.map((sectionTitle) => {
    const generator = contentLookup[sectionTitle];
    return {
      title: sectionTitle,
      content: generator ? generator(tenantContext, fwStr) : `This section addresses ${sectionTitle.toLowerCase()} requirements for ${tenantContext.tenantName} under ${fwStr}.`
    };
  });
  return {
    title: template.title,
    type: policyType,
    sections,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    basedOn
  };
}

export { generateSecurityPolicy as g };
//# sourceMappingURL=policy-generator-Dl0WlVu2.js.map
