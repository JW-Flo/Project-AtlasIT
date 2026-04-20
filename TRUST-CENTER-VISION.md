# AtlasIT Trust Center Strategic Vision

**Last updated:** 2026-04-20  
**Author:** Strategic Research & Product Design  
**Status:** Design Phase — No Implementation

---

## Executive Summary

AtlasIT's Trust Center will evolve from a static compliance snapshot into the **real-time compliance dashboard for customers and prospects** — the public face of organizational trustworthiness. This positions AtlasIT as the first GRC platform to offer **live, adapter-grounded, evidence-backed trust signals** that prospects can verify programmatically.

**Strategic thesis:** Trust Centers become the primary pre-sales credibility signal that replaces months of security questionnaires, replacing static PDFs with living compliance proof.

**Competitive moat:** Evidence-grounded claims (not self-attestation) + audit trail lineage + embeddable real-time widgets + self-service NDA workflows.

---

## Current State (Phase 9 — 6/8 Shipped)

### Live in Production

- Public `/trust/{tenantSlug}` route at `https://www.atlasit.pro/trust/atlasit`
- Framework scores (SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR) with pass/fail breakdowns
- Evidence recency indicators ("Updated 3 hours ago")
- Connected integrations count (privacy-preserving — shows logos, not credentials)
- Tenant visibility controls — admin toggle at `/console/settings/trust`
- Embeddable badge — `/api/v1/trust/:slug/badge.svg` (shields.io-style)
- Embeddable iframe — `/trust/[slug]/embed` for partner/prospect portals
- Auditor PDF export (Phase 9.1) — `GET /api/v1/trust/:slug/export.pdf` with SHA-256 content hash for tamper detection

### Pending (Phase 9 completion)

- **NDA workflow** — visitor requests detailed evidence → admin approval → time-limited signed URL
- **Questionnaire AI Lambda port** — keyword → control mapping + Groq response generation (currently skeleton in SvelteKit, needs compliance-api Lambda endpoint)

### Database Foundation

- `trust_access_requests` table — NDA request tracking (name, email, company, reason, approval status, time-limited access tokens)
- `questionnaires` + `questionnaire_responses` tables — SIG Lite / CAIQ / custom questionnaire response generation
- `compliance_evidence` table — tamper-evident SHA-256 hashed evidence with control tags, impact direction, confidence scoring
- `compliance_scores` table — pre-calculated framework scores with daily re-evaluation
- Evidence locker: R2 immutable audit trail + D1 queryable index

---

## Competitive Landscape Analysis

### Vanta Trust Center (Market Leader — 5,000+ Pages)

**Strengths:**

- Largest network effect (5,000+ trust pages = social proof)
- AI-powered chatbot for security questions (visitor insights = sales intelligence)
- Automated NDA/document approval via CRM integrations (93% automation rate)
- ROI tracking — revenue influenced by Trust Center activity
- Real-time control monitoring (not quarterly snapshots)

**Weaknesses:**

- Expensive ($20k–$70k annual contracts)
- Manual evidence uploads required for many controls
- Static attestations — lacks real-time operational proof
- G2 complaints: inflexible contracts, slow security review cycles (despite 81% faster claim)

**Key Features:**

- Custom tags/filters (by product, region, industry)
- Subscriber notifications on security updates
- Document access management with approval workflows
- Certifications: SOC 2, ISO 27001, GDPR, HIPAA, HITRUST

### Drata Trust Management

**Strengths:**

- Comprehensive certification display (SOC 2/3, ISO 27001/27017/27018/42001, HIPAA, CCPA, GDPR)
- Active incident transparency (e.g., March 2026 Axios supply chain response)
- FedRAMP 20x pilot participant (federal market credibility)
- Infrastructure-as-code emphasis (DevSecOps positioning)
- Accessible documentation without auth (penetration tests, data flow diagrams, CAIQ responses, cyber insurance docs)

**Weaknesses:**

- Similar pricing pressure to Vanta
- Less emphasis on live data vs. point-in-time certifications
- No public API for programmatic trust verification

**Key Features:**

- Risk profile disclosure (restricted data access, moderate impact classification)
- CISA Secure-by-Design Pledge signatory
- VPAT accessibility certification

### Secureframe Trust Center

**Strengths:**

- Strong federal positioning (FedRAMP 20x Low, CMMC Level 2, TX-RAMP Level 1)
- Eight monitoring domains (Change Management, Availability, Vulnerability Management, etc.)
- Timestamped audit artifacts with expiration dates
- Gated credential validation (request buttons for certificates)
- Control test matrices from third-party auditors (Coalfire, Cyber AB)

**Weaknesses:**

- Less emphasis on SMB market (federal-first positioning)
- Fewer interactive features vs. Vanta
- Static certification approach with periodic renewals

**Key Features:**

- Per-domain control descriptions with policy frameworks
- Downloadable POAM documents and authorization letters
- Dedicated FedRAMP resource section

### SecurityScorecard Trust (Transparency Leader)

**Strengths:**

- Complete scoring methodology transparency (only vendor to publish full algorithm)
- Real-time metrics (10.4B+ security issues discovered daily, 12.6M companies rated)
- Independent validation by third-party experts
- 48-hour refute response time + <1% false positive rate (publicly tracked)
- Free access for any organization to check their own rating

**Weaknesses:**

