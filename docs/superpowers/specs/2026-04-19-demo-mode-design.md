# Self-Service Demo Mode — Design Spec

## Overview

A self-contained demo experience at `/demo` that lets prospects explore the full AtlasIT console without auth, backend, or seeded data. Client-side mock fetch layer returns realistic data for every API endpoint. A step-by-step spotlight tour guides users through the 11-stop product path.

## Entry Points

- `/demo` — Product-focused landing page (hero, value props, "Try the Console" CTA)
- CTA sets `sessionStorage.atlasit_demo = "true"` + navigates to `/console?demo=true`
- `?demo=true` on any `/console/*` route activates demo mode
- Demo mode persists via sessionStorage until explicitly exited

## Architecture

### Demo State (`$lib/demo/state.ts`)

- `isDemoMode: boolean` — derived from URL param OR sessionStorage flag
- `initDemo()` — sets sessionStorage flag + injects fake session (token + user)
- `exitDemo()` — clears sessionStorage flag + token + user, redirects to `/demo`

### Mock Fetch (`$lib/demo/mock-fetch.ts`)

- `getDemoResponse(url: string, method: string): Response | null`
- Maps ~20 API path patterns to mock data functions
- Returns null for unmatched paths (falls through to existing stub handler)
- Injected in `+layout.svelte` fetch interceptor, checked before real fetch

### Layout Integration (`+layout.svelte`)

- Import `isDemoMode` from state module
- Before existing pathMap routing: if demo mode, call `getDemoResponse()`; if non-null, return it
- Skip auth redirect when `isDemoMode` is true
- Add `/demo` to `PUBLIC_ROUTES` and `isBare` check

## Mock Data Layer

Location: `console-app/src/lib/demo/data/`

Files:

- `session.ts` — auth/session, user profile (Alex Morgan, alex@acmecorp.io, admin)
- `dashboard.ts` — stats: 247 evidence, 3/3 automations, 1 open incident, 12 apps
- `compliance.ts` — 78% overall trending up from 64% over 30 days. SOC2 82%, ISO27001 74%, NIST-CSF 76%, HIPAA 71%, GDPR 80%. 5 packs installed, controls with pass/fail, evidence items, trend series.
- `directory.ts` — 12 users across Engineering/Sales/Security/IT groups
- `automation.ts` — 3 rules (MFA enforce, access revoke, quarterly review), execution history
- `policies.ts` — 6 policies (3 published, 2 draft, 1 archived)
- `access.ts` — 2 access review campaigns (1 active 60%, 1 completed), 5 access requests
- `incidents.ts` — 3 incidents (open/investigating/resolved)
- `integrations.ts` — 12 connected apps with statuses and sync timestamps
- `marketplace.ts` — 35-app catalog with 12 marked as installed
- `settings.ts` — Acme Corp tenant, Pro tier, security config
- `notifications.ts` — 4 unread notifications
- `audit-log.ts` — 20 audit entries

Generated depth: evidence feed, audit log, directory users use seeded timestamp generation spread over 90 days.

Response shapes match existing page expectations (`{ data: { items: [...] } }` patterns).

## Demo Tenant: Acme Corp

- Company: Acme Corp (mid-size SaaS, 48 employees)
- Score: 78% overall, trending up
- Story: Active compliance program, 2 controls being remediated (MFA gaps, vendor risk)
- Apps: Okta, AWS, GitHub, Jira, Google Workspace, Slack, M365, Zoom, BambooHR, Datadog, PagerDuty, Confluence

## Action Handling

All mutating actions (POST/PUT/DELETE) in demo mode return success responses with a toast notification ("Policy generated!", "App connected!", etc.). No state actually changes — subsequent GETs return the same mock data. The demo feels interactive without needing state management.

## Demo Landing Page (`/demo/+page.svelte`)

Product-focused layout:

- Hero section: headline, subheadline, "Explore the Console" CTA button
- 3-4 value prop cards (compliance automation, evidence-grounded scoring, 35+ integrations, access reviews)
- Screenshot/mockup of the dashboard
- Footer with "Start free trial" secondary CTA
- No auth required, added to PUBLIC_ROUTES

## Guided Tour (`$lib/demo/DemoTour.svelte`)

Step-by-step spotlight overlay:

- Sequential flow: dims page, spotlights one element at a time with tooltip
- Next/Skip/Back buttons on tooltip
- 11 stops matching DEMO-SCRIPT.md click-path:
  1. Dashboard overview + compliance score pill
  2. Compliance score hero card
  3. Framework pack cards
  4. Evidence feed
  5. Connected apps widget
  6. Directory page (navigates)
  7. Compliance packs (navigates)
  8. Policies (navigates)
  9. Automation rules (navigates)
  10. Access reviews (navigates)
  11. Marketplace (navigates)
- Each step has: target CSS selector, title, description, placement (top/bottom/left/right)
- Tour state stored in a Svelte store, survives page navigation
- "Demo Mode" pill in topbar shows current step + skip tour option
- Tour auto-starts on first `/console?demo=true` visit
- Spotlight uses `position: fixed` overlay with CSS `clip-path` hole around target element
- `getBoundingClientRect()` positions tooltip relative to target
- ResizeObserver recalculates on layout shifts

## Files Changed

New files:

- `console-app/src/lib/demo/state.ts`
- `console-app/src/lib/demo/mock-fetch.ts`
- `console-app/src/lib/demo/data/*.ts` (13 files)
- `console-app/src/lib/demo/DemoTour.svelte`
- `console-app/src/lib/demo/tour-steps.ts`
- `console-app/src/lib/demo/DemoModePill.svelte`
- `console-app/src/routes/demo/+page.svelte`

Modified files:

- `console-app/src/routes/+layout.svelte` — demo fetch intercept + auth bypass
- `console-app/src/lib/components/layout/AppFrame.svelte` — DemoModePill + DemoTour mount
