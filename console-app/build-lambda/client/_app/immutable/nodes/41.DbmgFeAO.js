import{$ as e,B as t,Dt as n,H as r,I as i,L as a,Mt as o,Ot as s,Q as c,R as l,T as u,V as d,Y as f,_ as p,_t as m,bt as h,dt as g,ft as _,h as v,ht as y,it as b,jt as x,l as S,nt as C,pt as w,q as T,r as E,rt as D,x as O,xt as k,z as A}from"../chunks/DYSRzf4F.js";import"../chunks/ClsUfVDQ.js";import"../chunks/nsdYOAOH.js";var j=[{id:`access-control`,name:`Access Control Policy`,category:`access-control`,applicableFrameworks:[`SOC2`,`ISO27001`,`NIST_CSF`,`HIPAA`],tagline:`Who gets access to what, how it's granted, reviewed, and revoked`,content:`# Access Control Policy

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
Annually, or on any material change to infrastructure or regulatory environment.`},{id:`incident-response`,name:`Security Incident Response Policy`,category:`incident-response`,applicableFrameworks:[`SOC2`,`ISO27001`,`NIST_CSF`,`HIPAA`],tagline:`How we detect, respond to, and learn from security incidents`,content:`# Security Incident Response Policy

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
Security Team. Incident Commander is assigned per-incident.`},{id:`data-protection`,name:`Data Protection & Encryption Policy`,category:`data-protection`,applicableFrameworks:[`SOC2`,`ISO27001`,`HIPAA`,`GDPR`],tagline:`How customer and employee data is classified, encrypted, and protected`,content:`# Data Protection & Encryption Policy

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
Security Team owns this policy. Data owners are accountable for classification and controls within their systems.`},{id:`data-retention`,name:`Data Retention & Deletion Policy`,category:`retention`,applicableFrameworks:[`SOC2`,`ISO27001`,`HIPAA`,`GDPR`],tagline:`How long we keep data and how we delete it when it's time`,content:`# Data Retention & Deletion Policy

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
Legal Team. Security Team implements technical deletion controls.`},{id:`vendor-management`,name:`Vendor & Third-Party Risk Management Policy`,category:`vendor`,applicableFrameworks:[`SOC2`,`ISO27001`],tagline:`How we assess, onboard, and monitor vendors that handle our data`,content:`# Vendor & Third-Party Risk Management Policy

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
Security Team runs the review. Business Owner is accountable for ongoing vendor relationship.`},{id:`acceptable-use`,name:`Acceptable Use Policy`,category:`acceptable-use`,applicableFrameworks:[`SOC2`,`ISO27001`],tagline:`What employees can and cannot do with company systems`,content:`# Acceptable Use Policy

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
People Operations owns this policy. Security Team provides guidance and monitoring.`},{id:`change-management`,name:`Change Management Policy`,category:`change-management`,applicableFrameworks:[`SOC2`,`ISO27001`,`NIST_CSF`],tagline:`How we review and deploy changes to production systems`,content:`# Change Management Policy

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
Engineering Team owns day-to-day application. Security Team owns infrastructure and security-relevant changes.`},{id:`business-continuity`,name:`Business Continuity & Disaster Recovery Policy`,category:`business-continuity`,applicableFrameworks:[`SOC2`,`ISO27001`],tagline:`How we keep the service running through disruptions`,content:`# Business Continuity & Disaster Recovery Policy

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
Security Team. Engineering owns the technical implementation.`},{id:`byod`,name:`Bring-Your-Own-Device (BYOD) Policy`,category:`byod`,applicableFrameworks:[`SOC2`,`ISO27001`,`HIPAA`],tagline:`Security requirements for personal devices accessing company systems`,content:`# Bring-Your-Own-Device (BYOD) Policy

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
IT + Security. Device owners are accountable for maintaining required controls.`},{id:`gdpr-data-subject-rights`,name:`Data Subject Rights Procedure (GDPR)`,category:`data-protection`,applicableFrameworks:[`GDPR`],tagline:`How we handle GDPR data subject access, rectification, and deletion requests`,content:`# Data Subject Rights Procedure (GDPR)

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
Privacy Team (DPO where designated). Security Team handles technical deletion.`},{id:`hipaa-breach-notification`,name:`HIPAA Breach Notification Procedure`,category:`incident-response`,applicableFrameworks:[`HIPAA`],tagline:`How we identify, investigate, and notify for HIPAA breaches`,content:`# HIPAA Breach Notification Procedure

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
Security Team + Privacy Team (HIPAA Privacy Officer). Legal reviews notifications before release.`}];function ee(e){let t=new Set;for(let n of j)n.applicableFrameworks.some(t=>e.includes(t))&&t.add(n.id);return Array.from(t)}var te=r(`<div></div>`),ne=r(`<div class="flex-1 flex items-center"><button type="button"><div> </div> <div class="text-xs font-medium hidden sm:block"> </div></button> <!></div>`),re=r(`<option> </option>`),ie=r(`<button type="button"> </button>`),ae=r(`<button type="button"><div class="text-sm font-medium"> </div></button>`),oe=r(`<h2 class="text-xl font-semibold text-foreground mb-1">Tell us about your company</h2> <p class="text-sm text-muted-foreground mb-6">We'll use this to recommend frameworks and starter policies.</p> <div class="space-y-5"><div><label class="block text-sm font-medium text-foreground/80 mb-1" for="o-industry">Industry</label> <select id="o-industry" class="w-full px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground"><option>Select an industry</option><!></select></div> <div><div class="block text-sm font-medium text-foreground/80 mb-2">Company size</div> <div class="flex flex-wrap gap-2"></div></div> <div><div class="block text-sm font-medium text-foreground/80 mb-2">Which best describes your goals?</div> <div class="grid grid-cols-1 sm:grid-cols-2 gap-2"></div></div></div>`,1),se=r(`<span class="text-white text-xs">✓</span>`),ce=r(`<button type="button"><div><!></div> <div class="flex-1"><div class="flex items-center gap-2 flex-wrap"><div class="font-medium text-foreground"> </div> <span> </span> <span class="text-xs text-muted-foreground"> </span></div> <p class="mt-0.5 text-xs text-muted-foreground"> </p></div></button>`),le=r(`<h2 class="text-xl font-semibold text-foreground mb-1">Choose your frameworks</h2> <p class="text-sm text-muted-foreground mb-6">We'll install these compliance packs and start scoring your evidence against their controls.</p> <div class="space-y-2"></div>`,1),ue=r(`<span class="text-white text-xs">✓</span>`),de=r(`<span class="text-[10px] uppercase font-semibold bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded">Suggested</span>`),fe=r(`<span> </span>`),pe=r(`<button type="button"><div><!></div> <div class="flex-1 min-w-0"><div class="flex items-center gap-2 flex-wrap"><div class="font-medium text-sm text-foreground"> </div> <!> <!></div> <p class="mt-0.5 text-xs text-muted-foreground"> </p></div></button>`),me=r(`<h2 class="text-xl font-semibold text-foreground mb-1">Seed starter policies</h2> <p class="text-sm text-muted-foreground mb-6"> </p> <div class="space-y-2 max-h-96 overflow-y-auto pr-1"></div>`,1),he=r(`<div class="flex gap-2 items-start"><input type="email" placeholder="email@company.com" class="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground"/> <input type="text" placeholder="Full name" class="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground"/> <select class="px-3 py-2 text-sm border border-input rounded-md bg-white dark:bg-gray-900 text-foreground/80"><option>Admin</option><option>Member</option><option>Viewer</option></select> <button type="button" class="px-3 py-2 text-muted-foreground/70 hover:text-destructive" title="Remove">×</button></div>`),ge=r(`<h2 class="text-xl font-semibold text-foreground mb-1">Invite your team</h2> <p class="text-sm text-muted-foreground mb-6">Invite teammates who should have access. You can always invite more later from Settings → Users.</p> <div class="space-y-2"><!> <button type="button" class="text-sm text-primary hover:underline">+ Add another</button></div>`,1),_e=r(`<h2 class="text-xl font-semibold text-foreground mb-1">Connect your first app</h2> <p class="text-sm text-muted-foreground mb-6">Adapters pull live evidence from your tools. Skip to connect later from the Apps page.</p> <div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><a href="/console/apps" class="p-4 border border-border rounded-md hover:border-primary transition-colors"><div class="font-medium text-foreground">Okta</div> <p class="mt-1 text-xs text-muted-foreground">Identity, MFA, access provisioning. Uses an API token.</p></a> <a href="/console/apps" class="p-4 border border-border rounded-md hover:border-primary transition-colors"><div class="font-medium text-foreground">GitHub</div> <p class="mt-1 text-xs text-muted-foreground">Branch protection, required reviews, signed commits. OAuth one-click.</p></a></div> <p class="mt-4 text-xs text-muted-foreground">More coming: Google Workspace, Microsoft 365, Slack, AWS, Azure.</p>`,1),ve=r(`<h2 class="text-xl font-semibold text-foreground mb-1">Ready to go</h2> <p class="text-sm text-muted-foreground mb-6">Here's what we'll set up:</p> <ul class="space-y-2 text-sm text-foreground/80"><li class="flex gap-2"><span class="text-primary">→</span> </li> <li class="flex gap-2"><span class="text-primary">→</span> </li> <li class="flex gap-2"><span class="text-primary">→</span> </li> <li class="flex gap-2"><span class="text-primary">→</span> </li> <li class="flex gap-2"><span class="text-primary">→</span>Run initial evidence evaluation</li></ul>`,1),ye=r(`<div class="flex gap-2"><span> </span> <span class="text-foreground/80"> </span></div>`),be=r(`<div class="mt-6 p-4 rounded-md bg-success-muted border border-success/20"><p class="text-sm text-success">All set. Head to your dashboard.</p></div>`),xe=r(`<div class="mt-6 p-4 rounded-md bg-destructive-muted border border-destructive/20"><p class="text-sm text-destructive"> </p> <p class="mt-1 text-xs text-destructive">Anything that succeeded above is saved — continue to the dashboard.</p></div>`),Se=r(`<h2 class="text-xl font-semibold text-foreground mb-4">Setting up your tenant</h2> <div class="space-y-1 font-mono text-xs max-h-80 overflow-y-auto"></div> <!>`,1),Ce=r(`<button type="button" class="px-4 py-2 text-sm text-gray-600 dark:text-muted-foreground/70 hover:text-gray-900 dark:hover:text-white">Skip</button>`),we=r(`<a href="/console" class="px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-md font-medium">Go to dashboard →</a>`),Te=r(`<button type="button" class="px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-md font-medium">Set everything up</button>`),Ee=r(`<a href="/console" class="px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-md font-medium">Continue anyway →</a>`),De=r(`<button type="button" class="px-5 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-md font-medium disabled:opacity-50">Continue →</button>`),Oe=r(`<div class="min-h-screen bg-background"><div class="max-w-4xl mx-auto px-6 py-10"><div class="mb-8 text-center"><h1 class="text-3xl font-bold text-foreground">Welcome to AtlasIT</h1> <p class="mt-2 text-sm text-gray-600 dark:text-muted-foreground/70">A few quick questions and we'll set you up with real compliance scoring.</p></div> <div class="mb-8 flex items-center justify-between"></div> <div class="bg-card border border-border rounded-lg p-6 sm:p-8"><!> <div class="mt-8 flex items-center justify-between border-t border-border pt-5"><button type="button" class="px-4 py-2 text-sm text-gray-600 dark:text-muted-foreground/70 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">← Back</button> <div class="flex gap-2"><!> <!></div></div></div> <div class="mt-5 text-center"><a href="/console" class="text-xs text-muted-foreground/70 hover:text-gray-600 dark:hover:text-gray-300">Skip setup for now</a></div></div></div>`);function M(r,M){s(M,!1);let N=y(),P=y(),F=y(),I=y(),L=[{id:`company`,label:`Company`,description:`Industry, size, goals`},{id:`frameworks`,label:`Frameworks`,description:`Which regulations you care about`},{id:`policies`,label:`Policies`,description:`Starter policies to customize`},{id:`team`,label:`Team`,description:`Invite teammates (optional)`},{id:`integration`,label:`Apps`,description:`Connect your first integration (optional)`},{id:`finish`,label:`Finish`,description:`Review and go`}],R=y(`company`),z=y(``),B=y(``),V=y([]),ke=[`Technology / SaaS`,`Financial services`,`Healthcare`,`E-commerce / Retail`,`Education`,`Manufacturing`,`Media / Entertainment`,`Government`,`Other`],Ae=[`1-10`,`11-50`,`51-200`,`201-1000`,`1000+`],je=[{id:`soc2-prep`,label:`SOC 2 audit prep`},{id:`iso-cert`,label:`ISO 27001 certification`},{id:`hipaa`,label:`HIPAA compliance`},{id:`gdpr`,label:`GDPR / privacy compliance`},{id:`continuous`,label:`Continuous monitoring`},{id:`vendor-risk`,label:`Vendor risk management`}];function Me(e){m(V,f(V).includes(e)?f(V).filter(t=>t!==e):[...f(V),e]),e===`soc2-prep`&&f(V).includes(`soc2-prep`)&&m(U,[...new Set([...f(U),`pack-soc2-builtin`])]),e===`iso-cert`&&f(V).includes(`iso-cert`)&&m(U,[...new Set([...f(U),`pack-iso27001-builtin`])]),e===`hipaa`&&f(V).includes(`hipaa`)&&m(U,[...new Set([...f(U),`pack-hipaa-builtin`])]),e===`gdpr`&&f(V).includes(`gdpr`)&&m(U,[...new Set([...f(U),`pack-gdpr-builtin`])])}let H=[{id:`pack-soc2-builtin`,label:`SOC 2 Type II`,frameworkKey:`SOC2`,controlCount:26,tagline:`US trust-services criteria — common for B2B SaaS`},{id:`pack-iso27001-builtin`,label:`ISO 27001:2022`,frameworkKey:`ISO27001`,controlCount:17,tagline:`International infosec management standard`},{id:`pack-nist-csf-builtin`,label:`NIST CSF 2.0`,frameworkKey:`NIST_CSF`,controlCount:7,tagline:`US critical-infrastructure cybersecurity framework`},{id:`pack-hipaa-builtin`,label:`HIPAA Security`,frameworkKey:`HIPAA`,controlCount:7,tagline:`US healthcare PHI protection`},{id:`pack-gdpr-builtin`,label:`GDPR`,frameworkKey:`GDPR`,controlCount:7,tagline:`EU data-subject rights and data protection`}],U=y([]);function Ne(e){m(U,f(U).includes(e)?f(U).filter(t=>t!==e):[...f(U),e])}let W=y([]);function Pe(e){m(W,f(W).includes(e)?f(W).filter(t=>t!==e):[...f(W),e])}let G=y([]);function Fe(){m(G,[...f(G),{email:``,displayName:``,role:`member`}])}function Ie(e){m(G,f(G).filter((t,n)=>n!==e))}let K=y(!1),q=y([]),J=y(!1),Y=y(null);async function X(e,t){m(q,[...f(q),{kind:e,msg:t}])}async function Le(){m(K,!0),m(q,[]),m(Y,null);try{await X(`info`,`Saving company profile...`);let e=sessionStorage.getItem(`atlasit_user`),t=e?JSON.parse(e).tenantId:null;if(!t)throw Error(`No tenant in session — log in again`);if(f(z)||f(B)){let e=await fetch(`/api/v1/tenants/${t}`,{method:`PATCH`,headers:{"Content-Type":`application/json`},body:JSON.stringify({...f(z)?{industry:f(z)}:{},...f(B)?{size:f(B)}:{},config:{useCases:f(V)}})});e.ok?await X(`ok`,`Profile saved (industry: ${f(z)||`—`}, size: ${f(B)||`—`})`):await X(`err`,`Profile save returned ${e.status} — continuing`)}for(let e of f(U)){let t=H.find(t=>t.id===e)?.label??e;await X(`info`,`Installing ${t}...`);let n=await fetch(`/api/compliance/api/v1/compliance-packs/${e}/install`,{method:`POST`});n.ok?await X(`ok`,`${t} installed`):await X(`err`,`${t} install failed (HTTP ${n.status})`)}for(let e of f(W)){let t=j.find(t=>t.id===e);if(!t)continue;await X(`info`,`Creating policy: ${t.name}...`);let n=await fetch(`/api/compliance/api/v1/policies`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({name:t.name,category:t.category,version:`1.0`,content:t.content,framework_refs:t.applicableFrameworks})});n.ok?await X(`ok`,`${t.name} drafted`):await X(`err`,`${t.name} failed (HTTP ${n.status})`)}for(let e of f(G)){if(!e.email.trim())continue;await X(`info`,`Inviting ${e.email}...`);let t=await fetch(`/api/v1/tenant/users/invite`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({email:e.email.trim(),displayName:e.displayName.trim()||void 0,role:e.role})});t.ok?await X(`ok`,`Invited ${e.email}`):await X(`err`,`Invite to ${e.email} failed (HTTP ${t.status})`)}if(f(U).length>0){await X(`info`,`Running initial compliance evaluation...`);for(let e of f(U))await fetch(`/api/compliance/api/v1/compliance-packs/${e}/evaluate`,{method:`POST`}).catch(()=>{});await X(`ok`,`Initial evaluation complete`)}m(J,!0)}catch(e){m(Y,e.message),await X(`err`,`Fatal: ${f(Y)}`)}finally{m(K,!1)}}function Re(e){m(R,e)}function ze(){let e=L.findIndex(e=>e.id===f(R));e<L.length-1&&m(R,L[e+1].id)}function Be(){let e=L.findIndex(e=>e.id===f(R));e>0&&m(R,L[e-1].id)}E(()=>{sessionStorage.getItem(`atlasit_token`)||(window.location.href=`/login`)});function Ve(e){return{SOC2:`bg-info-muted text-info`,ISO27001:`bg-primary-muted text-primary`,NIST_CSF:`bg-info-muted text-info`,HIPAA:`bg-warning-muted text-warning`,GDPR:`bg-primary-muted text-primary`}[e]??`bg-muted text-muted-foreground`}C(()=>f(U),()=>{m(N,H.filter(e=>f(U).includes(e.id)).map(e=>e.frameworkKey))}),C(()=>f(N),()=>{m(P,ee(f(N)))}),C(()=>f(R),()=>{m(F,L.findIndex(e=>e.id===f(R)))}),C(()=>f(R),()=>{m(I,f(R)===`team`||f(R)===`integration`||f(R)===`policies`)}),C(()=>(f(U),f(W),f(P)),()=>{f(U).length>0&&f(W).length===0&&m(W,f(P))}),D(),S();var Z=Oe(),He=g(Z),Q=w(g(He),2);i(Q,5,()=>L,a,(e,n,r)=>{var i=ne(),a=g(i),s=g(a),d=g(s,!0);o(s);var p=w(s,2),m=g(p,!0);o(p),o(a);var h=w(a,2),_=e=>{var n=te();b(()=>u(n,1,`flex-1 h-0.5 mx-1 ${r<f(F)?`bg-blue-600`:`bg-muted`}`)),t(e,n)};l(h,e=>{c(()=>r<L.length-1)&&e(_)}),o(i),b(()=>{a.disabled=r>f(F),u(a,1,`flex flex-col items-center gap-1 ${r<=f(F)?`text-primary`:`text-muted-foreground/70`}`),u(s,1,`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2
              ${r<f(F)?`bg-blue-600 border-blue-600 text-white`:r===f(F)?`border-blue-600 bg-card text-primary`:`border-input bg-card text-muted-foreground/70`}`),A(d,r<f(F)?`✓`:r+1),A(m,(f(n),c(()=>f(n).label)))}),T(`click`,a,()=>r<f(F)&&Re(f(n).id)),t(e,i)}),o(Q);var Ue=w(Q,2),We=g(Ue),Ge=e=>{var n=oe(),r=w(_(n),4),s=g(r),l=w(g(s),2),d=g(l);d.value=d.__value=``,i(w(d),1,()=>ke,a,(e,n)=>{var r=re(),i=g(r,!0);o(r);var a={};b(()=>{A(i,f(n)),a!==(a=f(n))&&(r.value=(r.__value=f(n))??``)}),t(e,r)}),o(l),o(s);var p=w(s,2),h=w(g(p),2);i(h,5,()=>Ae,a,(e,n)=>{var r=ie(),i=g(r,!0);o(r),b(()=>{u(r,1,`px-3 py-1.5 text-sm rounded-md border transition-colors
                    ${f(B)===f(n)?`bg-blue-600 text-white border-blue-600`:`bg-white dark:bg-gray-900 border-input text-foreground/80 hover:border-primary`}`),A(i,f(n))}),T(`click`,r,()=>m(B,f(n))),t(e,r)}),o(h),o(p);var v=w(p,2),y=w(g(v),2);i(y,5,()=>je,a,(e,n)=>{var r=ae(),i=g(r),a=g(i,!0);o(i),o(r),b(e=>{u(r,1,`text-left p-3 rounded-md border transition-colors
                    ${e??``}`),A(a,(f(n),c(()=>f(n).label)))},[()=>(f(V),f(n),c(()=>f(V).includes(f(n).id)?`bg-primary-muted border-primary text-blue-900 dark:text-blue-200`:`bg-white dark:bg-gray-900 border-input text-foreground/80 hover:border-primary`))]),T(`click`,r,()=>Me(f(n).id)),t(e,r)}),o(y),o(v),o(r),O(l,()=>f(z),e=>m(z,e)),t(e,n)},Ke=e=>{var n=le(),r=w(_(n),4);i(r,5,()=>H,a,(e,n)=>{var r=ce(),i=g(r),a=g(i),s=e=>{t(e,se())},d=k(()=>(f(U),f(n),c(()=>f(U).includes(f(n).id))));l(a,e=>{f(d)&&e(s)}),o(i);var p=w(i,2),m=g(p),h=g(m),_=g(h,!0);o(h);var v=w(h,2),y=g(v,!0);o(v);var x=w(v,2),S=g(x);o(x),o(m);var C=w(m,2),E=g(C,!0);o(C),o(p),o(r),b((e,t,a)=>{u(r,1,`w-full text-left p-4 rounded-md border transition-colors flex items-start gap-3
                ${e??``}`),u(i,1,`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                ${t??``}`),A(_,(f(n),c(()=>f(n).label))),u(v,1,`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a??``}`),A(y,(f(n),c(()=>f(n).frameworkKey))),A(S,`${(f(n),c(()=>f(n).controlCount))??``} controls`),A(E,(f(n),c(()=>f(n).tagline)))},[()=>(f(U),f(n),c(()=>f(U).includes(f(n).id)?`bg-primary-muted border-primary`:`bg-white dark:bg-gray-900 border-input hover:border-primary`)),()=>(f(U),f(n),c(()=>f(U).includes(f(n).id)?`bg-blue-600 border-blue-600`:`border-gray-400 dark:border-gray-500`)),()=>(f(n),c(()=>Ve(f(n).frameworkKey)))]),T(`click`,r,()=>Ne(f(n).id)),t(e,r)}),o(r),t(e,n)},qe=e=>{var n=me(),r=w(_(n),2),s=g(r);o(r);var d=w(r,2);i(d,5,()=>j,a,(e,n)=>{let r=h(()=>(f(P),f(n),c(()=>f(P).includes(f(n).id))));var s=pe(),d=g(s),p=g(d),m=e=>{t(e,ue())},_=k(()=>(f(W),f(n),c(()=>f(W).includes(f(n).id))));l(p,e=>{f(_)&&e(m)}),o(d);var v=w(d,2),y=g(v),x=g(y),S=g(x,!0);o(x);var C=w(x,2),E=e=>{t(e,de())};l(C,e=>{f(r)&&e(E)}),i(w(C,2),1,()=>(f(n),c(()=>f(n).applicableFrameworks)),a,(e,n)=>{var r=fe(),i=g(r,!0);o(r),b(e=>{u(r,1,`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${e??``}`),A(i,f(n))},[()=>(f(n),c(()=>Ve(f(n))))]),t(e,r)}),o(y);var D=w(y,2),O=g(D,!0);o(D),o(v),o(s),b((e,t)=>{u(s,1,`w-full text-left p-3 rounded-md border transition-colors flex items-start gap-3
                ${e??``}`),u(d,1,`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                ${t??``}`),A(S,(f(n),c(()=>f(n).name))),A(O,(f(n),c(()=>f(n).tagline)))},[()=>(f(W),f(n),c(()=>f(W).includes(f(n).id)?`bg-primary-muted border-primary`:`bg-white dark:bg-gray-900 border-input hover:border-primary`)),()=>(f(W),f(n),c(()=>f(W).includes(f(n).id)?`bg-blue-600 border-blue-600`:`border-gray-400 dark:border-gray-500`))]),T(`click`,s,()=>Pe(f(n).id)),t(e,s)}),o(d),b(()=>A(s,`We'll create draft policies based on your chosen frameworks. You can edit before publishing.
          ${(f(P),c(()=>f(P).length))??``} suggested based on your selection.`)),t(e,n)},Je=n=>{var r=ge(),s=w(_(r),4),c=g(s);i(c,1,()=>f(G),a,(n,r,i)=>{var a=he(),s=g(a);p(s);var c=w(s,2);p(c);var l=w(c,2),u=g(l);u.value=u.__value=`admin`;var d=w(u);d.value=d.__value=`member`;var m=w(d);m.value=m.__value=`viewer`,o(l);var h=w(l,2);o(a),v(s,()=>f(r).email,t=>(f(r).email=t,e(()=>f(G)))),v(c,()=>f(r).displayName,t=>(f(r).displayName=t,e(()=>f(G)))),O(l,()=>f(r).role,t=>(f(r).role=t,e(()=>f(G)))),T(`click`,h,()=>Ie(i)),t(n,a)});var l=w(c,2);o(s),T(`click`,l,Fe),t(n,r)},Ye=e=>{var n=_e();x(6),t(e,n)},Xe=e=>{var n=d(),r=_(n),s=e=>{var n=ve(),r=w(_(n),4),i=g(r),a=w(g(i));o(i);var s=w(i,2),l=w(g(s));o(s);var u=w(s,2),d=w(g(u));o(u);var p=w(u,2),m=w(g(p));o(p),x(2),o(r),b((e,t)=>{A(a,`Save company profile: ${(f(z)||`—`)??``}, ${(f(B)||`—`)??``}, ${(f(V),c(()=>f(V).length))??``} use case${(f(V),c(()=>f(V).length===1?``:`s`))??``}`),A(l,`Install ${(f(U),c(()=>f(U).length))??``} compliance pack${(f(U),c(()=>f(U).length===1?``:`s`))??``}`),A(d,`Create ${(f(W),c(()=>f(W).length))??``} starter polic${(f(W),c(()=>f(W).length===1?`y`:`ies`))??``} (drafts)`),A(m,`Invite ${e??``} teammate${t??``}`)},[()=>(f(G),c(()=>f(G).filter(e=>e.email.trim()).length)),()=>(f(G),c(()=>f(G).filter(e=>e.email.trim()).length===1?``:`s`))]),t(e,n)},p=e=>{var n=Se(),r=w(_(n),2);i(r,5,()=>f(q),a,(e,n)=>{var r=ye(),i=g(r),a=g(i,!0);o(i);var s=w(i,2),l=g(s,!0);o(s),o(r),b(()=>{u(i,1,(f(n),c(()=>f(n).kind===`ok`?`text-success`:f(n).kind===`err`?`text-destructive`:`text-gray-500`))),A(a,(f(n),c(()=>f(n).kind===`ok`?`✓`:f(n).kind===`err`?`✗`:`•`))),A(l,(f(n),c(()=>f(n).msg)))}),t(e,r)}),o(r);var s=w(r,2),d=e=>{t(e,be())},p=e=>{var n=xe(),r=g(n),i=g(r);o(r),x(2),o(n),b(()=>A(i,`Setup hit an error: ${f(Y)??``}`)),t(e,n)};l(s,e=>{f(J)?e(d):f(Y)&&e(p,1)}),t(e,n)};l(r,e=>{!f(K)&&!f(J)&&!f(Y)?e(s):e(p,-1)}),t(e,n)};l(We,e=>{f(R)===`company`?e(Ge):f(R)===`frameworks`?e(Ke,1):f(R)===`policies`?e(qe,2):f(R)===`team`?e(Je,3):f(R)===`integration`?e(Ye,4):f(R)===`finish`&&e(Xe,5)});var Ze=w(We,2),$=g(Ze),Qe=w($,2),$e=g(Qe),et=e=>{var n=Ce();b(()=>n.disabled=f(K)),T(`click`,n,ze),t(e,n)};l($e,e=>{f(I)&&f(R)!==`finish`&&e(et)});var tt=w($e,2),nt=e=>{var n=d(),r=_(n),i=e=>{t(e,we())},a=e=>{var n=Te();T(`click`,n,Le),t(e,n)},o=e=>{t(e,Ee())};l(r,e=>{f(J)?e(i):!f(K)&&!f(Y)?e(a,1):f(Y)&&e(o,2)}),t(e,n)},rt=e=>{var n=De();b(()=>n.disabled=(f(K),f(R),f(U),c(()=>f(K)||f(R)===`frameworks`&&f(U).length===0))),T(`click`,n,ze),t(e,n)};l(tt,e=>{f(R)===`finish`?e(nt):e(rt,-1)}),o(Qe),o(Ze),o(Ue),x(2),o(He),o(Z),b(()=>$.disabled=f(F)===0||f(K)),T(`click`,$,Be),t(r,Z),n()}export{M as component};