# AtlasIT Demo Script

## Pre-Demo Checklist

- [ ] Open https://www.atlasit.pro/login in Chrome (incognito recommended)
- [ ] Log in with demo credentials (check 1Password: "AtlasIT Demo Login")
- [ ] Verify dark mode is active (default)
- [ ] Confirm sidebar shows "AtlasIT" org name
- [ ] Compliance score pill visible in topbar

## Demo Click-Path

### 1. Login -> Dashboard (30s)

**URL:** `/console`

**Talking Points:**

- Single-pane view: compliance score, recent events, connected apps, active automations
- Real-time compliance score in the topbar header (updates every 60s)
- Evidence feed widget shows latest compliance evidence collected from integrations
- Stats: evidence items, automation rules (enabled/total), open incidents

**What to Show:**

- Compliance score pill in header (color-coded: green/yellow/red)
- Dashboard stat cards
- Recent events timeline

---

### 2. Directory (30s)

**URL:** `/console/directory`

**Talking Points:**

- User directory synced from identity providers (Okta, Azure AD, Google Workspace)
- User lifecycle tracking: active, suspended, deactivated
- Group membership visible per user
- Foundation for access reviews and JML automation

**What to Show:**

- Users tab: list of synced users with status badges
- Click a user to see detail (groups, role, last login)

---

### 3. Compliance Overview (45s)

**URL:** `/console/compliance`

**Talking Points:**

- Multi-framework compliance dashboard: SOC 2, ISO 27001, NIST CSF, HIPAA, GDPR
- Evidence-grounded scoring: not just checkboxes, but actual adapter data
- Score trend tracking over time
- Gap analysis: which controls need attention

**What to Show:**

- Framework cards with scores and grades
- Score trend chart (upward trajectory)
- Click into a framework for control-level detail

---

### 4. Compliance Packs (30s)

**URL:** `/console/compliance/packs`

**Talking Points:**

- Pre-built compliance packs with control mappings
- Each pack maps to real controls with pass/fail status
- One-click adoption: enable a pack and controls auto-populate
- Cross-framework mapping: one control can satisfy multiple frameworks

**What to Show:**

- Pack cards with framework badges
- Control count per pack
- Pass/fail status indicators

---

### 5. Policies (45s)

**URL:** `/console/policies`

**Talking Points:**

- AI-assisted policy generation based on your compliance frameworks
- Draft -> Published -> Archived lifecycle
- Policies are evidence items: they feed into compliance scoring
- Version tracking and approval workflow

**What to Show:**

- Policy list with status badges (published/draft)
- Click a policy to view content
- "Generate Policy" button (mention AI generation capability)

---

### 6. Automation Rules (30s)

**URL:** `/console/automation`

**Talking Points:**

- Event-driven automation: when X happens, do Y
- Rules fire on directory events (user join/move/leave), compliance changes, incidents
- Natural language rule builder (powered by AI)
- Execution history with pass/fail tracking

**What to Show:**

- Rules list with enabled/disabled toggles
- Recent execution history tab
- Status badges (completed, failed, pending)

---

### 7. Access Reviews (30s)

**URL:** `/console/access-reviews`

**Talking Points:**

- Periodic access review campaigns
- Reviewers approve/revoke access for each user-resource pair
- Tracks completion percentage
- SOC 2 CC6.1 and ISO 27001 A.9.2.5 evidence

**What to Show:**

- Campaign list with progress bars
- Status: active, completed, draft

---

### 8. Access Requests (15s)

**URL:** `/console/access-requests`

**Talking Points:**

- Self-service access request workflow
- Approval chain with justification tracking
- Integrates with automation rules for auto-approval

**What to Show:**

- Request list with status badges
- Stats: total, pending, approved, denied

---

### 9. Settings (30s)

**URL:** `/console/settings`

**Talking Points:**

- Tenant configuration hub
- General settings: org name, branding (logo, accent color)
- Security: MFA enrollment, SSO (SAML/OIDC), security policy
- Users: invite, role management (owner/admin/member/viewer)
- Billing: plan management, seat tracking

**What to Show:**

- Settings grid with section cards
- Click into Security to show MFA + SSO configuration
- Click into Users to show team management

---

### 10. Marketplace (15s)

**URL:** `/console/marketplace`

**Talking Points:**

- 35+ integrations: Okta, Azure AD, Google Workspace, AWS, Jira, etc.
- One-click connect with OAuth or API key
- Each integration feeds evidence into compliance scoring

**What to Show:**

- App catalog grid
- Category filters
- Connected status indicators

---

### 11. Trust Center (15s)

**URL:** `/trust/atlasit-demo` (public page)

**Talking Points:**

- Public-facing trust center for customers
- Shows compliance status, certifications, policies
- NDA-gated evidence access requests
- Embeddable trust badge

**What to Show:**

- Public trust page with compliance status
- Evidence request form

---

## Known Limitations (What NOT to Click)

1. **Copilot (Sparkles icon)** — Opens AI copilot panel. Works but responses depend on Bedrock API availability. Skip if not pre-warmed.
2. **Evidence Collection "Collect Now"** — Triggers real adapter collection. May timeout without configured adapters.
3. **Workflow execution** — "Run Now" buttons trigger real SQS messages. Safe but may produce confusing processing events.
4. **SSO Test Connection** — Opens IdP login window. Will fail without configured IdP.
5. **Billing Checkout** — Wired to Stripe. Don't click "Upgrade" unless you want to test Stripe checkout.
6. **Admin Panel** — Only visible to super-admin. Contains tenant management and operations dashboard.

## Performance Notes

| Endpoint Group        | Cold Start | Warm Response |
| --------------------- | ---------- | ------------- |
| Core API (/api/v1/\*) | < 3s       | 200-440ms     |
| Compliance API        | < 3s       | 210-440ms     |
| Orchestrator          | < 3s       | 200-410ms     |
| CloudFront (SPA)      | N/A        | < 100ms       |

## Architecture Talking Points (if asked)

- **Multi-tenant**: Every query scoped by tenant_id. Row-level isolation in Aurora PostgreSQL.
- **Event-driven**: SQS queues with DLQ and retry. 5 queue pairs (workflow, policy-rebuild, remediation, risk-recalc, step-tasks).
- **Serverless**: Lambda functions behind API Gateway. Aurora Serverless v2. S3 + CloudFront for SPA.
- **Evidence pipeline**: Adapters collect -> Events -> Compliance scoring -> Dashboard. Immutable once written.
- **35 CloudWatch alarms**: Error rates, 5xx responses, DLQ depth, RDS CPU/connections.
