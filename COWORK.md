# COWORK.md — Dual-Agent Coordination

**Project:** AtlasIT (`/home/andrey_k/Project-AtlasIT`)
**Last updated:** 2026-03-18

Two agents are working simultaneously toward MVP. This file is the shared task queue.
Both agents **must** check this file before starting any task to avoid conflicts.

---

## Agents

| ID | Agent | Model | Focus |
|----|-------|-------|-------|
| `CC` | Claude Code | claude-sonnet-4-6 | Backend: workers, D1, API routes, compliance engine, orchestrator |
| `OC` | OpenClaw | gpt-5.3-codex | Frontend: SvelteKit UI, console pages, access reviews UI, trust center |

## Branch Convention

- Claude Code: `cc/<slug>` (e.g. `cc/access-reviews-api`)
- OpenClaw: `oc/<slug>` (e.g. `oc/access-reviews-ui`)

## How to Claim a Task

1. Find a `[ ]` task below
2. Change it to `[CC]` or `[OC]` and add timestamp: `[CC 2026-03-18T10:00Z]`
3. Create your branch: `git checkout -b cc/<slug>` or `oc/<slug>`
4. When done: change to `[DONE CC]` + PR number

**Rule:** Never touch files owned by the other agent's in-progress task. When in doubt, pick a different task.

---

## Phase 6 — Contract Stability (Complete This First)

| Status | Owner | Task | Files |
|--------|-------|------|-------|
| `[CC 2026-03-18T10:05Z]` | CC | Normalize error handling in all workers: no raw HTML/JSON crashes surfaced to UI; wrap in `{ error, code, message }` envelope | `ai-orchestrator/src/`, `compliance-worker/src/`, `core-api/src/` |
| `[CC 2026-03-18T10:05Z]` | CC | Startup-failing assertions for missing prod secrets (`CRED_ENCRYPTION_KEY`, D1 bindings, `EVENT_SOURCE_SECRETS`) | all worker `src/index.ts` entry points |
| `[CC 2026-03-18T10:05Z]` | CC | CF Access JWT signing key rotation readiness — dynamic JWKS fetch, not hard-pinned public key | `packages/shared/src/auth/` |
| `[CC 2026-03-18T10:05Z]` | CC | Slack webhook verification: implement Slack's replay-window signature algorithm (`X-Slack-Request-Timestamp` + `X-Slack-Signature`) | `adapters/slack/src/` |

---

## Phase 7 — Compliance-as-Automation (Strategic Moat)

