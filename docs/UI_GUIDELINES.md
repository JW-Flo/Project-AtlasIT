# AtlasIT UI Guidelines (Initial Draft)

## Principles

- Semantic first: components consume tokens (no raw hex in components).
- Accessible by default: every interactive element keyboard reachable & labelled.
- Predictable motion: <=180ms standard, no layout-jarring transitions.
- Progressive enhancement: critical info renderable without JS failure.

## Tokens

Defined in `console-app/src/lib/design/tokens.ts` and exposed as CSS variables via `app.css`.
Never hardcode colors in components; use semantic variables.

## Typography Scale

11 / 12 / 14 / 16 / 20 / 24 / 32 (xs → xxl). Avoid arbitrary pixel sizes.

## Components (Foundations)

- Button: variants primary | outline | subtle | danger. Size sm|md.
- Future primitives: Input, Select, Checkbox, Tooltip, Modal, Toast, Tabs, Table.

## Layout

`AppFrame.svelte` supplies sidebar + main content. Keep page containers to `max-width: 1400px` unless data-dense table.

## Spacing

Use token spacing scale (2,4,8,12,16,20,24,32). Prefer 8 multiples.

## States & Feedback

- Hover: lighten/darken by design token not filter hacks.
- Focus: always use focus ring (token `--color-focus`).
- Disabled: opacity .55 + cursor not-allowed.

## Accessibility Checklist

- Color contrast >= 4.5:1 normal text, 3:1 large.
- All icons with meaning receive `aria-label` or visible text.
- No reliance on color alone (use icon or text tag for status).
- Keyboard: Tab order follows DOM, Escape closes transient UI.

## Theming

Dark default; user override persisted in localStorage key `atlasit.theme`.
Adding new token: update both light & dark sets and docs.

## Metrics & Instrumentation

Use `ux-metrics.ts` mark() for significant interactions. Name format: `ui:<domain>:<action>`.

## Naming Rules

- Component files: PascalCase.svelte
- Stores: noun/action pattern (theme.ts)
- Non-visual utilities: kebab or dash in file name avoided; prefer lowerCamel if single export.

## Roadmap (Next)

- Form primitives & validation states
- Toast system for ephemeral feedback
- Table with column virtualization
- Accessibility automated tests (axe in Playwright)
- Visual regression harness

---

Initial draft – iterate as components land.