- Outside scoring (external observations) vs. inside proof (operational evidence)
- No compliance framework mapping (security-focused, not GRC)
- Vendor risk tool, not customer trust page

**Key Features:**

- Continuous daily scanning for paid customers
- Breach prediction algorithm based on 15,000 historical incidents
- Own 99% of data (4.1B IP addresses, 1,400 ports, global sinkholes/honeypots)
- Change Committee review before scoring modifications

### AWS Compliance (Enterprise Standard)

**Strengths:**

- 143 security standards and compliance certifications (PCI-DSS, HIPAA, FedRAMP, GDPR, FIPS 140-3, NIST 800-171)
- AWS Artifact — self-service portal for on-demand compliance reports (auditor-issued third-party attestations)
- AWS Audit Manager — continuous compliance auditing tool
- Clear shared responsibility model disclosure

**Weaknesses:**

- Infrastructure provider (not SaaS application)
- No customer-specific trust pages (tenant-level proof)
- Quarterly/annual audit cycles (not real-time operational evidence)

**Key Features:**

- Continuous monitoring of thousands of global compliance requirements
- Professional security assurance services
- Regular compliance announcements page

---

## Strategic Positioning

### Thesis: Trust Center as Real-Time Compliance Dashboard

AtlasIT's Trust Center is not a compliance report generator — it is a **living compliance dashboard** that proves trustworthiness through operational evidence, not self-attestation.

**Differentiation from competitors:**

| Feature              | Vanta/Drata                           | AtlasIT                                                                             |
| -------------------- | ------------------------------------- | ----------------------------------------------------------------------------------- |
| **Data source**      | Manual uploads + periodic scans       | Adapter-fed live operational events                                                 |
| **Update frequency** | Weekly/monthly + manual refresh       | Real-time (evidence flows as operations happen)                                     |
| **Evidence lineage** | Point-in-time snapshots               | Full audit trail from source to control (R2 immutable + SHA-256 content hash)       |
| **Proof mechanism**  | Self-attestation + third-party audits | Adapter-grounded claims (Okta sync = 2 hours ago)                                   |
| **Buyer access**     | PDF exports + manual NDA workflow     | Self-service evidence access (NDA-gated signed URLs) + embeddable widgets           |
| **Transparency**     | Framework scores + cert badges        | Control-level evidence timeline + adapter health indicators                         |
| **Verifiability**    | Static PDF (tamper risk)              | SHA-256 content hash per page + audit trail API                                     |
| **Integration**      | Badge embed only                      | Embeddable compliance widgets (framework-specific, control-specific, live-updating) |

**Key insight from research:** Enterprise buyers check SOC 2 status FIRST when evaluating SMB vendors. Current tools force buyers to wait for sales calls, NDA negotiations, and manual PDF sharing. AtlasIT eliminates that friction by making compliance proof self-service.

---

## Expansion Phases

### Phase 10: Evidence Transparency & Live Feeds

**Objective:** Surface the continuous evidence pipeline publicly to prove "living compliance" vs. static snapshots.

**Features:**

1. **Public Evidence Timeline**
   - Anonymized evidence feed on `/trust/:slug/evidence` page
   - Shows: control ID, category (access_grant, policy_change, adapter_pull), impact (positive/detrimental), timestamp
   - Hides: PII, credentials, internal IPs, employee names, customer lists
   - Real-time feed: "Okta directory sync completed 14 minutes ago → SOC2-CC6.1 ✓"
   - Filter by framework, control, category, impact
   - "Last verified" timestamps per control with visual staleness indicators (green <24h, yellow <7d, red >30d)

2. **Adapter Health Dashboard**
   - Live status for each connected integration: "Okta sync: 2 hours ago ✓"
   - Sync frequency indicators (hourly, daily, real-time webhook)
   - Error state transparency: "GitHub adapter failed 3 sync attempts (API rate limit) — retrying in 45m"
   - Control dependency graph: "SOC2-CC6.1 depends on Okta + Google Workspace + M365 directory sync"

3. **Control Pass/Fail Trend Graphs**
   - 30-day sparkline per control showing evidence recency
   - Regression indicators: "CC6.1 dropped from verified → in_progress (last evidence 31 days ago)"
   - Improvement animations: "CC6.3 promoted to verified (attestation signed 2 hours ago)"

4. **Evidence Recency Heatmap**
   - Visual matrix: frameworks (rows) × control categories (columns)
   - Color-coded by evidence age: green (live), yellow (stale), red (failing), gray (not applicable)

**Technical Implementation:**

- New API endpoint: `GET /api/v1/trust/:slug/evidence/timeline`
  - Query params: `framework`, `controlId`, `category`, `impact`, `since`, `limit`, `offset`
  - Returns paginated anonymized evidence items from `compliance_evidence` table
  - Privacy filter: strip PII fields, hash actor IDs, redact internal IPs
  - Rate limit: 60 requests/hour per IP (prevent scraping)

- Database view: `CREATE VIEW trust_evidence_public AS SELECT id, framework, control_id, category, impact, confidence, event_type, created_at FROM compliance_evidence WHERE tenant_id = ? AND <privacy_filters>`

- UI Components:
  - `<TrustTimeline framework="SOC2" />` — animated evidence stream with sparklines
  - `<AdapterHealthCard slug="okta" />` — live sync status + last evidence timestamp
  - `<ControlTrendGraph controlId="SOC2-CC6.1" />` — 30-day evidence recency chart

