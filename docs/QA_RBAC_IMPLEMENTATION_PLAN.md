# QA Audit Fixes + Directory, Users, Groups & RBAC Overhaul

## Context

This plan addresses two related workstreams:

1. **QA Audit Fixes** — 16 findings from the QA audit report (`QA audit report generation.pdf`), validated against the current codebase. 11 are still broken, 4 partially fixed, 1 false positive.
2. **Directory/RBAC Overhaul** — The directory page is non-functional for practical use; RBAC guards are missing on most API routes; console users and directory users are disconnected.

---

## QA Audit Findings — Validated Status & Fix Plan

### Root Cause: Snake_case/CamelCase Mismatch (affects QA-004, QA-007, QA-012, QA-015)

The compliance-worker and core-api return raw D1 rows with snake_case column names. The frontend TypeScript types expect camelCase. No DTO mapping layer exists.

**Fix:** Add mapping functions in the proxy API routes that transform snake_case → camelCase before returning JSON.

**Files:**

- `console-app/src/routes/api/incidents/+server.ts` — map `created_at→createdAt`, `resolved_at→resolvedAt`
- `console-app/src/routes/api/access-requests/+server.ts` (or wherever the proxy is) — map `subject_ref→subject`, `created_at→createdAt`
- `console-app/src/routes/api/tenant/users/+server.ts` GET — parse `roles` JSON string, extract first element as `role`
- `console-app/src/routes/api/tenant/dashboard/+server.ts` — map `mappings.confirmed→activeMappings`, `mappings.pending→pendingSuggestions`

### QA-001: Compliance page 500 (Critical) — PARTIALLY FIXED

Page has proper error handling now (Alert, skeleton, fallback). The 500 comes from API layer when `ATLAS_SHARED_DB` binding is missing.

**Remaining fix:** Ensure `ATLAS_SHARED_DB` is bound in Pages deployment. No code change needed — deployment config issue.

### QA-002: API Manager route 404 (Critical) — STILL BROKEN

No `/console/api-manager` route exists. Dashboard links to it at `console-app/src/routes/console/+page.svelte:320`.

**Fix:** Remove or disable the "API Manager" button on the dashboard until the route is implemented.

**File:** `console-app/src/routes/console/+page.svelte` — remove/comment the `<Button href="/console/api-manager">` element

### QA-003: Form validation missing (Critical) — PARTIALLY FIXED

Marketplace connector modals now have `requiredFilled` guards. Two gaps remain:

**Fix 1 — Invite email validation:**

- `console-app/src/routes/api/tenant/users/invite/+server.ts` — add email regex check server-side
- `console-app/src/routes/console/settings/users/+page.svelte` — add client-side email format check before `inviteUser()`

**Fix 2 — Incident form feedback:**

- `console-app/src/routes/console/incidents/+page.svelte` — add visible error message when title is empty

### QA-004: Access request subject blank (Critical) — STILL BROKEN

Backend returns `subject_ref`, frontend reads `subject`. See root cause fix above.

### QA-005: Incidents API 502 (Critical) — STILL BROKEN

Proxy passes body through without validation. If upstream returns HTML 502, `.json()` throws.

**Fix:**

- `console-app/src/routes/api/incidents/+server.ts` — check `res.ok` before calling `res.json()`; if not ok, read as text and return structured error JSON. Add basic validation for required `title` field before proxying.

### QA-006: Platform Status fake health (High) — PARTIALLY FIXED

Health endpoint pings real services. Usage data shows zeros when `DISPATCH_ADMIN_TOKEN` is missing.

**Fix:**

- `console-app/src/routes/console/platform-status/+page.svelte` — when usage response indicates missing token, show "Usage data unavailable (configuration required)" instead of "No usage data available"

### QA-007: Role update fails / wrong role on invites (High) — STILL BROKEN

GET returns `roles` (JSON string), UI reads `role` (undefined). See root cause fix above.

### QA-008: User profile button broken (High) — STILL BROKEN

Bottom-left sidebar avatar is a plain `<div>` with no click handler. A working dropdown exists in the top-right topbar.

**Fix:**

- `console-app/src/lib/components/layout/AppFrame.svelte` — make bottom-left avatar clickable: either add the same dropdown as top-right, or navigate to `/console/settings`

### QA-009: Compliance marked operational despite failure (High) — PARTIALLY FIXED

Health check pings real endpoints but only checks HTTP reachability, not functional correctness.

**Fix:** Acceptable for now — health checks are real. Add a note/tooltip: "Checks service reachability only." Lower priority.

### QA-010: Planned connectors allow auth flows (Medium) — STILL BROKEN

No status gate on Connect button. All 14 "planned" connectors open full wizards.

**Fix:**

- `console-app/src/routes/console/marketplace/+page.svelte` — disable Connect button when `integration.status === 'planned'`; show "Coming Soon" text instead

