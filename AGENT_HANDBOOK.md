# Agent Handbook

## Purpose

This handbook provides operational guidance for autonomous agents working within the AtlasIT ecosystem. All agents must follow these protocols to ensure deterministic, compliant, and auditable operations.

## Core Principles

1. **Evidence-First**: Every action generates verifiable evidence
2. **Idempotent Operations**: All workflows can be safely retried
3. **Zero Trust**: Validate identity and authorization on every request
4. **Fail Fast**: Detect and report errors immediately with trace context
5. **Grammar Compliance**: Adhere strictly to Copilot Grammar specifications

## Workflow Patterns

### PR Creation Flow

1. Agent creates branch: `feature/<scope>` or `drift/<type>`
2. Commits include `[AUTO]` prefix in title
3. Emit evidence artifact to `.evidence/`
4. Trigger routing simulation via `agent-events.yml`
5. Router assigns agents and severity
6. Apply labels: `severity:medium`, `agent:codex`, etc.
7. Await approval if medium+ severity
8. Run merge-orchestrator validations
9. Auto-merge on approval or manual merge

### Evidence Emission Pattern

```typescript
import { randomUUID } from "crypto";

const evidence = {
  trace_id: randomUUID(),
  control_id: "OPA-001",
  timestamp: new Date().toISOString(),
  agent: "router-worker",
  action: "pr_routing",
  result: "pass",
  metadata: { pr_number: 123, severity: "medium" },
};

// Write to .evidence/
await writeFile(`.evidence/${evidence.trace_id}.json`, JSON.stringify(evidence, null, 2));
```

## Routing Rules

Agents consult `ops/agent-router-worker/rules.json`:

- **Severity by Path**: Classify files by directory/filename
- **Severity by Keyword**: Detect keywords in PR title/description
- **Agent Assignment Triggers**: Auto-assign Codex for schema changes
- **Evidence Required**: List of files requiring evidence emission
- **Prohibited Patterns**: Block merge if found (e.g., `TODO_REMOVE`, hardcoded secrets)

## Error Handling

- **Transient Failures**: Retry with exponential backoff
- **Schema Violations**: Fail fast with detailed error message
- **OPA Policy Failures**: Block merge, emit evidence with `result: "fail"`
- **Drift Detection**: Auto-create fix PR, do not block current PR

## Security Requirements

- Never log or echo secrets
- Use GitHub Actions secrets with rotation policy
- Validate OIDC tokens for identity
- Scan for secrets before commit
- Run CodeQL on all TypeScript changes

## Commit Message Format

```
<type>: <short description>

<optional longer description>

Evidence: <trace_id>
Refs: <issue/PR numbers>
```

Types: `feat`, `fix`, `ops`, `docs`, `test`, `refactor`

## Approval Requirements

| Severity | Auto-Merge | Approval Required           |
| -------- | ---------- | --------------------------- |
| low      | ✅         | ❌                          |
| medium   | ❌         | ✅ (Codex or maintainer)    |
| high     | ❌         | ✅ (2 maintainers)          |
| critical | ❌         | ✅ (Manual security review) |

## Compliance Mapping

All evidence artifacts map to:

- **NIST 800-53**: Control families (AU, AC, CM, etc.)
- **SOC2**: Trust service criteria
- **ISO27001**: Information security controls

Reference `docs/NIST_AUTOMATION.md` for detailed mapping.
