# ADR-UI-01: Design Tokens System

Date: 2025-09-30
Status: Accepted
Decision Makers: Frontend & Platform Engineering

## Context

We need a stable, semantic design foundation to accelerate UI iteration across compliance, risk, automation, and integration surfaces. Hardcoded disparate color values and spacing make refactors expensive and degrade consistency.

## Decision

Introduce a semantic-first token layer implemented in `tokens.ts` plus CSS variable exports in `app.css` with light + dark themes. Components consume semantic variables (e.g., `--color-accent`) rather than palette indices or raw hex.

## Scope

Phase 1: Colors, spacing, radii, typography scale, motion timings, shadows.
Phase 2 (future): Z‑index, container widths, data-viz categorical palette, density scale.

## Rationale

- Consistency → uniform interaction & brand perception.
- Theming → dark/light switching without component rewrites.
- Accessibility → central place to adjust contrast.
- Velocity → new components rely on pre-approved primitives.

## Constraints

- Avoid runtime token generation overhead; static TS export + CSS variables is sufficient.
- Keep palette small; expand only with semantic need.

## Alternatives Considered

1. Tailwind-only utility approach: faster start, harder to enforce semantic meaning.
2. Full design system library (e.g., Radix + theming overlay): heavier dependency surface now.
3. CSS-in-JS runtime tokens: unnecessary cost on Workers/edge.

## Consequences

Positive: Predictable theming, easier audits, decoupled visual & functional changes.
Negative: Upfront overhead writing tokens + documentation; requires discipline for adoption.

## Rollout Plan

1. Tokens + CSS variables (done).
2. Migrate existing components to semantic classes opportunistically.
3. Add lint rule / style audit (future) to flag raw hex usage outside token files.
4. Add visual regression baseline once core palette stabilizes.

## Future Enhancements

- Dynamic user theme preferences persisted server-side.
- High-contrast accessibility variant.
- Motion-reduced variant using `prefers-reduced-motion`.
- Export tokens JSON for design tooling (Figma plugin sync).

---

This ADR governs UI layer foundations; amendments require follow-up ADR.
