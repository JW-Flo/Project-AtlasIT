# AtlasIT Compliance & Security Frontend

This document describes how the atlasit-web SvelteKit app integrates with the Compliance Worker APIs (policies, evidence, incidents, activity, snapshot, etc.).

## Environment Configuration

Public runtime variable (exposed to browser) for API base:

```bash
PUBLIC_COMPLIANCE_API_BASE=https://compliance.local
```

If omitted it defaults to same-origin relative paths.

Add to your `.env` (NOT committed) or Cloudflare Pages project vars:

```bash
PUBLIC_COMPLIANCE_API_BASE=https://your-worker-domain.example
```

## API Client

Implemented at `src/lib/api/client.ts` with lightweight typed wrappers (`src/lib/api/types.ts`). Error responses throw an `Error` augmented with `status` and `body` (error shape `{ error, requestId? }`).

### Available Helpers

- `ComplianceAPI.health()` -> HealthResponse
- `ComplianceAPI.snapshot(tenantId?)` -> ComplianceSnapshot
- Policies: `listPolicyTemplates()`, `generatePolicy()`, `evaluatePolicy()`, `coverage(framework?)`
- Incidents: `listIncidents({ status, severity, limit, cursor })`, `createIncident({ title, severity?, source? })`, `resolveIncident(id, tenantId?)`
- Activity: `listActivity({ type, limit, cursor })`
- Notifications: `listNotifications()` (critical/high open incidents subset)
- Evidence: `searchEvidence({ tenantId, pack, subject, limit, cursor })`, `verifyEvidence(hash)`

## Planned UI Routes (Incremental)

```text
/governance/compliance        (Dashboard: snapshot + health + counts)
/security/incidents           (List/create/resolve)
/security/activity            (Feed with pagination)
/it/policies/templates        (Policy templates)
/it/policies/generate         (Generate policy)
/it/policies/evaluate         (Evaluate policy)
/it/policies/coverage         (Coverage summary)
/governance/evidence          (Search + verify)
/workflows                    (Execute JML workflow)
/workflows/executions/[id]    (Execution detail)
/marketplace/slack            (Integration detail stub)
```

## Development

Install dependencies (workspace root):

```bash
npm install
```

Run only this app (inside `apps/atlasit-web`):

```bash
npm run dev
```

If the compliance worker runs on a different origin locally, set the public env base or use a dev proxy.

## Error Handling Pattern

Example usage with try/catch and toast:

```ts
import { ComplianceAPI } from "$lib/api/client";

try {
  const { items } = await ComplianceAPI.listIncidents({ limit: 20 });
  // update store
} catch (e: any) {
  console.error("Failed to load incidents", e.status, e.body?.error);
}
```

## TODO (Frontend Roadmap)

- Layout & navigation shell
- Incidents page + optimistic create/resolve
- Activity feed & notifications drawer
- Policy management pages
- Evidence search & verify modal
- Workflow execution UI
- Access Requests (pending backend)
- Marketplace detail polish

## Contributing

Keep fetch helpers small. If an endpoint becomes chatty or needs batching, add a caching layer or SSR load function wrapper.

## License

Internal proprietary.