### QA-011: Policy generator ignores additional context (Medium) — FALSE POSITIVE

All 5 templates correctly use both `contactEmail` and `summary` fields. No fix needed.

### QA-012: Incident Invalid Date (Medium) — STILL BROKEN

Backend returns `created_at`/`resolved_at`, frontend reads `createdAt`/`resolvedAt`. See root cause fix above.

### QA-013: Partial audit logging (Medium) — STILL BROKEN

Missing audit writes for: incident create/resolve, access request approve/deny, OAuth callback, workflow execution, compliance evaluation, evidence submission.

**Fix:** Add `writeAudit` calls to these handlers:

- `api/incidents/+server.ts` POST → `incident.created`
- `api/incidents/[id]/resolve/+server.ts` POST → `incident.resolved`
- `api/access-requests/+server.ts` POST → `access_request.created`
- `api/access-requests/[id]/[action]/+server.ts` → `access_request.approved` / `access_request.denied`
- `api/apps/oauth/callback/+server.ts` → `app.oauth_connected`
- `api/apps/disconnect/+server.ts` → `app.disconnected`

### QA-014: Empty states unfinished (Low) — MOSTLY FIXED

Apps "Connected" tab and Workflows have proper empty states. Minor gap: Groups/Roles tabs lack Marketplace CTA link.

**Fix:** `console-app/src/routes/console/apps/+page.svelte` — add Marketplace link to Groups/Roles tab empty states

### QA-015: Dashboard metrics always zero (Low) — PARTIALLY FIXED

Real queries but field name mismatch between API and frontend. See root cause fix above.

### QA-016: Inconsistent capitalization (Cosmetic) — STILL PRESENT

Breadcrumbs only capitalize first letter. Low priority.

**Fix:** `console-app/src/lib/components/layout/AppFrame.svelte` — use title-case transform on breadcrumb segments

---

## Directory, Users, Groups & RBAC Overhaul

### Context

The directory page is non-functional for practical use. It only displays synthetic IdP-synced users in read-only mode. The tenant creator doesn't appear as a user anywhere. There's no way to manually create/edit/delete users or groups, manage group membership, or see who has console access. RBAC guards are missing on most API routes. Two separate user tables (`console_users` for auth, `directory_users` for org structure) exist with no link between them.

**Key codebase facts (validated):**

- `console_users` DDL is inline in `login/+server.ts` — not in a migration file
- `console_user_roles` table (migration 0012) exists but is **dead** — never queried; roles live in `console_users.roles` JSON
- `users` table (migration 0001) is also **dead** — never referenced in any API code
- Directory join table is `directory_memberships` (not `group_members`)
- `requireTenantRole` exists in `console-app/src/lib/server/guards.ts` but is only used on 4 routes
- Directory API routes (`api/directory/`) have zero `requireTenantRole` guards — only raw `!user` checks
- Directory page hides Users/Groups/Mappings tabs entirely when no IdP is connected
- No `directory/users/[id]/` or `directory/groups/[id]/` detail pages exist

---

### Phase 1: Critical Fixes — Tenant Creator + Directory CRUD

### 1a. Link console users to directory users

**New migration `migrations/0015_link_console_directory.sql`:**

- Add `console_user_id TEXT` column to `directory_users` (nullable, for IdP-only users)
- Index on `console_user_id`

**Modify `console-app/src/routes/api/auth/register/+server.ts`:**

- After creating `console_users` row, also INSERT into `directory_users` with `external_id = 'local:<userId>'`, `status='active'`, `title='Owner'`

**Modify `console-app/src/routes/api/tenant/users/invite/+server.ts`:**

- After creating `console_users` row, also INSERT into `directory_users` with `external_id = 'local:<userId>'`, linking via `console_user_id`

### 1b. Directory user CRUD API

**Modify `console-app/src/routes/api/directory/users/+server.ts`:**

- Add POST handler: create manual directory user (email, displayName, department, title, status)
- Guard: `requireTenantRole(user, ["owner", "admin"])`
- Write audit log

**New `console-app/src/routes/api/directory/users/[id]/+server.ts`:**

- GET: single user + group memberships (join `directory_memberships` + `directory_groups`)
- PATCH: update displayName, department, title, status. Guard: `["owner", "admin"]`
- DELETE: remove user + cascade `directory_memberships`. Guard: `["owner"]`. Block if linked to `console_user`

### 1c. Directory group CRUD API

**Modify `console-app/src/routes/api/directory/groups/+server.ts`:**

- Add POST handler: create group (name, description). Guard: `["owner", "admin"]`

**New `console-app/src/routes/api/directory/groups/[id]/+server.ts`:**

- GET: group + members list
- PATCH: update name, description. Guard: `["owner", "admin"]`
- DELETE: remove group + cascade `directory_memberships` + `group_app_mappings`. Guard: `["owner"]`

### 1d. Directory page UI updates