**Privacy Guardrails:**

- Never expose: PII, credentials, internal IPs, employee names, customer lists, confidential policy text
- Anonymize: Actor becomes `user-abc123`, source becomes `okta-integration-1`
- Aggregate: "147 evidence items in last 30 days" (not itemized access logs)
- Time-delay: Incidents hidden for 30 days from public timeline (internal compliance team sees immediately)
- Tenant control: Per-control visibility toggle — admin can mark controls as "private" (excluded from public timeline)

**Success Metrics:**

- Trust Center page views → demo request conversion rate
- Time spent on evidence timeline (engagement signal)
- Prospect self-qualification rate (reduced unqualified demos)

---

### Phase 11: Interactive Credibility & Programmatic Verification

**Objective:** Enable prospects to embed AtlasIT trust widgets in their procurement workflows and verify claims programmatically.

**Features:**

1. **Embeddable Compliance Widgets**
   - Framework-specific: `<iframe src="/trust/atlasit/widget/soc2" />`
   - Control-specific: `<iframe src="/trust/atlasit/widget/SOC2-CC6.1" />`
   - Live-updating score badges: `<img src="/api/v1/trust/atlasit/badge/soc2.svg" />`
   - Custom branding: tenant logo + colors
   - Responsive: mobile-optimized, dark mode support

2. **Trust Verification API**
   - Public read-only API for programmatic trust checks
   - `GET /api/v1/trust/:slug/verify` — returns framework scores + evidence count + last audit timestamp
   - `GET /api/v1/trust/:slug/verify/:framework` — framework-specific score + control breakdown
   - Response includes: score, controls_pass, controls_fail, last_evidence_at, cert_expiry (if applicable)
   - Cacheable (300s TTL) with `ETag` for conditional requests
   - Rate limit: 600 requests/hour per API key

3. **Webhook Notifications on Score Changes**
   - Prospect subscribes to webhook: `POST /api/v1/trust/:slug/subscribe`
   - Receives notifications when: framework score drops >5%, control regresses (verified → in_progress), cert expires in 30 days
   - Use case: Prospect's procurement team gets alerted if vendor's SOC 2 compliance degrades mid-contract
   - Webhook payload: `{ tenant_slug, framework, old_score, new_score, changed_controls[], timestamp }`

4. **Trust Center Analytics Dashboard**
   - Admin view: `/console/settings/trust/analytics`
   - Visitor tracking: unique visitors, page views, avg time on page, geographic distribution
   - Widget embed analytics: which companies embedded our widgets, CTR on badge clicks
   - Evidence timeline engagement: most viewed controls, most filtered frameworks
   - Conversion funnel: trust page view → NDA request → demo scheduled → closed deal

5. **Trust Score Change History**
   - Public changelog: `/trust/:slug/changelog`
   - Shows: framework score changes over time (graph + table)
   - Transparency: "SOC2 score dropped from 92% → 87% on 2026-04-15 due to Okta sync outage (resolved 2026-04-16)"
   - Incident disclosure (30-day delay): "CC6.1 failed for 3 days (AWS IAM role rotation delay) — remediated 2026-03-20"

**Technical Implementation:**

- Widget endpoint: `GET /api/v1/trust/:slug/widgets/:widget_type`
  - Returns embeddable HTML + inline CSS (no external dependencies)
  - CSP-friendly: no unsafe-inline, all scripts in separate .js bundle
  - Widget types: `framework_score`, `control_status`, `evidence_count`, `adapter_health`, `cert_badge`

- Webhook registry table:

  ```sql
  CREATE TABLE trust_webhooks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    subscriber_email TEXT NOT NULL,
    subscriber_company TEXT,
    webhook_url TEXT NOT NULL,
    events TEXT NOT NULL, -- JSON array: ["score_drop", "cert_expiry", "control_regression"]
    status TEXT DEFAULT 'active', -- active | paused | failed
    created_at TEXT NOT NULL,
    last_triggered_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );
  ```

- Analytics ingestion: Write to `trust_center_visitors` table on page view (IP hash, user agent, referrer, timestamp)
- Privacy: GDPR-compliant (no PII storage, 90-day retention, anonymized IP hashing)

**Success Metrics:**

- Widget embed adoption (companies embedding AtlasIT trust widgets)
- API verification requests (prospects programmatically checking vendor compliance)
- Webhook subscriber count (procurement teams monitoring vendor compliance)
- Trust page → demo conversion rate

---

### Phase 12: Collaborative Assurance & Buyer Enablement

**Objective:** Transform Trust Center from one-way disclosure into a collaborative workspace where prospects ask questions and get evidence-backed answers.

**Features:**

1. **Visitor Questions → Evidence Mapping**
   - Prospect asks: "How do you handle employee offboarding?"
   - AI maps question → relevant controls (SOC2-CC6.1, ISO27001-A.9.2.6, HIPAA-164.312(d))
   - Displays: control descriptions + evidence count + last verified timestamp + sample anonymized evidence
   - Response generated from Questionnaire AI (already exists in Phase 9 Questionnaire AI skeleton)
   - Admin review queue: tenant can review/edit AI responses before publishing

