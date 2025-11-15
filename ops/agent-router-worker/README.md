# Agent Router Worker

Autonomous agent routing worker for AtlasIT framework.

## Purpose

Evaluates PR metadata and routes to appropriate agent (Copilot, Codex, or Human) based on:
- File paths changed
- PR title and description keywords
- Prohibited patterns
- Severity thresholds

## Endpoints

### `GET /health`
Returns worker health status and rules version.

**Response:**
```json
{
  "status": "healthy",
  "service": "agent-router-worker",
  "version": "1.0.0",
  "rules_hash": "abc123..."
}
```

### `POST /route`
Evaluates PR metadata and returns routing decision.

**Request:**
```json
{
  "pr_number": 123,
  "title": "feat: Add security controls",
  "files_changed": [".github/workflows/ci.yml", "ops/worker.ts"],
  "labels": ["security"],
  "author": "copilot"
}
```

**Response:**
```json
{
  "decision_id": "uuid",
  "timestamp": "2025-11-15T10:30:00.000Z",
  "severity": "medium",
  "assignee": "codex",
  "rule_version": "1.0.0",
  "rules_hash": "sha256...",
  "triggers": ["high_priority_path:.github/workflows/"],
  "rule_summary": "Matched 1 trigger(s)...",
  "pr_metadata": { ... }
}
```

## Routing Logic

**Severity Levels:**
- `low`: Copilot handles (docs, minor fixes)
- `medium`: Codex handles (infrastructure, workflows, scripts)
- `high`: Codex handles (security-related, critical paths)
- `critical`: Human review required (prohibited patterns)

**Deterministic Behavior:**
- Same PR metadata produces same decision_id (based on content hash)
- Rules version and hash included for auditability
- Triggers list documents why routing decision was made

## Deployment

```bash
cd ops/agent-router-worker
wrangler deploy
```

## Testing

See `scripts/simulate-routing.ts` for local simulation.
