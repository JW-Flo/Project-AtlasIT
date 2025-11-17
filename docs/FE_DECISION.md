# Front-End Framework Decision (2025-10-01)

## Decision

SvelteKit remains the baseline framework for AtlasIT UI work. The existing `console-app/` scaffold is retained and will be extended instead of introducing a Next.js rewrite.

## Rationale

- **Established baseline:** SvelteKit app already bootstrapped with routing, Tailwind, and project conventions; reduces setup churn.
- **Operational alignment:** Current Cloudflare Worker targets and Vite-based tooling align with SvelteKit without additional adapters.
- **Risk reduction:** Avoids duplicating effort or fragmenting UI assets across frameworks during Phase 1.

## Implications

- Future Phase 1 work will land on branch `codex/phase-1-ui-scaffold` derived from the existing SvelteKit project.
- Documentation and status tracking point to SvelteKit; Next.js evaluation tasks are closed.
- Stub views (e.g., compliance score) should be implemented using current SvelteKit routing/layout patterns.
- UI contributions are obligated to extend `console-app/` (SvelteKit); alternative frameworks are out-of-scope without a superseding decision record.
- Roadmap/status references should link to this note rather than restating the framework analysis.