2. **Audit Trail Sharing (Time-Limited Signed URLs)**
   - NDA-gated evidence bundles (Phase 9 pending feature)
   - Prospect requests: "Show me Okta directory sync evidence for Q1 2026"
   - Admin approves → signed URL valid for 7 days
   - Evidence bundle includes: filtered `compliance_evidence` rows, R2 immutable audit trail references, SHA-256 content hashes
   - Watermarked PDF export with recipient name + timestamp
   - Access log: tenant sees who viewed what evidence + timestamp

3. **Multi-Framework Comparison View**
   - `/trust/:slug/compare` — side-by-side framework comparison
   - Shows: overlapping controls (SOC2-CC6.1 = ISO27001-A.9.2.1 = NIST-CSF-PR.AC-1)
   - Evidence reuse visualization: "1 evidence item satisfies 3 controls across 2 frameworks"
   - Gap analysis: "You have SOC 2 Type 2, but missing 12 controls for ISO 27001 certification"

4. **Security Questionnaire Integration**
   - Import SIG Lite / CAIQ / custom questionnaires (CSV/XLSX upload)
   - Auto-map questions → controls using Questionnaire AI
   - Generate draft responses from evidence + policy documents
   - Export to PDF/DOCX with evidence references
   - Version control: track questionnaire responses over time (Q1 2026 vs. Q4 2025 comparison)

5. **Shared Compliance Workspace**
   - Invite external auditors / prospects to view-only workspace
   - Time-limited access (30/60/90 days)
   - Granular permissions: framework-level, control-level, evidence-level access
   - Audit log: track every view/download by external party
   - Collaboration: prospect can leave comments ("Need more detail on data encryption at rest")

**Technical Implementation:**

- Question mapping endpoint: `POST /api/v1/trust/:slug/ask`
  - Input: `{ question: "How do you handle offboarding?" }`
  - Groq/Claude API with RAG: embed question → vector search in `compliance_evidence` + policy documents
  - Output: `{ controls: [...], evidence_count, last_verified, ai_response, references: [...] }`

- Signed URL generation:

  ```typescript
  async function generateSignedEvidenceURL(
    tenantId: string,
    filters: EvidenceFilters,
    expiresIn: number,
  ): Promise<string> {
    const payload = { tenantId, filters, exp: Date.now() + expiresIn };
    const signature = await hmacSign(payload, SECRET_KEY);
    return `/api/v1/trust/${tenantId}/evidence/export?token=${signature}`;
  }
  ```

- Questionnaire importer: Parse CSV/XLSX → detect columns (question, section, category) → map to controls using embeddings + keyword matching

**Success Metrics:**

- Questions asked per prospect (engagement depth)
- NDA approval → deal close rate
- Evidence bundle download → demo scheduled conversion
- Time saved in security review (measured via prospect survey)

---

### Phase 13: Market Intelligence & Competitive Positioning

**Objective:** Position AtlasIT tenants relative to industry peers using anonymized aggregate benchmarking data.

**Features:**

1. **Industry Benchmark Scores**
   - Anonymized aggregate: "Your SOC 2 score (87%) is in the top 25% of SaaS companies (50–200 employees)"
   - Framework adoption rates: "68% of fintech companies have ISO 27001 certification"
   - Control coverage heatmap: "Most SaaS companies fail SOC2-CC7.2 (encryption at rest) in first year"
   - Evidence velocity benchmarks: "Top 10% of companies generate 500+ evidence items/month (you: 342/month)"

2. **Competitive Trust Badges**
   - "Top 10% in SaaS Security" badge (public display on Trust Center)
   - "Fastest Time to SOC 2 Compliance" badge (if tenant achieved SOC 2 in <6 months)
   - "Zero Security Incidents (12 months)" badge
   - "Real-Time Compliance Leader" badge (evidence recency <24h across all controls)

3. **Peer Comparison Widgets**
   - Embeddable: `<iframe src="/trust/atlasit/widget/benchmark/soc2" />`
   - Shows: tenant score vs. industry median (anonymized)
   - Use case: "We're in the top 15% of SaaS companies for access control compliance"

4. **Compliance Gap Recommendations**
   - AI-driven: "Companies similar to you typically implement MFA enforcement within 3 months"
   - Evidence-based: "Tenants with Okta + Google Workspace achieve 12% higher SOC2-CC6 scores"
   - Adapter recommendations: "Adding AWS adapter would satisfy 8 additional NIST CSF controls"

5. **Trust Center Marketplace Listings**
   - Public directory: `atlasit.pro/trust-directory`
   - Opt-in: tenants can list their Trust Center in searchable directory
   - Filters: industry, framework certifications, company size, evidence velocity
   - Use case: Buyers search "SOC 2 Type 2 certified fintech companies with ISO 27001"
   - Social proof: "1,200+ companies trust AtlasIT for compliance automation"

**Technical Implementation:**

- Benchmark calculation:

  ```sql
  SELECT framework, AVG(score) AS median_score, PERCENTILE_CONT(0.75) AS p75_score, PERCENTILE_CONT(0.90) AS p90_score
  FROM compliance_scores
  WHERE industry = ? AND company_size = ?
  GROUP BY framework;
  ```

- Badge eligibility logic:
  - Top 10%: score >= p90 benchmark
  - Zero incidents: no `incidents` table rows with `severity >= medium` in last 365 days
  - Real-time leader: `MAX(age(compliance_evidence.created_at)) <= 24 hours` across all frameworks

