# Legacy Context

## Overview

Before the current AtlasIT refocus, the repository hosted **Project Ignite** assets and early **MCP (Model Context Protocol)** experiments. Those explorations informed today's orchestrator worker but are not part of the active deployment footprint.

## Removed / Deprecated

- **MCP Agent Network** – Dependencies on external MCP servers, dispatch namespaces, and approval services are retired.
- **Ignite Branding & Collateral** – Product briefs, Terraform targets, and CI workflows labelled "Ignite" remain only for historical reference.
- **Production Manager Automations** – Legacy scripts and agents that supervised multi-cloud rollouts have been superseded by the orchestrator worker.

## Rationale

AtlasIT now prioritises a slimmer, worker-centric platform: onboarding automation, orchestrator workflows, and documentation publishing. Retaining the earlier artifacts would confuse deployment readiness and complicate security posture, so they are documented here and excluded from active plans.

## Possible Future Reuse

- **Approval & Audit Patterns** – MCP-style gating inspired the orchestrator's approval hooks and may be revisited if multi-step human sign-off is needed.
- **Dispatch Namespaces** – Techniques for routing between workers could be re-applied once Durable Object persistence is in place.
- **Advanced Agent Integrations** – AI agent orchestration ideas from Ignite can inform future roadmap items after core stability milestones.

See the main [`README`](README.md) for current components and [`ops/DEPLOYMENT_READINESS_SUMMARY.md`](ops/DEPLOYMENT_READINESS_SUMMARY.md) for the live hardening checklist.

## Retained Legacy Artifacts (Indexed)

| Artifact Type            | Location / Pattern                           | Reason Retained                | Planned Action                            |
| ------------------------ | -------------------------------------------- | ------------------------------ | ----------------------------------------- |
| Historical Workflows     | `.github/workflows/*ignite*`                 | Provenance / audit trail       | Rename or archive in Phase 4              |
| Worker Names (old)       | Deployed `ignite-*` workers                  | Zero-downtime migration window | Remove after new atlasit-\* verified      |
| KV Namespace (old)       | `ignite-dispatcher-namespace`, `ignite_docs` | Staging dual-read period       | Decommission Phase 3 end                  |
| MCP Assets               | `mcp/` directory                             | Experimental reference         | Potential future reuse; otherwise archive |
| Branding Strings         | Slack alerts, scripts comments               | Not yet renamed pre Phase 1    | Update Phase 1 sweep                      |
| Deployment Scripts       | `scripts/ignite-*`                           | Historical CI patterns         | Archive Phase 4                           |
| Documentation References | Legacy PDFs / brainstorm text                | Historical context             | Remain indefinitely                       |

### Recent Adjustments (2025-09-29)

| Change                            | Legacy Aspect                         | Current State                                                     | Notes                                           |
| --------------------------------- | ------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- |
| Orchestrator cron trigger removed | Scheduled monitoring (Ignite pattern) | Disabled to stay within free plan quota (5)                       | Re-introduce post consolidation or plan upgrade |
| Hardcoded MCP endpoint refactored | `mcp.project-ignite.*` URL            | Now env-configurable with fallback in `ai-orchestrator/config.js` | Enables gradual base domain realignment         |

All items above are non-operational unless explicitly noted and do not affect active AtlasIT production behavior.
