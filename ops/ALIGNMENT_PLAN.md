# AtlasIT Alignment & Legacy Ignite De‑Branding Plan

Status: DRAFT (Phase 0 – Discovery Complete)
Owner: Automation (GitHub Copilot) / Maintainer: Platform Engineering
Last Updated: <!--DATE-->

## Objectives

- Eliminate accidental continued usage of legacy "Ignite" branding in active runtime paths.
- Preserve historically relevant artifacts under clearly scoped legacy context.
- Avoid production downtime during worker & KV namespace renames.
- Provide reversible, incremental steps with verifiable checkpoints.

## Non‑Goals

- Rewriting historical logs or commit history.
- Purging legacy brainstorm documents (they move under legacy classification).

## Inventory & Categorization

| Category                   | Example(s)                                             | Action                                           | Phase        |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------ | ------------ |
| Docs Index                 | `docs/README.md` title                                 | Rename to AtlasIT, add legacy note               | 1            |
| Slack Messaging            | `utils/slack.js` username "Project Ignite"             | Rename to AtlasIT                                | 1            |
| Deployment Workflows       | `.github/workflows/*ignite*`                           | Rename workflow file & internal name             | 4            |
| Worker Names               | `ignite-ai-orchestrator`, `ignite-documentation`       | Rename to `atlasit-orchestrator`, `atlasit-docs` | 2            |
| Routes                     | `*.project-ignite.workers.dev`                         | Update to `atlasit-*` forms                      | 2            |
| KV Namespace Names         | `ignite-dispatcher-namespace`, `ignite_docs`           | Create new atlasit namespaces + dual period      | 3            |
| Code Constants             | URLs in `ai-orchestrator/index.js`, `autoDoc.js`, etc. | Refactor to config-driven base                   | 2            |
| MCP Artifacts              | `project-ignite-mcp` worker                            | Mark legacy / optional rename deferred           | 4 (optional) |
| Legacy Scripts             | `scripts/ignite-deploy.yml`                            | Archive reference in LEGACY.md                   | 4            |
| Branding Strings in Agents | orchestrator / start scripts                           | Rename user-facing strings                       | 1            |
| 1Password / Secrets Notes  | "Project Ignite Secrets"                               | Update vault display name (out of repo scope)    | External     |

## Phasing Overview

1. Phase 1 – Messaging & Documentation (no infra changes)
2. Phase 2 – Config & Worker Name Migration (add new names, deploy)
3. Phase 3 – Data / KV Key Dual-Read & Cutover
4. Phase 4 – Workflow & Residual Cleanup

---

## Phase 1 – Messaging & Documentation

Scope:

- Update docs/README.md title & narrative to AtlasIT.
- Adjust Slack display name & alert strings.
- Add/augment LEGACY.md: enumerate retained legacy artifacts.
- Introduce config indirection for base domains (if quick win) or defer to Phase 2.

Acceptance:

- No grep for `# Project Ignite Documentation Index` remains.
- Slack messages emit "AtlasIT" on next alert.
- LEGACY.md table lists all preserved ignite items.

## Phase 2 – Worker & Route Renames

Approach:

- Update `ai-orchestrator/wrangler.toml` name + route.
- Update `documentation-worker/wrangler.toml` name + route.
- Keep old workers alive until new deploy verified (parallel period).
- Add note in DEPLOYMENT_SUCCESS_REPORT.md referencing new canonical endpoints.

Verification:

- `wrangler deployments list` shows new worker names with 200 OK on /health.
- Smoke script updated base URLs pass same checks.

Rollback:

- Old workers untouched until verification; revert by switching DNS / references back.

## Phase 3 – KV Dual-Read & Key Migration

Steps:

1. Create new KV namespace(s): `atlasit-dispatcher-namespace`, `atlasit_docs`.
2. Bind both old + new in wrangler during transition.
3. Code: read from new key first, fallback to old; writes go to new only.
4. One-off migration script (if needed) to copy values.
5. After stability window (>=24h) remove old binding & fallback.

Acceptance:

- All new writes land only in new namespace (spot check via wrangler kv get/list).
- Fallback path not invoked in logs for 24h.

## Phase 4 – Cleanup & Workflow Renames

- Rename GitHub workflow file names & internal `name:` fields.
- Archive or delete ignite-specific scripts; reference in LEGACY.md.
- Remove dual-read logic & old KV bindings.
- Final grep shows only intentional legacy references inside LEGACY.md or historical artifacts.

Acceptance:

- `grep -R "ignite"` limited to LEGACY.md, historical docs, logs, and archived directories.

---

## Detailed Task Matrix

| Task                         | File(s)                                              | Phase | Status  |
| ---------------------------- | ---------------------------------------------------- | ----- | ------- |
| Update docs README           | docs/README.md                                       | 1     | DONE    |
| Slack username rename        | utils/slack.js                                       | 1     | PENDING |
| Extend LEGACY.md table       | LEGACY.md                                            | 1     | PENDING |
| Orchestrator worker rename   | ai-orchestrator/wrangler.toml                        | 2     | DONE    |
| Docs worker rename           | documentation-worker/wrangler.toml                   | 2     | DONE    |
| Base URL constants to config | ai-orchestrator/index.js, cloud-functions/autoDoc.js | 2     | PENDING |
| Add /health to docs worker   | documentation-worker/index.js                        | 2     | PENDING |
| Introduce dual KV bindings   | wrangler.toml(s)                                     | 3     | PENDING |
| Implement dual-read logic    | documentation-worker/index.js                        | 3     | PENDING |
| Migration script (if needed) | scripts/migrate_kv_docs.js (new)                     | 3     | PENDING |
| Remove old KV & fallback     | wrangler + code                                      | 4     | PENDING |
| Rename GH workflows          | .github/workflows/\*                                 | 4     | PENDING |
| Archive ignite scripts       | scripts/_ignite_                                     | 4     | PENDING |

---

## Risk Mitigation

| Risk                                           | Mitigation                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Broken inbound references to old worker routes | Keep old workers active until consumers updated; publish mapping table in README. |
| KV data divergence during transition           | Write-only new, optional one-time sync job at start, log fallback hits.           |
| Missed branding string                         | Final exhaustive grep + lint style rule (optional future).                        |
| Workflow rename breaks badges                  | Update README badges concurrently in Phase 4.                                     |

## Rollback Strategy

| Change Scope    | Rollback Action                                          |
| --------------- | -------------------------------------------------------- |
| Worker rename   | Revert wrangler.toml & redeploy old name (no data loss). |
| KV dual binding | Re-enable old binding + revert code fallback logic.      |
| Docs branding   | Restore previous README commit.                          |

## Verification Checklist (Running)

- [ ] Phase 1 complete markers achieved
- [ ] New worker endpoints operational (Phase 2)
- [ ] Dual-read producing zero fallbacks for 24h (Phase 3)
- [ ] Final grep scope reduced (Phase 4)

---

## Post-Completion

Add section to DEPLOYMENT_SUCCESS_REPORT.md summarizing alignment outcome & date.

---

## Notes

This plan intentionally sequences user-visible textual changes before infrastructure mutations to minimize perceived churn and isolate operational risk later.