- Trust directory API: `GET /api/v1/trust-directory?industry=fintech&frameworks=SOC2,ISO27001&size=50-200`

**Privacy Guardrails:**

- All benchmarks are anonymized aggregates (never expose individual tenant data)
- Require minimum cohort size (N >= 10) for benchmark calculations
- Tenants can opt out of benchmark inclusion (default: opt-in)
- Marketplace listing requires explicit tenant consent

**Success Metrics:**

- Trust Center marketplace listing → inbound demo requests
- Competitive badge display → prospect conversion rate
- Benchmark widget embeds (social proof signal)

---

## Private → Public Data Flow

### Data Sources (Private)

1. **Adapter Evidence** — real-time operational events from 35 connected apps
   - Okta: directory sync (users, groups, roles), MFA status, SSO sessions
   - Google Workspace: OAuth grants, admin audit logs, drive permissions
   - GitHub: repository access, branch protections, commit signatures
   - AWS: IAM policies, S3 bucket encryption, CloudTrail logs
   - M365: mailbox access, conditional access policies, DLP rules

2. **JML Engine** — joiner/mover/leaver lifecycle events
   - Onboarding: provisioned accounts, assigned groups, MFA enrollment
   - Transfers: role changes, access reviews triggered, department moves
   - Offboarding: revoked credentials, archived mailboxes, wiped devices

3. **Policy Documents** — R2 stored tenant policies
   - Access control policy, incident response plan, data retention policy
   - Signed attestations from executives (CEO, CTO, DPO)

4. **Compliance Evidence Table** — classified evidence with control tags
   - Event type, source adapter, actor, subject, impact, confidence, SHA-256 content hash
   - Control mappings: which frameworks + control IDs this evidence satisfies

5. **Audit Logs** — all tenant activity (admin actions, user logins, config changes)

### Transformation (Privacy Layer)

**Anonymization Pipeline:**

1. **Strip PII**
   - Remove: employee names, email addresses, internal IP addresses, phone numbers, SSNs
   - Hash: actor IDs (user-abc123), resource IDs (repo-xyz789)
   - Redact: policy text containing confidential business logic, customer lists

2. **Aggregate Counts**
   - "147 evidence items in last 30 days" (not itemized list)
   - "23 active integrations" (not which specific apps)
   - "342 users onboarded in Q1 2026" (not names)

3. **Time Delays**
   - Incidents: 30-day embargo before public disclosure
   - Adapter failures: 24-hour delay before surfacing on public trust page
   - Policy changes: effective immediately internally, 7-day delay for public changelog

4. **Confidence Scoring**
   - Low confidence evidence (<0.6) excluded from public timeline
   - Stale evidence (>90 days) marked with warning icon
   - Adapter health: "last sync 3 hours ago" (not exact timestamp of each sync)

**Public Outputs:**

1. **Framework Scores** — weighted aggregate across all controls
   - SOC 2: 87% (23 pass, 4 fail, 3 unknown)
   - ISO 27001: 92% (54 pass, 2 fail, 8 unknown)

2. **Evidence Recency** — per-control "last verified" timestamps
   - SOC2-CC6.1: verified 2 hours ago ✓
   - SOC2-CC7.2: in_progress (last evidence 31 days ago) ⚠️

3. **Adapter Health** — anonymized sync status
   - "23 integrations connected, 22 synced in last 24h, 1 error"
   - "Okta: synced 2 hours ago ✓"
   - "GitHub: failed 3 sync attempts (API rate limit) — retrying in 45m ⚠️"

4. **Anonymized Evidence Timeline**
   - "user-abc123 granted admin role in okta-integration-1 → SOC2-CC6.1 positive (confidence: 0.92)"
   - "repo-xyz789 branch protection enabled → SOC2-CC7.1 positive (confidence: 0.88)"

5. **Control Trend Graphs** — 30-day sparkline of evidence recency
   - Visual staleness indicators (green <24h, yellow <7d, red >30d)

### Privacy Guardrails Summary

| Data Type            | Private (Internal)         | Public (Trust Center)              |
| -------------------- | -------------------------- | ---------------------------------- |
| **Employee names**   | Full names                 | Anonymized actor IDs (user-abc123) |
| **Email addresses**  | joe@acme.com               | Redacted                           |
| **Internal IPs**     | 10.0.1.45                  | Redacted                           |
| **Credentials**      | API keys, passwords        | Never exposed                      |
| **Customer lists**   | Acme Corp, WidgetCo        | Redacted                           |
| **Policy text**      | Full confidential policies | High-level summaries only          |
| **Incident details** | Full root cause analysis   | 30-day delayed summary (no PII)    |
| **Evidence count**   | 1,842 items                | Aggregated (147 in last 30 days)   |
| **Adapter status**   | Exact sync timestamps      | Relative time (2 hours ago)        |
| **Control evidence** | Full audit trail with PII  | Anonymized event type + impact     |

**Compliance:** GDPR Article 25 (data minimization), CCPA (no sale of personal data), SOC 2 (privacy controls)

---

## Technical Architecture

### New Database Tables

