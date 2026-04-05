# Frontend Backlog (Compliance & Governance UI)

Maintains pending enhancements and backend data gaps post Batch 0.

## A11y Enhancements

- Focus outlines: ensure visible focus ring for all interactive elements within dashboard panels.
- Keyboard navigation: arrow key support for coverage table row traversal; Home/End for jump.
- Live updates: expose aria-live region for refresh status and partial error changes.
- Dialog refinements: trap focus for drawers/panels converted to AccessibleDialog (Evidence & Notifications) and return focus to trigger.

## Notifications & Activity

- Integrate unreadCount + read state once backend unread feature lands.
- Badge variant: show unread high/critical vs total high/critical.
- Activity icons: replace text badges with semantic color-coded glyph or accessible SVG set.
- Real-time stream: optional SSE/WebSocket for pushing new activity & notification events.

## Coverage & Evidence

- Column sort for coverage table (by control key, evidence count, percent).
- Batch evidence verify with progress indicator.
- Evidence integrity badge (OK / MISMATCH) caching last verify result in memory.

## Resilience & Performance

- ~~Use fetchWithRetry for initial loader (safe GET) or prefetch refresh button only.~~ ✅ Done — server-side `+page.server.ts` prefetch with client-side fallback
- Offline caching: last successful dashboard JSON persisted (localStorage or IDB) for offline view.
- Skeleton refinement: consistent height alignment for metric cards during load.
- Adaptive relative time ticker (currently static) – integrate startRelativeTimeTicker to force periodic re-render.

## Testing

- Expand vitest coverage: iconMaps, fetchWithRetry (mocked fetch), filterControls, robustRelativeTime future edge cases.
- Add Playwright smoke: page loads, filter controls functional, retry button updates timestamp, skeletons present when forcing network delay.

## Theming

- ~~Dark/light theme toggle (CSS variables) with prefers-color-scheme initial state.~~ ✅ Done — dark/light toggle implemented, FOUC prevention via blocking `<script>` in `app.html`
- High contrast mode variant for a11y.

## Backend Data Gaps / Coordination

- Health endpoint: expose notifications { total, unread } (planned) and accessRequests { open } counts.
- Access Requests endpoints: confirm list & lifecycle before UI surface.
- Evidence coverage normalization: unify passing vs failing counts for percent logic (avoid recompute heuristic).
- Policy templates endpoint latency metric name to match UI label (policyGenerate / policyEvaluate alignment done; review for typos).

## Developer Experience

- Extract dashboard metric & table components into reusable primitives under lib/components/dashboard/.
- Introduce a global type guard utilities file (isApiError, etc.) to remove inline duplication.
- ESLint rule adjustments for Svelte accessibility (aria-role, explicit label associations) once core backlog reduced.

## Future Ideas

- Drill-down modal for a single incident with timeline & related notifications.
- Saved coverage filters and quick segments (e.g., controls with zero evidence, top 10 by evidence).
- Export evidence list CSV for a framework.

---

Updated: initial creation (Batch 0 follow-up).
