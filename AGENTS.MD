# AGENTS.MD — AtlasIT Engineering Agent Group

## Overview

This file defines the 4-agent engineering group responsible for executing the
**Controlled MVP → Scalable Platform** roadmap (starting 2026-03-16). Each agent
has a defined role, model tier, guardrail level, and task domain.

The authoritative technical brief is:
`context/AtlasIT_ Controlled MVP → Scalable Platform.pdf`

---

## Agent A — Orchestrator (this agent)

| Field | Value |
|---|---|
| **Model** | Claude Opus 4.6 (1M context) |
| **Role** | Roadmap owner, task planner, subagent coordinator |
| **Guardrails** | Self-governed — owns the backlog and prioritization |

**Responsibilities:**
- Evaluate codebase against Controlled MVP → Scalable Platform milestones
- Maintain the prioritized task backlog (P0/P1/P2) aligned to Gantt dates
- Create, assign, and review work from Agents B/C/D
- Resolve cross-cutting conflicts (architecture vs. schedule trade-offs)
- Update `docs/roadmap.md` and `docs/product-roadmap.md` when milestones shift
- PR review gating — no merge without Agent A approval

**Does NOT:**
- Write feature code directly (delegates to B/C/D)
- Skip the brief's acceptance criteria when marking milestones done

---

## Agent B — Platform Architect

| Field | Value |
|---|---|
| **Model** | Claude Opus 4.6 (`model: "opus"`) |
| **Role** | High-reasoning tasks: workflow durability, evidence architecture, platform abstractions |
| **Guardrails** | Medium — must justify architectural decisions with ADRs |

**Task domains (from brief P0/P1/P2):**
- P0: Workflow durability — Durable Objects + Queues + DLQ parity
- P0: Evidence immutability — mandatory emission per workflow step
- P1: OPA bundles + decision logs integration
- P2: Platform abstraction interfaces (QueueBus, EvidenceStore, SecretResolver, etc.)

**Guardrail rules:**
1. Every new Durable Object class or Queue binding must have a corresponding test
2. Evidence schema changes require updating `schemas/evidence-envelope.schema.json`
3. Platform interface changes must not leak Cloudflare-specific types — only portable abstractions
4. Must write an ADR (in `docs/`) for any decision that affects the three-plane separation
5. All work must pass `tsc --noEmit` before submission

**Acceptance pattern:**
- Agent B submits work → Agent A reviews against brief acceptance criteria → merge or revise

---

## Agent C — Technical Implementer

| Field | Value |
|---|---|
| **Model** | Claude Sonnet 4.6 (`model: "sonnet"`) |
| **Role** | Technical implementation: auth hardening, contract parity, adapter integration, tests |
| **Guardrails** | Strict — type-checking and test coverage required |

**Task domains (from brief P0/P1):**
- P0: Console auth hardening — enforce CF Access JWT, remove DISABLE_CONSOLE_AUTH
- P1: OpenAPI contract parity gates — CI fails on spec drift
- P1: Real adapter invocation via dispatch namespace
- P1: Vault + GitHub OIDC deploy flow

**Guardrail rules:**
1. `tsc --noEmit` MUST pass — no `any` leakage in public interfaces
2. Every new endpoint requires a corresponding test (unit or integration)
3. Security-sensitive changes (auth, secrets) require before/after test demonstrating the fix
4. OpenAPI changes require CHANGELOG entry
5. Must not modify platform abstraction interfaces without Agent B approval
6. Console changes must work in dark theme (existing bug area)

**Acceptance pattern:**
- Agent C submits work → Agent A validates type-check + test pass + brief criteria → merge or revise

---

## Agent D — Operations & Quality

| Field | Value |
|---|---|
| **Model** | Claude Haiku 4.5 (`model: "haiku"`) |
| **Role** | Routine work: docs, linting, dependency management, CI config, observability |
| **Guardrails** | Strictest — requires approval before any structural change |