```sql
-- Public evidence view (anonymized, privacy-filtered)
CREATE TABLE trust_evidence_public (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  framework TEXT NOT NULL,
  control_id TEXT NOT NULL,
  category TEXT NOT NULL, -- access_grant, policy_change, adapter_pull, etc.
  impact TEXT NOT NULL, -- positive, detrimental, neutral
  confidence REAL NOT NULL,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  anonymized_actor TEXT, -- user-abc123
  anonymized_source TEXT, -- okta-integration-1
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX idx_trust_evidence_public_tenant_framework ON trust_evidence_public(tenant_id, framework, created_at DESC);

-- Visitor analytics (GDPR-compliant, anonymized)
CREATE TABLE trust_center_visitors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL, -- SHA-256 hash of IP (anonymized)
  user_agent_hash TEXT NOT NULL,
  referrer TEXT,
  page_path TEXT NOT NULL, -- /trust/atlasit, /trust/atlasit/evidence, etc.
  session_duration_ms INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX idx_trust_visitors_tenant_date ON trust_center_visitors(tenant_id, created_at DESC);

-- Webhook subscriptions (prospect monitoring)
CREATE TABLE trust_webhooks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  subscriber_email TEXT NOT NULL,
  subscriber_company TEXT,
  webhook_url TEXT NOT NULL,
  events TEXT NOT NULL, -- JSON array: ["score_drop", "cert_expiry", "control_regression"]
  status TEXT DEFAULT 'active', -- active | paused | failed
  secret TEXT NOT NULL, -- HMAC signature secret
  created_at TEXT NOT NULL,
  last_triggered_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Benchmark data (anonymized aggregates)
CREATE TABLE trust_benchmarks (
  id TEXT PRIMARY KEY,
  framework TEXT NOT NULL,
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL, -- 1-50, 51-200, 201-1000, 1000+
  median_score REAL NOT NULL,
  p75_score REAL NOT NULL,
  p90_score REAL NOT NULL,
  sample_size INTEGER NOT NULL, -- cohort size for benchmark calculation
  calculated_at TEXT NOT NULL
);
CREATE INDEX idx_trust_benchmarks_framework_industry ON trust_benchmarks(framework, industry, company_size);

-- Trust badge eligibility
CREATE TABLE trust_badges (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  badge_type TEXT NOT NULL, -- top_10_security, zero_incidents, realtime_leader, fastest_soc2
  earned_at TEXT NOT NULL,
  expires_at TEXT, -- NULL for permanent badges
  visible BOOLEAN DEFAULT TRUE, -- tenant can hide badges
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX idx_trust_badges_tenant ON trust_badges(tenant_id, badge_type);

-- Trust directory listings (opt-in public marketplace)
CREATE TABLE trust_directory_listings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  company_size TEXT NOT NULL,
  frameworks TEXT NOT NULL, -- JSON array: ["SOC2", "ISO27001"]
  description TEXT, -- short pitch (max 280 chars)
  logo_url TEXT,
  website_url TEXT,
  visible BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX idx_trust_directory_industry_frameworks ON trust_directory_listings(industry, frameworks);
```

### New API Endpoints

**Phase 10: Evidence Transparency**

- `GET /api/v1/trust/:slug/evidence/timeline`
  - Query params: `framework`, `controlId`, `category`, `impact`, `since`, `limit`, `offset`
  - Returns: Paginated anonymized evidence items with privacy filters applied
  - Rate limit: 60 requests/hour per IP

- `GET /api/v1/trust/:slug/adapters/health`
  - Returns: Live sync status for all connected integrations (anonymized)
  - Format: `{ adapters: [{ slug, last_sync_at, status, error_count }] }`

- `GET /api/v1/trust/:slug/controls/:controlId/trend`
  - Returns: 30-day evidence recency sparkline data
  - Format: `{ dates: [...], evidence_counts: [...], statuses: [...] }`

**Phase 11: Interactive Credibility**

- `GET /api/v1/trust/:slug/widgets/:widget_type`
  - Widget types: `framework_score`, `control_status`, `evidence_count`, `adapter_health`, `cert_badge`
  - Returns: Embeddable HTML + inline CSS (CSP-friendly)

- `GET /api/v1/trust/:slug/verify`
  - Returns: Framework scores + evidence count + last audit timestamp
  - Cacheable (300s TTL) with `ETag` support

- `POST /api/v1/trust/:slug/webhooks/subscribe`
  - Body: `{ email, company, webhook_url, events: ["score_drop", "cert_expiry"] }`
  - Returns: Webhook ID + HMAC secret

- `GET /api/v1/trust/:slug/analytics` (admin-only, requires auth)
  - Returns: Visitor stats, widget embeds, evidence timeline engagement

**Phase 12: Collaborative Assurance**

- `POST /api/v1/trust/:slug/ask`
  - Body: `{ question: "How do you handle offboarding?" }`
  - Returns: Mapped controls + evidence count + AI-generated response + references

- `GET /api/v1/trust/:slug/evidence/export?token=<signed>`
  - Time-limited signed URL (7-day expiry)
  - Returns: Filtered evidence bundle (JSON or watermarked PDF)

- `POST /api/v1/trust/:slug/questionnaire/import`
  - Body: CSV/XLSX file (SIG Lite, CAIQ, custom)
  - Returns: Parsed questions + auto-mapped controls

**Phase 13: Market Intelligence**

- `GET /api/v1/trust/:slug/benchmark/:framework`
  - Returns: Tenant score vs. industry median/p75/p90 (anonymized)

