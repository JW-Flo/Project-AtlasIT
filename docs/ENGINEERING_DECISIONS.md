## Engineering Decisions (September 2025)

This document captures the finalized decisions and implementation details executed on branch `feat/pr12-idp-core-okta` regarding build tooling, dependency governance, quality gates, and Svelte/Vite strategy.

### 1. Vite 7 Unification

- Upgraded all Vite usages in this repository to `^7.1.7` (previously mixed 5.x / 6.x / 7.x).
- Reasons:
  - Consistent plugin pipeline + faster cold start / improved SSR stability.
  - Simplifies Dependabot / security diff surface.
- Future:
  - When SvelteKit releases a Vite 8 compatibility advisory, re‑evaluate only after ecosystem (adapter-cloudflare + vitest workers) is green.

### 2. Svelte / SvelteKit Strategy

- Retain SvelteKit 2.x line with `svelte@^5.0.0` prerelease range (already present) – no forced pinning.
- Cloudflare runtime target via `@sveltejs/adapter-cloudflare` already used; no alternate adapter introduced.
- Intentionally **not** adding `svelte-check` CI step now (explicit product choice to keep pipeline lean). Can be added later with: `npm i -D svelte-check` + `svelte-check --tsconfig ./tsconfig.json`.

### 3. Map / Geo Rendering Strategy (Deferred)

- No immediate heavy map bundle in active Svelte apps – optimization postponed.
- Decision gates for introducing Mapbox/MapLibre:
  1. First route requiring interactive map merged.
  2. Bundle report shows any single JS chunk > 400KB (pre‑gzip) or total > 2MB.
- If triggered: implement dynamic import + style spec trimming (or evaluate MapLibre if licensing / size pressure increases).

### 4. Auth Smoke Test Integration

- Added workflow: `.github/workflows/auth-smoke.yml`.
- Added script: `ops/checks/auth-smoke.sh` (curl-based, idempotent, fails fast).
- Trigger modes:
  - Manual `workflow_dispatch`.
  - `deployment_status` event success (executes if environment_url available from deployment event).
- Intent: Post-deploy minimal confidence check for core auth endpoints without full E2E harness.

### 5. Bundle Size Budgeting

- Introduced `scripts/bundle-report.mjs`.
- Budgets (initial):
  - Max individual asset: 400KB (uncompressed).
  - Max total JS+CSS: 2MB (uncompressed).
- Usage examples:
  - `npm run build:console:report`
  - `npm run bundle:report` (default scans `dist/`).
- These are soft budgets (exit code controls failure if wired into CI later).

### 6. Dependency Governance (Dependabot)

- Added minimal `.github/dependabot.yml` (three update sources):
  - Weekly npm (workspace root).
  - Weekly GitHub Actions.
  - Daily npm (direct dependencies only) – security exposure visibility.
- Chose _minimal_ config after removing unsupported keys encountered in validation (e.g. timezone, labels, groups not permitted by current validator in environment). Can be expanded later if schema validation loosens.

### 7. Test / Build Strategy Adjustments

- Unified Vite simplifies vitest environment; no worker-specific adjustments required right now.
- No Playwright/Cypress introduced – keep scope lean until UX flows stabilize.

### 8. Risk & Rollback Notes

- Risk: Some transitive plugin incompatibilities may surface (e.g. older SvelteKit adapter expecting Vite < 7). None observed in quick audit; if breakage appears revert by pinning per-package `"vite": "^6.3.2"` in affected workspace temporarily.
- Rollback path: Single revert commit of upgrade + removal of new scripts/workflows.

### 9. Future Enhancements (Backlog Consideration)

| Area        | Candidate Action                             | Trigger Condition                                          |
| ----------- | -------------------------------------------- | ---------------------------------------------------------- |
| Type Safety | Add `svelte-check` CI job                    | Increase in Svelte component surface area > 150 components |
| Performance | Introduce route-level code splitting metrics | Any bundle report failure                                  |
| QA          | Add minimal visual smoke (Playwright)        | First critical UI regression incident                      |
| Security    | Add license scanning (OSS review)            | Before first production customer                           |
| Maps        | Partial style build / dynamic import         | Map feature accepted into sprint                           |

### 10. Summary

All requested items (Vite 7 unification, auth smoke integration, dependabot provisioning, bundle budget script, strategic Svelte posture, deferred map optimization) are implemented. No additional Svelte linting or E2E harness added per direction to "just ensure it's all setup" without extra checks.

### Appendix A: Playwright Smoke QA (Added Late)

- Introduced minimal Playwright layer (config + basic auth + root page smoke) to enable post‑deployment environment validation.
- Scope intentionally narrow: only root availability + auth POST permutations mirrored from bash smoke.
- Workflow: `.github/workflows/playwright-smoke.yml` triggers on deployment success or manual dispatch.
- Future expansion triggers:
  - Add route coverage when >5 critical user journeys defined.
  - Add accessibility scan (axe) when marketing/public pages added.

---

Document owner: Engineering automation assistant
Last updated: 2025-09-30
