## Infrastructure Rebuild (2025-09-28)

Executed full clean provisioning per KEEP NONE directive.

Provisioned Resources:

- D1: atlas_core_db (4fb2e312-3ba5-4fa2-a91f-7275c71bea64)
- D1: atlas_audit_db (faa2caf5-0219-4507-9d8f-9ddab544615c)
- D1: atlas_compliance (f14bde38-795d-46b5-b174-fe4d559f2ac7)
- D1: atlas_audit_shadow (d72ddfd9-c892-42ec-a5c3-b920788485c1)
- KV: KV_SESSIONS (c3017a1a156a4f2fa2da62dadc714c44)
- KV: KV_CACHE (4f08086308004796bfd7cab01c34b006)
- KV: KV_FEATURE_FLAGS (6a94dc4144f04b82a4989677c47509da)
- R2: atlas-policies
- R2: atlas-evidence
- R2: atlas-artifacts
- Queues: Skipped (plan limitation; bindings deferred)

Config Changes:

- Updated top-level `wrangler.toml` with new kv_namespaces, d1_databases, r2_buckets.
- Added cleanup script `ops/cleanup-legacy-resources.sh` (dry-run by default, `--apply` to execute).
- Removed reliance on node:crypto in `src/lib/trace.js` for Workers compatibility.

Deployment:

- Successful deploy of worker `project-ignite` Version ID 2e566105-54e3-4e89-ad8c-c899e9f93b2b using explicit CLI deploy (compatibility_date 2024-03-20).

Next Actions:

- (Optional) Upgrade plan to enable Queues; then add queue bindings.
- Run cleanup script to remove legacy D1/KV/R2 after confirming no dependencies.
- Add health endpoint integration tests referencing new DB / KV bindings.

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
npx wrangler login

```
## 2025-09-28 Infra Audit Additions

Snapshots collected under `ops/snapshots/`:
- D1 list: `ops/snapshots/d1/_d1_list.txt` (post-removal: guestbook_demo, atlasit_dev removed)
- KV keys (IGNITE_KV, MCP_STORE, UNIFIED_DATA_CACHE, ignite-docs, ATLAS_FLAGS) currently empty (`[]`) indicating minimal migration complexity.
- R2 inventory placeholder (wrangler CLI listing unavailable here); use dashboard or S3 tooling for deeper audit.

Audit Script:
- `ops/audit-infra.sh` automates D1 list, KV key capture, and placeholder R2 inventory docs.

CI Validation Added:
- `.github/workflows/ci-infra-validation.yml` runs vitest for binding, runtime, and queue placeholder tests on PR/main.

Queue Enablement Procedure (after plan upgrade):
1. Create queues (atlas-workflow-queue, policy-rebuild, risk-recalc).
2. Uncomment queue producers in `wrangler.toml`.
3. Add enqueue smoke test & set `CF_QUEUES_ENABLED=1` locally / CI (future enhancement).

Decommission Roadmap (Remaining):
1. D1: qa-pipeline-db (snapshot exists) -> delete if unused.
2. D1: mcp-store -> confirm usage then delete or migrate.
3. D1: tesla-journey-tracker -> assess archival needs before deletion (largest size).
4. KV: Remove empty legacy namespaces once code references purged.
5. R2: Export or verify contents of legacy buckets before deletion.

## 2025-09-28 Legacy D1 Final Deletions

Action Completed: All remaining legacy D1 databases exported (snapshotted) then deleted after verification.

Sequence Executed:
1. qa-pipeline-db

	- Export: ops/snapshots/d1/qa-pipeline-db.sql (267 lines, contained QA pipeline run metadata)
	- Deletion: Confirmed absent via `wrangler d1 list`.
2. mcp-store

	- Export: ops/snapshots/d1/mcp-store.sql (1 line; empty schema only)
	- Deletion: Confirmed absent.
3. tesla-journey-tracker

	- Export: ops/snapshots/d1/tesla-journey-tracker.sql (2,477 lines; includes vehicle/journey schema & historical data)
	- Deletion: Confirmed absent.

Temporary Config Adjustment:
- Added transient binding `LEGACY_QA_PIPELINE_DB` to `wrangler.toml` solely to enable remote export; export ultimately required `--remote` flag. Binding can be removed in next config tidy-up commit.

Post-State Verification:
- `wrangler d1 list` now shows only new canonical databases: atlas_core_db, atlas_audit_db, atlas_compliance, atlas_audit_shadow.
- No application code references those deleted legacy DB names (none were bound pre-cleanup).

Recovery Path:
- Point-in-time restoration would require manual re-create & apply exported .sql files; snapshot artifacts retained in version control under `ops/snapshots/d1/`.

Next Cleanup Steps:
- Remove the temporary legacy binding from `wrangler.toml` (if still present) in a follow-up housekeeping change.
- Proceed with KV namespace rationalization & R2 inventory as outlined above.

### 2025-09-28 Binding Housekeeping

The transient `LEGACY_QA_PIPELINE_DB` binding used solely for export has now been removed from `wrangler.toml` after successful snapshot & deletion. Test suite re-run (32 files, 77 tests) passed with no regressions, confirming no runtime dependency on the removed legacy database binding.

## KV & R2 Rationalization Plan (Draft)

Objectives:
- Remove unused / empty legacy KV namespaces after confirming zero code references.
- Establish inventory + retention classification for R2 buckets (artifacts, evidence, policies) and any legacy buckets discovered during dashboard audit.

Steps:
1. KV Reference Scan
	- Action: Grep for old namespace identifiers (e.g., ignite-dispatcher-namespace, ignite_docs) across repo.
	- Produce: `ops/snapshots/kv/kv_reference_scan.txt` with line references.
	- Exit Criteria: No runtime imports or get/put calls remain for legacy namespaces.
2. KV Deletion Checklist
	- Create `ops/kv-deletion-checklist.md` enumerating each legacy namespace, last-seen usage (git blame or logs), and deletion decision.
	- After 24h with zero references & logs, execute `wrangler kv namespace delete` commands (manual step documented, not scripted to avoid accidents).
3. R2 Bucket Inventory
	- Use dashboard or `wrangler r2 object list <bucket>` (if enabled) to capture object counts & total size.
	- Store outputs under `ops/snapshots/r2/<bucket>-inventory.txt`.
4. Retention Classification
	- For each bucket: classify (Regulatory Evidence / Operational Artifacts / Derived Cache) with retention window & purge policy.
	- Document in `docs/DATA_RETENTION_MATRIX.md` (new file) and reference in alignment plan.
5. Purge & Lifecycle Policies
	- For cache / derived artifacts: define automated purge (cron job or manual script) with max age threshold.
	- For evidence/policies: ensure immutability rules (no overwrite) & versioning strategy (tracked via git or R2 object versioning if enabled).
6. Health Endpoint Extension
	- Add R2 object count + last modified age metrics to /health (append-only fields) for observability.
7. QA & CI
	- Add contract test ensuring new /health fields present and non-negative when retention plan enacted.

Risks & Mitigations:
- Accidental deletion of evidentiary objects: enforce manual confirmation & snapshot inventory prior to deletion.
- Stale code path referencing removed KV: comprehensive grep + test suite gate; add optional runtime warning if legacy binding env var absent.

Next Action (not yet executed): Implement Step 1 (KV Reference Scan) and create snapshot file.
```