- `GET /api/v1/trust-directory`
  - Query params: `industry`, `frameworks`, `size`, `limit`, `offset`
  - Returns: Paginated public trust center listings

### UI Components

**Phase 10:**

- `<TrustTimeline framework="SOC2" />` — Animated evidence stream with real-time updates
- `<AdapterHealthCard slug="okta" />` — Live sync status badge
- `<ControlTrendGraph controlId="SOC2-CC6.1" />` — 30-day evidence recency sparkline
- `<EvidenceRecencyHeatmap />` — Framework × control category matrix (color-coded by age)

**Phase 11:**

- `<EmbeddableWidget type="framework_score" framework="SOC2" />` — Iframe-ready widget
- `<TrustBadge variant="live" size="lg" />` — Real-time updating badge with animation
- `<ComplianceScoreCard framework="ISO27001" showTrend />` — Score + 30-day trend line
- `<WebhookSubscribeForm />` — Prospect webhook subscription form

**Phase 12:**

- `<QuestionMapper />` — AI-powered question → control mapping interface
- `<EvidenceBundleExporter />` — NDA-gated evidence export UI (admin approval workflow)
- `<SharedWorkspace />` — External auditor/prospect view-only dashboard
- `<QuestionnaireImporter />` — CSV/XLSX upload + auto-mapping UI

**Phase 13:**

- `<BenchmarkScoreCard framework="SOC2" />` — Tenant vs. industry comparison
- `<TrustBadgeShowcase />` — Display earned badges (top 10%, zero incidents, etc.)
- `<TrustDirectoryCard />` — Public marketplace listing card
- `<ComplianceGapAnalyzer />` — AI-driven recommendations for framework certification

---

## Success Metrics

### Phase 10: Evidence Transparency

- Trust Center page views → demo request conversion rate: **target 8%** (up from current ~3%)
- Time spent on evidence timeline: **target 4+ minutes** (engagement depth signal)
- Prospect self-qualification rate: **target 40%** (reduced unqualified demos)
- Evidence timeline filters used: **target 65%** of visitors (active exploration)

### Phase 11: Interactive Credibility