| Status | Owner | Task | Files |
|--------|-------|------|-------|
| `[DONE CC]` | CC | Apply `compliance_evidence` migrations to both DBs (PR #172) | DB only |
| `[DONE CC]` | CC | `emitComplianceEvidence()` → update `tenant_preferences.compliance_controls` to `implemented` (PR #172) | `ai-orchestrator/src/lib/automation-evaluator.ts` |
| `[ ]` | CC | Pull evidence from adapters: GitHub branch protection status, MFA enforcement status (Google Workspace) | `adapters/github/src/`, `adapters/google-workspace/src/` |
| `[ ]` | CC | Expand CDT rules in `compliance-worker`: cover all SOC2 CC6.x + CC7.x + ISO27001 A.9.x controls with real Rego evaluation logic | `compliance-worker/src/modules/policies/` |
| `[ ]` | OC | Compliance UI: live evidence timeline on compliance page (show recent evidence events with source/actor/timestamp) | `console-app/src/routes/console/compliance/` |
| `[ ]` | OC | Compliance score history chart (sparkline: score over last 30 days) | `console-app/src/routes/console/compliance/` |

---

## Phase 8 — Access Reviews (Table Stakes for IGA)

| Status | Owner | Task | Files |
|--------|-------|------|-------|
| `[DONE CC #173]` | CC | D1 migration: `access_review_campaigns`, `access_review_items`, `access_review_decisions` tables | new migration file `migrations/0021_access_reviews.sql` |
| `[DONE CC #173]` | CC | API routes for access reviews: `GET/POST /api/access-reviews`, `GET /api/access-reviews/:id/items`, `POST /api/access-reviews/:id/decisions` | `console-app/src/routes/api/access-reviews/` |
| `[DONE CC #173]` | CC | Auto-revoke logic: after campaign expires with unreviewed items, revoke access via adapter | `ai-orchestrator/src/lib/access-review-auto-revoke.ts` |
| `[DONE CC #173]` | CC | New automation action type `request_access_review` — trigger a review campaign from a rule | `packages/shared/src/automation/types.ts`, `ai-orchestrator/src/lib/automation-evaluator.ts` |
| `[DONE OC #174]` | OC | Access Reviews UI: campaign list page with status/progress indicators | `console-app/src/routes/console/access-reviews/` |
| `[DONE OC #174]` | OC | Access Review detail: manager-facing approve/revoke per user+app row | `console-app/src/routes/console/access-reviews/[id]/` |
| `[DONE OC #174]` | OC | Add "Access Reviews" nav item to console sidebar | `console-app/src/lib/components/Sidebar.svelte` (or equivalent) |

---

## Phase 9 — Trust Center

| Status | Owner | Task | Files |
|--------|-------|------|-------|
| `[CC 2026-03-18T11:25Z]` | CC | `GET /api/trust/[slug]` server route: return public framework scores + evidence count + connected integrations | `console-app/src/routes/api/trust/[slug]/+server.ts` |
| `[CC 2026-03-18T11:25Z]` | CC | Tenant trust center settings: `PATCH /api/trust/settings` (what's public) | `console-app/src/routes/api/trust/settings/+server.ts` |
| `[ ]` | OC | Trust Center public page `/trust/[slug]` — framework score cards, evidence count, last audit date, connected app logos | `console-app/src/routes/trust/[slug]/+page.svelte` |
| `[ ]` | OC | Trust Center settings panel in console (control public visibility per framework) | `console-app/src/routes/console/settings/trust/` |

---

## Shared Contracts (read before writing)

### Access Review DB Schema
```sql
-- campaigns
CREATE TABLE access_review_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'all', -- 'all' | 'app:<id>' | 'department:<name>'
  status TEXT NOT NULL DEFAULT 'draft', -- draft | active | completed | expired
  reviewer_policy TEXT NOT NULL DEFAULT 'manager', -- 'manager' | 'owner' | 'peer'
  due_date TEXT,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- items (one per user+app pair within a campaign)
CREATE TABLE access_review_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT,
  app_id TEXT NOT NULL,
  app_name TEXT,
  role TEXT,
  reviewer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | revoked | skipped
  decided_at TEXT,
  decided_by TEXT,
  notes TEXT,
  FOREIGN KEY (campaign_id) REFERENCES access_review_campaigns(id)
);

-- decisions log
CREATE TABLE access_review_decisions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  decision TEXT NOT NULL, -- 'approved' | 'revoked'
  decided_by TEXT NOT NULL,
  decided_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  FOREIGN KEY (item_id) REFERENCES access_review_items(id)
);
```

### Trust Center API Response Shape
```typescript
interface TrustCenterPublic {
  tenant: { name: string; slug: string; logoUrl?: string };
  lastAuditDate: string;
  frameworks: Array<{
    name: string;
    score: number; // 0-100
    controlsImplemented: number;
    controlsTotal: number;
  }>;
  connectedApps: Array<{ name: string; logoUrl: string }>;
  evidenceCount: number;
  isPublic: boolean;
}
```

---

## Communication Log

Leave a note here when you start/finish a major task or hit a blocker.

| Time | Agent | Note |
|------|-------|------|
| 2026-03-18T10:00Z | CC | Coordination system initialized. Starting Phase 6 error handling. |
| 2026-03-18T10:57Z | OC | Claimed Phase 8 Access Reviews campaign list UI task. Started `oc/access-reviews-ui` with progress/status indicators + tests. |
| 2026-03-18T11:16Z | OC | Claimed and implemented Phase 8 detail page + sidebar nav item. Waiting on CC API merge for end-to-end wiring pass. |
| 2026-03-18T11:20Z | OC | Rebased on main after CC PR #173 merge, completed API alignment pass, and opened OC UI PR #174. Phase 8 OC tasks marked DONE. |
| 2026-03-18T11:25Z | CC | Phase 8 CC tasks marked DONE. Bridge live. Claiming Phase 9 Trust Center API tasks — starting cc/trust-center-api. |

