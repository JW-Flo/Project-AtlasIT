# Local Migration Guide (AtlasIT)

> Goal: Reproduce the Codespaces development experience locally (Windows 11 + WSL2 or native Linux/macOS) with minimal friction for AI agents and human contributors.

## 1. Recommended Environment

| Option                                              | Status    | Why                                                                                     |
| --------------------------------------------------- | --------- | --------------------------------------------------------------------------------------- |
| Windows 11 + WSL2 (Ubuntu) + VS Code Dev Containers | Preferred | Matches containerized Linux target, stable path/permissions, reproducible for AI agents |
| Native macOS/Linux + Docker + Dev Containers        | Good      | Similar parity; skip WSL layer                                                          |
| Raw Windows (no WSL)                                | Avoid     | Path/line-ending quirks, missing some Linux tooling parity                              |

## 2. Prerequisites

- Git ≥ 2.40
- Docker Desktop (WSL2 integration enabled) OR Docker Engine (Linux)
- VS Code + Dev Containers extension
- Node.js 20.x (container supplies) – host install optional if you run scripts outside container
- Wrangler CLI (`npm install -g wrangler`) for local secret and deployment tasks

Optional: Global Wrangler install outside container if you plan to run commands directly on host.

## 3. Clone & Patch (If Applying Exported Changes)

If you exported a patch from Codespaces (`workspace-changes.patch`):

```bash
git clone <repo-url> Project-AtlasIT
cd Project-AtlasIT
# (Optional) Inspect patch
head workspace-changes.patch
# Dry-run apply
git apply --check workspace-changes.patch
# Apply
git apply workspace-changes.patch
```

If using the provided helper:

```bash
bash scripts/patch-apply.sh workspace-changes.patch
```

## 4. Open in Dev Container

1. Open folder in VS Code.
2. Command Palette: “Dev Containers: Reopen in Container”.
3. Wait for build (Node, dependencies, etc.).

Dev container is Debian-based; only essential tooling is provisioned (Node, Wrangler, TypeScript). No secret manager auto-install.

## 5. Install Dependencies

Inside container:

```bash
npm run install:all
```

If you encounter network hiccups, retry `npm ci` or `npm install` separately in problematic workspaces.

## 6. Environment Validation

Copy any required example envs, then validate:

```bash
npm run validate:env
bash scripts/env-check.sh   # additional quick surface check
```

## 7. Run Core Development Workers

```bash
npm run dev:core            # onboarding + orchestrator
# OR individual:
npm run dev:onboarding
npm run dev:orchestrator
```

## 8. Secrets Seeding (Wrangler)

Use per-worker directories OR global `--env` flags:

```bash
# Onboarding
cd onboarding
wrangler secret put ONBOARDING_API_KEY

# Orchestrator
cd ../ai-orchestrator
wrangler secret put API_ALLOWED_KEYS
wrangler secret put AI_GATEWAY_TOKEN
```

List secrets to confirm:

```bash
wrangler secret list --env core
```

## 9. Tests & Type Safety

```bash
npm run typecheck
npm test              # executes multi-workspace test runner
```

## 10. Deployment (Edge Workers)

After smoke validation:

```bash
cd onboarding && wrangler deploy
cd ../ai-orchestrator && wrangler deploy
cd ../documentation-worker && wrangler deploy
```

## 11. Quick Checklist

| Item                   | Command                           | Status Indicator            |
| ---------------------- | --------------------------------- | --------------------------- |
| Dependencies installed | `npm run install:all`             | No errors / lock consistent |
| Env validated          | `npm run validate:env`            | Green / no missing vars     |
| Workers running        | `npm run dev:core`                | Local routes responsive     |
| Secrets seeded         | `wrangler secret list --env core` | Expected keys present       |
| Tests pass             | `npm test`                        | All suites green            |
| Typecheck              | `npm run typecheck`               | No TS errors                |

## 12. Troubleshooting

| Symptom                    | Likely Cause                   | Fix                                                  |
| -------------------------- | ------------------------------ | ---------------------------------------------------- |
| Missing binding warnings   | KV/D1 not configured           | Add bindings in `wrangler.toml` env section          |
| `ENOENT` during build      | Workspace dependency not built | Run specific `build:*` script or `npm run build`     |
| Secrets unavailable in dev | Not seeded / wrong env         | Rerun `wrangler secret put ...` with correct `--env` |
| CLI install failures       | External repo transient        | Use manual download; skip automation                 |

## 13. AI Agent Notes

- Agents rely on stable Linux tooling; WSL2 ensures parity.
- Keep patch application small; large uncommitted diffs degrade context windows.
- Use `codex:context` scripts to regenerate trimmed context for agent ingestion.

## 14. Next Improvements (Optional)

- Add automated smoke script hitting local endpoints.
- Integrate lightweight SBOM diff into predeploy.
- Wire simple health aggregator across workers.

---

Maintained: Update when devcontainer base or secret workflow changes.