- Widget embed adoption: **target 200 companies** embedding AtlasIT trust widgets within 6 months
- API verification requests: **target 5,000/month** (prospects programmatically checking vendor compliance)
- Webhook subscriber count: **target 500 subscribers** (procurement teams monitoring vendor compliance)
- Trust page → demo conversion rate: **target 12%** (up from Phase 10's 8%)

### Phase 12: Collaborative Assurance

- Questions asked per prospect: **target 3+ questions** per session (engagement depth)
- NDA approval → deal close rate: **target 45%** (up from industry avg ~25%)
- Evidence bundle download → demo scheduled conversion: **target 60%**
- Time saved in security review: **target 18 days** (measured via prospect survey, industry avg 30–45 days)

### Phase 13: Market Intelligence

- Trust Center marketplace listing → inbound demo requests: **target 15% of inbound leads** from directory
- Competitive badge display → prospect conversion rate: **+6% lift** vs. control group
- Benchmark widget embeds: **target 300 embeds** (social proof signal)
- "Top 10%" badge display → deal close rate: **+12% lift** vs. non-badge tenants

### Overall Trust Center ROI (12-month post-Phase 13)

- **Sales cycle reduction:** 30-45 days → 18-25 days (avg. 40% faster)
- **Unqualified demo reduction:** 60% → 25% (self-service filtering)
- **Customer acquisition cost (CAC) reduction:** -35% (fewer sales touches required)
- **Win rate increase:** +18% (credibility signal vs. competitors with static PDFs)
- **Inbound lead quality:** +50% (self-qualified via trust center exploration)

---

## Competitive Moat

### Why AtlasIT Trust Center > Vanta/Drata

| Dimension              | Vanta/Drata                       | AtlasIT                                                            |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------ |
| **Evidence source**    | Manual uploads + periodic scans   | Adapter-fed live operational events (35 integrations)              |
| **Proof mechanism**    | Self-attestation                  | Adapter-grounded claims (provable via audit trail)                 |
| **Update frequency**   | Weekly/monthly (manual refresh)   | Real-time (evidence flows as operations happen)                    |
| **Audit trail**        | Point-in-time snapshots           | R2 immutable + SHA-256 content hash + full lineage                 |
| **Buyer access**       | PDF exports (sales-gated)         | Self-service evidence access (NDA-gated signed URLs)               |
| **Embeddability**      | Badge only                        | Widgets (framework-specific, control-specific, live-updating)      |
| **Transparency**       | Framework scores + cert badges    | Control-level evidence timeline + adapter health + trend graphs    |
| **Verifiability**      | Static PDF (tamper risk)          | SHA-256 content hash + audit trail API + programmatic verification |
| **Pricing**            | $20k–$70k/year (opaque sales-led) | TBD (transparent self-serve tiers planned Phase 17)                |
| **Market positioning** | GRC compliance tool               | IT automation platform (compliance as byproduct)                   |

### Patentable Innovations

1. **Evidence-grounded compliance scoring** — mapping third-party SaaS adapter events into live compliance state (not manual uploads)
2. **Automated trust center evidence lineage** — immutable R2 audit trail with SHA-256 content hashing + provenance tracking from source adapter → control
3. **Real-time compliance widgets** — embeddable live-updating framework/control scores (not static badges)
4. **Continuous evidence pipeline visualization** — public timeline of anonymized operational evidence feeding compliance controls
5. **Adapter health → compliance state mapping** — surfacing adapter sync failures as compliance regression indicators

---

## Risks & Mitigations

### Risk 1: Privacy Violations (Accidental PII Exposure)

**Mitigation:**

- Automated PII detection: scan all public evidence for email patterns, SSNs, phone numbers before display
- Manual review queue: admin must approve first 50 evidence items before auto-publishing enabled
- Privacy budget: limit evidence detail level (category + impact only, no full event payloads)
- GDPR compliance: 90-day retention on visitor analytics, anonymized IP hashing, right-to-be-forgotten API

### Risk 2: Competitor Scraping (Intelligence Gathering)

**Mitigation:**

- Rate limiting: 60 requests/hour per IP on public trust endpoints
- Authentication for detailed views: evidence timeline summary is public, full detail requires NDA approval
- Honeypot evidence: inject fake low-confidence evidence to detect scraping patterns
- Visibility controls: tenant can mark entire frameworks or specific controls as "private"

### Risk 3: Certification Body Pushback (Public Compliance Claims)

**Mitigation:**

- Disclaimer: "AtlasIT Trust Center displays internal compliance posture. Official certifications require third-party audit."
- Cert badge gating: only display SOC 2 / ISO 27001 badges after audit report uploaded + expiry date verified
- Auditor PDF export: clear labeling "Internal compliance report — not a substitute for SOC 2 Type 2 audit report"
- Legal review: all public claims reviewed by compliance counsel before Phase 10 launch

### Risk 4: False Confidence (Over-Reliance on Automation)

**Mitigation:**

- Confidence scoring: display confidence % per evidence item (0.6–1.0 range)
- Staleness warnings: visual indicators when evidence >30 days old
- Manual attestation promotion: "verified" status requires executive sign-off (not just automated evidence)
- Control implementation detail: public timeline shows evidence recency, not full implementation proof

### Risk 5: Customer Incidents Become Public (Reputation Risk)

**Mitigation:**

- 30-day embargo: incidents hidden from public timeline for 30 days (internal compliance team sees immediately)
- Severity filtering: only display medium+ severity incidents (low-severity auto-filtered)
- Tenant opt-out: tenant can disable entire Trust Center with one toggle
- Incident disclosure transparency: show resolved incidents with "remediated" badge (demonstrates maturity)

---

## Roadmap Dependencies

### Prerequisites (Must Complete Before Phase 10)

1. **Phase 9 NDA Workflow** (2 days) — table exists, endpoint implementation needed
2. **Phase 9 Questionnaire AI Lambda Port** (3 days) — skeleton exists, needs compliance-api wiring
3. **Evidence Pipeline Validation** (2 hours) — verify orchestrator SQS consumer processes events end-to-end

### Parallel Tracks (Can Build Concurrently)

- **Phase 10 Evidence Timeline** (5 days) — new API endpoints + UI components
- **Phase 11 Widgets** (4 days) — embeddable iframe + badge generation
- **Phase 12 Question Mapper** (6 days) — RAG pipeline + Groq/Claude API integration
- **Phase 13 Benchmarks** (7 days) — anonymized aggregate calculations + badge eligibility logic

### Post-MVP Expansions (Phase 17+)

- **Transparent self-serve pricing** — free tier (SaaS discovery + compliance assessment) + paid tiers (Trust Center features)
- **Plugin API** — third-party compliance packs (custom frameworks beyond SOC 2/ISO/NIST/HIPAA/GDPR)
- **Trust Center marketplace** — public directory of AtlasIT customers (opt-in social proof)

---

## Next Steps

1. **User Research** (1 week) — interview 10 enterprise buyers to validate Phase 10–13 feature priorities
2. **Design Mockups** (1 week) — Figma wireframes for evidence timeline, widgets, question mapper
3. **Technical Spike** (3 days) — prototype anonymization pipeline + privacy filter logic
4. **Legal Review** (1 week) — compliance counsel approval for public evidence disclosure approach
5. **Phase 9 Completion** (5 days) — ship NDA workflow + Questionnaire AI Lambda port (unblocks Phase 10)
6. **Phase 10 MVP** (2 weeks) — evidence timeline + adapter health dashboard + control trend graphs

---

## Conclusion

AtlasIT's Trust Center evolution from static compliance snapshot to **real-time compliance dashboard** creates a defensible competitive moat through:

1. **Adapter-grounded evidence** — provable claims (not self-attestation)
2. **Immutable audit trail** — R2 + SHA-256 content hashing (tamper-evident)
3. **Self-service buyer enablement** — NDA-gated evidence access + embeddable widgets
4. **Programmatic verification** — API for security teams to monitor vendor compliance continuously
5. **Market intelligence** — anonymized benchmarking positions tenants as compliance leaders

This strategic vision positions AtlasIT to capture the **$15B+ GRC market** by offering the first truly live, evidence-backed trust center — replacing static PDFs with living compliance proof that shortens sales cycles by 40% and increases win rates by 18%.

**Next session:** Begin Phase 9 completion (NDA workflow + Questionnaire AI Lambda port) to unblock Phase 10 evidence transparency rollout.
