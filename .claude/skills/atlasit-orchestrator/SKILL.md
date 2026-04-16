---
name: atlasit-orchestrator
description: |
  Principal-level orchestrator for all JW-Flo repositories and local AI infrastructure.
  Use this skill for ANY task across: Project-AtlasIT (multi-tenant IT compliance platform),
  AWhittleWandering (Tesla telemetry dashboard), local-devops-ai (autonomous DevOps agent
  with market/finance/home-automation subsystems), market_agents (Kalshi trading bots),
  JW-Site, or OpenClaw (WhatsApp AI agent). Also use for local AI stack management:
  Ollama models, local-devops-ai gateway (port 4123), Qdrant vector store, OpenClaw gateway.
  Triggers on: (1) Planning/breaking down roadmap items, (2) Generating implementation prompts,
  (3) Writing CF Workers/D1/Hono/React/TS code, (4) Full PR workflow via GitHub API,
  (5) Multi-agent coordination, (6) Architecture decisions, (7) Any JW-Flo coding/debug/review,
  (8) Local AI stack questions (ports, models, services, startup).
  Use proactively whenever working in any JW-Flo repo or asking about local AI services.
---

# JW-Flo Project Orchestrator

## Repo Map

| Repo                  | Purpose                             | Primary Stack                                            |
| --------------------- | ----------------------------------- | -------------------------------------------------------- |
| **Project-AtlasIT**   | Multi-tenant IT compliance platform | CF Workers, D1, KV, R2, Queues, Hono, 35+ adapters       |
| **AWhittleWandering** | Tesla telemetry dashboard           | React 18, Mapbox GL, Tessie API, CF edge worker          |
| **local-devops-ai**   | Autonomous DevOps + AI platform     | Node/TS, Express gateway (4123), Qdrant, Ollama, Bedrock |
| **market_agents**     | Kalshi trading bots                 | Node/TS, Railway deploy, Kalshi async SDK                |
| **JW-Site**           | Personal/company site               | CF Workers, Wrangler, monorepo                           |
| **OpenClaw**          | WhatsApp AI agent                   | Node, AWS Bedrock Haiku, Desktop Commander MCP           |

Key D:/ paths:

- `D:/repos/` — all live repos
- `D:/ai-knowledge/` — context snapshots, CLAUDE.md files, secrets
- `D:/openclaw/` — OpenClaw config + launch scripts
- `D:/ai-cache/qdrant-bin/` — Qdrant binary + storage
- `D:/ai-models/`, `D:/ai-cache/` — local model storage

---

## Local AI Stack — Service Map

All services run natively (no Docker except Open WebUI).

| Service                 | Port     | Process                                                         | Purpose                                  |
| ----------------------- | -------- | --------------------------------------------------------------- | ---------------------------------------- |
| Ollama                  | 11434    | `C:\Users\joewh\AppData\Local\Programs\Ollama\ollama.exe serve` | Local LLM inference                      |
| Qdrant                  | 6333     | `D:\ai-cache\qdrant-bin\qdrant.exe`                             | Vector store for knowledge/memory        |
| **DevOps Gateway + UI** | **4123** | `tsx watch src/index.ts` in `gateway/`                          | Main orchestration API + React dashboard |
| OpenClaw Gateway        | 18789    | `node openclaw/dist/index.js gateway`                           | WhatsApp agent + tool routing            |
| Open WebUI              | 3000     | Docker container `open-webui`                                   | Chat UI for local models                 |
| AnythingLLM             | 3001     | Desktop app                                                     | Document RAG                             |

**Start everything:** `D:\openclaw\START-AI-STACK.bat`
**Stop everything:** `D:\openclaw\STOP-AI-STACK.bat`
**Desktop shortcut:** run `D:\openclaw\CREATE-SHORTCUT.vbs` once

### Ollama Models (CPU inference)

```
llama3.1:8b-instruct-q4_K_M   — primary/general
qwen2.5:3b-instruct-q4_K_M    — fast/lightweight
deepseek-coder:6.7b-base-q4_K_M — code tasks
nomic-embed-text:latest         — embeddings (768d)
```

### LLM Provider Routing (local-devops-ai gateway)

```
Priority: OpenRouter (free Nemotron 120B) → Bedrock Haiku → Ollama (CPU fallback)
Config:   C:\Users\joewh\local-devops-ai\gateway\.env
Key:      LLM_PROVIDER=openrouter
          OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
          BEDROCK_MODEL=us.anthropic.claude-3-5-haiku-20241022-v1:0
```

### local-devops-ai Gateway Endpoints (port 4123)