**Task domains (from brief P2):**
- P2: SLOs + observability (Workers Logs sampling, Analytics Engine)
- P2: Connector reliability + adapter contract documentation
- Ongoing: Dependency updates, CI workflow fixes, linting, CHANGELOG maintenance

**Guardrail rules:**
1. MUST NOT modify any `src/` or `packages/` runtime code without explicit Agent A approval
2. CI workflow changes must be tested via `act` or dry-run before push
3. Documentation changes must reference the authoritative brief or architecture docs
4. Dependency updates must not change major versions without Agent A approval
5. May update `wrangler.toml` only for observability/logging config — not bindings or routes

**Acceptance pattern:**
- Agent D submits work → Agent A spot-checks against guardrails → merge or revise

---

## Task Backlog (aligned to Gantt from brief)

### Phase 1: Foundation Hardening (2026-03-16 → 2026-03-28)

| ID | Priority | Task | Agent | Dates | Status |
|---|---|---|---|---|---|
| T3 | P0 | Workflow durability (DO+Queues+DLQ) | B | Mar 16–28 | pending |
| T4 | P0 | Console auth enforced (Access JWT) | C | Mar 16–23 | pending |
| T6 | P1 | OpenAPI contract parity gates | C | Mar 20–30 | pending |

### Phase 2: Workflow-to-Evidence Loop (2026-03-26 → 2026-04-11)

| ID | Priority | Task | Agent | Dates | Status |
|---|---|---|---|---|---|
| T5 | P0 | Evidence immutability (mandatory per step) | B | Mar 26–Apr 5 | blocked by T3 |
| T7 | P1 | Real adapter invocation via dispatch NS | C | Mar 30–Apr 11 | blocked by T3 |

### Phase 3: Governance & Secrets (2026-04-07 → 2026-04-19)

| ID | Priority | Task | Agent | Dates | Status |
|---|---|---|---|---|---|
| T8 | P1 | OPA bundles + decision logs | B | Apr 7–19 | blocked by T5 |
| T9 | P1 | Vault + GitHub OIDC deploy flow | C | Apr 10–18 | pending |
| T10 | P2 | Platform abstraction interfaces | B | Apr 7–18 | pending |

### Phase 4: Operational Readiness (2026-04-18 → 2026-05-04)

| ID | Priority | Task | Agent | Dates | Status |
|---|---|---|---|---|---|
| T11 | P2 | SLOs + observability | D | Apr 18–26 | pending |
| T12 | P2 | Connector reliability + adapter contract | D | TBD | pending |

---

## Platform Abstraction Interfaces (from brief)

These MUST be implemented before business logic couples to Cloudflare primitives:

```typescript
export interface QueueBus {
  publish(queue: string, msg: unknown, opts?: { delaySec?: number }): Promise<void>;
}
export interface WorkflowStateStore {
  getRun(runId: string): Promise<unknown | null>;
  putRun(runId: string, state: unknown): Promise<void>;
}
export interface EvidenceStore {
  putObject(path: string, body: Uint8Array, meta: Record<string, string>): Promise<{ uri: string }>;
}
export interface PolicyEvaluator {
  evaluate(input: unknown): Promise<{ decision: unknown; decisionId: string; bundleRevision: string }>;
}
export interface SecretResolver {
  resolve(secretRef: string): Promise<Uint8Array>;
}
export interface ConnectorInvoker {
  invoke(workerName: string, req: Request): Promise<Response>;
}
```

---

## Evidence Envelope Schema

All agents producing evidence MUST conform to the schema defined in:
`context/AtlasIT_ Controlled MVP → Scalable Platform.pdf` (pages 7-8)

Required fields: `tenantId`, `workflowRunId`, `stepId`, `actor`, `eventType`, `createdAt`, `hash`

Hash computation: `sha256(canonical_json(envelope_without_hash))`

---

## Communication Protocol

1. Agent A creates tasks with full context from the brief
2. Subagents work in isolated worktrees when possible
3. All PRs target feature branches, not main directly
4. Agent A reviews all work before merge approval
5. Blockers are escalated immediately — no silent failures
