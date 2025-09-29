# AtlasIT Demo App

This is a lightweight local demo to visualize the intended direction of the AtlasIT compliance & risk console. It is intentionally mock-driven: **no production data** and **no Cloudflare calls**.

## Features (Mocked)

- Framework coverage tiles (SOC2, ISO27001, NIST CSF)
- Risk matrix (severity + likelihood/impact)
- Policy cards (status lifecycle)

## Structure

```
/demo-app
  src/
    api/ (lightweight hooks + types)
    components/ (UI building blocks)
    ui/DemoApp.tsx (composition root)
    mockData.ts (static snapshot)
  vite.config.ts (dev server + proxy for mock API)
```

## Running

In repo root (ensures workspaces install):

```
npm install --workspaces --include-workspace-root
cd demo-app
npm run dev
```

Open <http://localhost:5175>

## Mock API (Next Step)

A small Hono-based local server will mount at :4387 under `/mock-api` with endpoints:

- GET `/compliance/snapshot`
- GET `/policies`
- GET `/risks`

For now the React hook reads the proxied endpoint; once server is added the UI will function the same.

## Migration Path

Later this UI can swap fetch base to production Workers or an API gateway. Types can migrate to a shared package.

## Non-Goals (Now)

- Auth, RBAC, persistence, real control evaluation.
- Editing policies/risks.
- Multi-tenant concerns.

## Next Steps Suggested

1. Implement mock API server (Hono) + mount snapshot route.
2. Add skeleton loading + basic error state.
3. Introduce simple global state for filters (severity filter, framework selector).
4. Snapshot refresh timer (e.g., 30s) with shimmer animation.
5. Dark/light theme toggle.

---

This demo keeps scope explicit: display-only read model to align expectations with current backend maturity.