```
GET  /health              — status + LLM provider
GET  /agent/state         — current task queue
GET  /agent/loop          — continuous loop status
POST /agent/loop/start    — start auto-loop (intervalMs in body)
POST /agent/loop/stop     — stop loop
POST /agent/run           — one-shot agent cycle
POST /agent/dispatch      — dispatch tasks from roadmaps
POST /agent/code          — execute a code task via GitHub
GET  /market              — Kalshi market agent status
GET  /finance             — Plaid finance tracker
GET  /home                — home automation (Hue/Govee/IFTTT)
GET  /kpi                 — KPI dashboard
GET  /healer/stats        — self-healer status
GET  /healer/services     — all service states
GET  /knowledge           — Qdrant knowledge store stats
POST /knowledge/ingest    — re-ingest D:/ai-knowledge
GET  /memories            — memory log
GET  /llm/status          — provider routing status
GET  /github/registry     — watched repos
```

### OpenClaw Gateway (port 18789)

- Token auth: see `D:/openclaw/openclaw.json` → `gateway.auth.token`
- Primary model: `amazon-bedrock/us.anthropic.claude-3-5-haiku-20241022-v1:0`
- WhatsApp allowed: +17064612998
- Workspace: `D:/openclaw/workspace/` (SOUL.md, USER.md, PROJECT.md, AGENTS.md)

---

## Universal Rules (All Repos)

### Git & GitHub

```
Branch naming:  claude/<short-desc>-<sessionId>
Commits:        Always include session URL in message body
GitHub API:     ALWAYS curl + $GH_PAT — NEVER gh CLI
                $GH_PAT is also in D:/ai-knowledge/gateway/.env as GH_PAT
Retry:          Exponential backoff on 401/network errors (multi-agent token contention)
```

### Full PR Lifecycle

```
1.  git checkout -b claude/<desc>-<sessionId>
2.  Implement + lint (npm run lint)
3.  git commit -m "feat: ...\n\nSession: <url>"
4.  git push -u origin <branch>
5.  curl -X POST https://api.github.com/repos/JW-Flo/<repo>/pulls \
      -H "Authorization: token $GH_PAT" \
      -d '{"title":"...","head":"<branch>","base":"main","body":"Session: <url>"}'
6.  curl -X POST .../pulls/<num>/requested_reviewers \
      -d '{"reviewers":["copilot"]}'
7.  Poll reviews every 3-5 min (2-3 attempts); nudge @copilot if stalled
8.  Address CHANGES_REQUESTED, push, re-request review
9.  Squash merge via API
10. Delete branch (local + remote)
11. Verify Railway/Cloudflare deploy
```

### Code Quality Standards

- TypeScript: no `any`, explicit types everywhere
- SQL: parameterized queries only — never string interpolation
- APIs: Zod validation on all inputs
- React: loading + error states on every data-fetching component
- Tests: Vitest (unit), Puppeteer (E2E), Miniflare (Workers), ≥80% coverage on new code

---

## Project-AtlasIT

**Architecture:** Multi-tenant IT compliance automation. Directory events → automation engine → compliance scoring → evidence pipeline.

**Key components:**

- `console-app/` — React 18 + TypeScript admin dashboard
- `compliance-worker/` — CF Worker, scoring engine
- `ai-orchestrator/` — LLM-driven remediation + task dispatch
- `core-api/` — Hono REST, Zod-validated
- `adapters/` — 35+ integrations (Azure AD, Okta, Google Workspace, Jamf, etc.)
- `auth/` — tenant isolation, JWT, MFA guard
- `infra/terraform/` — IaC for non-CF resources

**Storage:** D1 (relational, tenant-scoped), KV (config/cache), R2 (evidence/assets), Queues (async dispatch)

**Hard invariants:**

- Health endpoint: additive-only, never remove keys
- Every D1 query scoped to `tenant_id`
- Evidence pipeline: immutable once written
- Adapter contract: `assess()` → `remediate()` → `report()`

**Hono API pattern:**

```typescript
app.get(
  "/api/v1/compliance/:tenantId",
  zValidator("param", z.object({ tenantId: z.string().uuid() })),
  async (c) => {
    const { tenantId } = c.req.valid("param");
    const result = await c.env.DB.prepare("SELECT * FROM compliance_scores WHERE tenant_id = ?")
      .bind(tenantId)
      .all();
    return c.json({ status: "success", data: result, timestamp: new Date().toISOString() });
  },
);
```

---

## AWhittleWandering

**Architecture:** Tessie API → CF D1 → edge worker → React + Mapbox frontend.

