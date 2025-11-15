# Agent Router Worker

## Overview

The Agent Router Worker is a Cloudflare Worker that analyzes PR metadata and routes PRs to appropriate agents based on severity, file patterns, and keywords. It serves as the decision engine for autonomous PR management.

## Architecture

```
GitHub PR → Webhook/API → Router Worker → Routing Decision
                              ↓
                         Rules Engine
                              ↓
                    Severity Computation
                    Agent Assignment
                    Prohibited Pattern Check
                    Evidence Requirements
```

## Routing Rules

The worker uses `rules.json` to define routing behavior:

### Severity by Path
Maps file paths to severity levels:
- `docs/` → low
- `.github/workflows/` → high
- `EVIDENCE_SCHEMA.json` → medium
- `ops/` → high

### Severity by Keyword
Maps keywords in PR title to severity:
- `drift` → medium
- `security` → high
- `breaking` → high

### Codex Assignment Triggers
Files that trigger automatic Codex agent assignment:
- `DRIFT_DETECTION_SPEC.md`
- `EVIDENCE_SCHEMA.json`
- `AGENT_MODEL.md`
- `COPILOT_GRAMMAR.md`

### Evidence Required
Files that require evidence artifacts:
- `EVIDENCE_SCHEMA.json`
- `AGENT_MODEL.md`
- `.github/workflows/merge-orchestrator.yml`
- `ops/agent-router-worker/worker.ts`

### Prohibited Patterns
Patterns that escalate severity to critical:
- `TODO_REMOVE`
- `console.log(`
- `eval(`
- Hardcoded secrets patterns

## API

### Endpoint
```
POST /
```

### Request Headers
```
Content-Type: application/json
X-Simulate: true  # Optional: enables simulation mode with rule summary
```

### Request Body
```json
{
  "number": 123,
  "title": "feat: Add drift detection",
  "labels": ["feature", "automation"],
  "files_changed": [
    "DRIFT_DETECTION_SPEC.md",
    "scripts/detect-drift.ts"
  ],
  "author": "copilot-agent"
}
```

### Response
```json
{
  "decision_id": "550e8400-e29b-41d4-a716-446655440000",
  "severity": "medium",
  "agents": {
    "primary": "codex",
    "secondary": null
  },
  "evidence_required": ["DRIFT_DETECTION_SPEC.md"],
  "prohibited_hits": [],
  "timestamp": "2025-01-15T10:00:00.000Z",
  "rule_summary": {
    "matched_paths": ["DRIFT_DETECTION_SPEC.md -> medium"],
    "matched_keywords": ["drift -> medium"],
    "triggered_assignments": ["DRIFT_DETECTION_SPEC.md"]
  }
}
```

## Severity Levels

| Severity | Description | Auto-Merge | Approval Required |
|----------|-------------|------------|-------------------|
| **low** | Documentation, minor changes | ✅ | ❌ |
| **medium** | Schema changes, automation updates | ❌ | Codex or maintainer |
| **high** | Workflows, security files, infrastructure | ❌ | 2+ maintainers |
| **critical** | Prohibited patterns detected | ❌ | Blocked |

## Agent Assignment

### Primary Agents
- **github-review**: Default for standard PRs
- **codex**: Auto-assigned when trigger files changed
- **security-review**: Assigned for high/critical severity

### Secondary Agents
- Assigned for high/critical severity PRs
- Provides additional review layer

## Deployment

### Local Development
```bash
cd ops/agent-router-worker
npx wrangler dev
```

### Test Endpoint
```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -H "X-Simulate: true" \
  -d '{
    "number": 1,
    "title": "test PR",
    "labels": [],
    "files_changed": ["README.md"],
    "author": "test"
  }'
```

### Production Deployment
```bash
npx wrangler deploy
```

### Environment Variables
Configure in Wrangler dashboard or via secrets:
```bash
wrangler secret put GITHUB_TOKEN
```

## Integration

### GitHub Workflow Integration
The `agent-events.yml` workflow calls the router worker via HTTP:

```yaml
- name: Call router worker
  run: |
    curl -X POST https://agent-router.workers.dev \
      -H "Content-Type: application/json" \
      -d '{"number": ${{ github.event.pull_request.number }}, ...}'
```

### Simulation Mode
Use `X-Simulate: true` header to get detailed rule matching info without side effects:
```bash
curl -X POST http://localhost:8787 \
  -H "X-Simulate: true" \
  -d '{ ... }'
```

## Future Enhancements

- [ ] Store rules in KV for dynamic updates
- [ ] Integrate with GitHub API for evidence validation
- [ ] Add Durable Objects for stateful routing history
- [ ] Implement ML-based severity prediction
- [ ] Add webhook endpoint for real-time GitHub events
- [ ] Store routing decisions in D1 database for analytics

## Testing

### Unit Tests
```bash
npm test -- worker.test.ts
```

### Integration Tests
```bash
npm run test:integration -- router
```

## Monitoring

Worker metrics available in Cloudflare dashboard:
- Request count
- Error rate
- Response time
- CPU time

## Troubleshooting

### Common Issues

**Worker returns 500**
- Check worker logs: `wrangler tail`
- Verify request body format matches PRMetadata interface
- Ensure rules.json is valid JSON

**Incorrect severity computed**
- Review matched paths/keywords in simulation mode
- Verify rules.json severity mappings
- Check for multiple matching rules (highest severity wins)

**CORS errors**
- Ensure `Access-Control-Allow-Origin` header present
- Add origin to allowed origins list if needed

## References

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- AGENT_MODEL.md
- COPILOT_GRAMMAR.md