**Modify `console-app/src/routes/console/directory/+page.svelte`:**

- Show Users/Groups tabs even when no IdP is connected (currently hidden behind `syncStatus.connected`)
- Add "Add User" button → Dialog modal (email, name, department, title)
- Add "Add Group" button → Dialog modal (name, description)
- Make user/group rows clickable → navigates to detail pages (Phase 2)
- Add inline delete action on rows (with confirmation Dialog)

---

### Phase 2: UX — Detail Pages + Group Membership + Unified View

### 2a. User detail page

**New `console-app/src/routes/console/directory/users/[id]/+page.svelte`:**

- Profile info with edit form (name, department, title, status)
- Group memberships: list with remove button + "Add to group" dropdown
- Console access badge (if linked `console_user` exists via `console_user_id`)
- Recent audit trail for this user

### 2b. Group detail page + membership management

**New `console-app/src/routes/console/directory/groups/[id]/+page.svelte`:**

- Group info with edit form
- Members table with remove button + "Add Members" search/select
- App mappings for this group (reuse existing `group_app_mappings` pattern)

**New `console-app/src/routes/api/directory/groups/[id]/members/+server.ts`:**

- GET: list members
- POST: add member `{ userId }`. Guard: `["owner", "admin"]`
- DELETE: remove member. Guard: `["owner", "admin"]`

### 2c. Connect settings/users ↔ directory

**Modify `console-app/src/routes/console/settings/users/+page.svelte`:**

- Add link banner: "View all organization users in the Directory"

**Modify directory page users tab:**

- Add "Console Access" column badge (owner/admin/member or "—")

---

### Phase 3: RBAC Hardening

### 3a. Centralized permission matrix

**New `console-app/src/lib/server/permissions.ts`:**

- Route pattern → method → required roles mapping
- `matchRoutePermission(pathname, method) → string[] | null`

### 3b. Middleware guard in hooks

**Modify `console-app/src/hooks.server.ts`:**

- After auth resolution, before `resolve(event)`, check route permissions via `matchRoutePermission`
- Return 403 if user lacks required role for the matched route+method

### 3c. Inline guards on critical mutation routes (defense-in-depth)

Add `requireTenantRole` to these currently unguarded POST/PATCH/DELETE handlers:

- `api/directory/sync`, `api/directory/connect`
- `api/apps/credentials`, `api/apps/connect`, `api/apps/disconnect`
- `api/automation/rules` (all mutations)
- `api/platform/dashboard`, `api/platform/usage` → `requireSuperAdmin`

---

## Key Files Reference

| File                                                        | Role                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| `console-app/src/lib/server/guards.ts`                      | `requireTenantRole`, `requireSuperAdmin` — reuse these |
| `console-app/src/lib/server/audit.ts`                       | `writeAudit` — reuse for all new mutations             |
| `console-app/src/routes/api/directory/users/+server.ts`     | Existing GET — add POST                                |
| `console-app/src/routes/api/directory/groups/+server.ts`    | Existing GET — add POST                                |
| `console-app/src/routes/api/auth/register/+server.ts`       | Tenant creation — add directory_users insert           |
| `console-app/src/routes/api/tenant/users/invite/+server.ts` | Invite flow — add directory_users insert               |
| `console-app/src/routes/console/directory/+page.svelte`     | Main directory page — UI overhaul                      |
| `console-app/src/hooks.server.ts`                           | Auth middleware — add RBAC check                       |
| `migrations/`                                               | Schema migrations                                      |

---

## Verification

### QA Fixes

1. Incidents page: dates display correctly (no `Invalid Date`)
2. Access requests: subject column populated
3. Settings/users: role displays correctly, role updates work
4. Dashboard: metrics cards show real non-zero values when data exists
5. Dashboard: API Manager button removed or disabled
6. Marketplace: "planned" connectors show "Coming Soon", Connect disabled
7. Invite: invalid email rejected client-side and server-side
8. Incidents proxy: upstream 502 returns structured JSON error (not raw HTML)
9. Audit log: incident create/resolve and access request actions appear
10. Build passes: `pnpm run build` in console-app

### Directory/RBAC

1. Register a new tenant → confirm user appears in `directory_users`
2. Invite a user → confirm they appear in directory
3. Create/edit/delete users and groups via directory UI
4. Add/remove group members via group detail page
5. Test RBAC: member role cannot access write endpoints (403)
6. Existing tests pass: `pnpm test` at repo root

---

## Out of Scope

- Don't drop/merge the unused `users` table (may be referenced elsewhere)
- Don't merge `console_users` and `directory_users` tables (different purposes, linked via FK)
- No bulk import/export
- No real IdP sync (stays synthetic for now)
- No email delivery for invites (keep temp password modal)
- QA-009 (health check accuracy) — acceptable as-is, low priority
- QA-016 (capitalization) — cosmetic, lowest priority