**Middleware order:** `requestLogger → cors → rateLimit → userAuth → mfaGuard → handler`

**Unified data contract:** Never break `backend/edge-worker/src/qa/unified-data.schema.json`.
Always run `validate-unified.ts` before merging API changes.

**D1 batch insert (telemetry):**

```typescript
const batch = records.map((r) =>
  c.env.DB.prepare("INSERT INTO telemetry (vehicle_id, ts, data) VALUES (?,?,?)").bind(
    r.vehicleId,
    r.ts,
    JSON.stringify(r),
  ),
);
await c.env.DB.batch(batch);
```

---

## local-devops-ai

**Architecture:** Continuous agent loop → LLM orchestrator → tool executors → self-healer.

Gateway `.env` at `C:\Users\joewh\local-devops-ai\gateway\.env` — source of truth for all config.

**Subsystems:**

- `src/market-agent/` — Kalshi WS/REST, Kelly criterion sizing, mispricing detection, ensemble
- `src/home-automation/` — Hue (192.168.1.80), Govee, Alexa, IFTTT, network scanner
- `src/finance-tracker/` — Plaid sync (6h interval), transaction tracking
- `src/knowledge/` — Qdrant vector store, file watcher on `D:/ai-knowledge/`
- `src/self-healer.ts` — port conflict resolution, provider circuit-breaking, watchdog

**Agent loop config:** `AGENT_LOOP_ENABLED=1`, `AGENT_LOOP_INTERVAL_MS=1800000` (30min)
**Task dispatch:** auto-executes complexity≤medium tasks, max 5/cycle, 5s delay between

**Approval gate (required before destructive ops):**

```typescript
const approval = await approvalStore.require(taskId, { timeout: 30000 });
if (!approval.granted) return { status: "awaiting_approval", taskId };
```

**Kelly criterion (market agent):**

```typescript
const f = (p * b - q) / b;
const position = Math.max(0, Math.min(f * bankroll, maxPosition));
```

**Startup (use start-all.bat or manually):**

```
1. Ollama          → already running or start exe
2. Qdrant          → D:\ai-cache\qdrant-bin\qdrant.exe  (port 6333)
3. Gateway         → cd gateway && tsx watch src/index.ts  (port 4123)
```

---

## market_agents

Stack: Node/TS, Kalshi async SDK, Railway auto-deploy from main.
Auth: RSA key at `D:/ai-knowledge/secrets/kalshi-private.pem` — env only, never commit.

---

## OpenClaw

Launch scripts in `D:/openclaw/`:

```
docker-desktop.cmd  → Docker Desktop
ollama-serve.cmd    → ollama.exe serve (port 11434)
gateway.cmd         → node openclaw/dist/index.js gateway --port 18789
START-AI-STACK.bat  → starts ALL services in order
```

---

## Work Prompt Template

```markdown
## Task: [Title] — [Repo]

### Context

- Why this matters / what it unblocks
- Affected components + dependencies

### Acceptance Criteria

- [ ] Specific, testable outcome
- [ ] Performance / security requirement
- [ ] Edge case handled

### Implementation Guide

1. Files to create/modify (full paths)
2. Pattern to follow (reference section above)
3. Test requirements

### Code Scaffold

[Starter code matching repo patterns]

### PR Checklist

- [ ] Branch: claude/<desc>-<sessionId>
- [ ] Lint passing
- [ ] Tests added
- [ ] Session URL in commit
- [ ] Copilot review requested via API
```

---

## Cross-Repo Anti-Patterns

- ❌ `gh` CLI — always `curl + $GH_PAT`
- ❌ SQL string interpolation
- ❌ TypeScript `any`
- ❌ Inline CSS (use Tailwind)
- ❌ Removing health endpoint keys
- ❌ Unvalidated API inputs
- ❌ React components without loading/error states
- ❌ Committing secrets or `.env` files
- ❌ Unscoped D1 queries in AtlasIT (missing `tenant_id`)
- ❌ Breaking unified data schema in AWW without `validate-unified.ts`
- ❌ Destructive agent ops in local-devops-ai without `approvalStore.require()`

---

## Detailed References

- `references/api-patterns.md` — Hono middleware, auth, CORS, rate limiting
- `references/ui-patterns.md` — React components, TailwindCSS, dashboard widgets
- `references/roadmap-parser.md` — Roadmap parsing rules and task generation
- `references/testing.md` — Vitest, Puppeteer, Miniflare patterns
- `references/work-prompt-templates.md` — Extended scaffolds per repo
