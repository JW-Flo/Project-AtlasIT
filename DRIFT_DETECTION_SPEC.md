# Drift Detection Specification

## Purpose

Drift detection ensures repository structure matches canonical requirements defined in planning documents. When drift is detected, the system automatically creates fix PRs categorized by severity and type.

## Algorithm

### 1. Structure Definition

The canonical structure is defined in code as a required file tree:

```typescript
const REQUIRED_STRUCTURE = {
  ".github/workflows/": ["ci.yml", "merge-orchestrator.yml", "agent-events.yml"],
  "ops/agent-router-worker/": ["worker.ts", "wrangler.toml", "rules.json", "README.md"],
  "scripts/": ["emit-evidence.ts", "nist-verify.ts", "run-opa.sh", "simulate-routing.ts"],
  "docs/": ["NIST_AUTOMATION.md", "AUTONOMY_DIAGRAMS.md"],
  "": ["AGENT_MODEL.md", "AGENT_HANDBOOK.md", "ROADMAP_AGENT_AUTONOMY.md", 
       "DRIFT_DETECTION_SPEC.md", "COPILOT_GRAMMAR.md", "EVIDENCE_SCHEMA.json"],
  ".evidence/": [".keep"]
};
```

### 2. Detection Process

**Step 1: Scan Repository**
```typescript
async function scanRepository(basePath: string): Promise<string[]> {
  const files: string[] = [];
  // Recursively walk file tree
  // Collect all file paths relative to repo root
  return files;
}
```

**Step 2: Compare Against Required**
```typescript
interface DriftItem {
  path: string;
  status: "missing" | "present";
  category: "structure" | "security" | "roadmap";
  severity: "low" | "medium" | "high";
}

async function detectDrift(
  required: Record<string, string[]>,
  actual: string[]
): Promise<DriftItem[]> {
  const drift: DriftItem[] = [];
  
  for (const [dir, files] of Object.entries(required)) {
    for (const file of files) {
      const fullPath = `${dir}${file}`;
      if (!actual.includes(fullPath)) {
        drift.push({
          path: fullPath,
          status: "missing",
          category: categorizeFile(fullPath),
          severity: computeSeverity(fullPath)
        });
      }
    }
  }
  
  return drift;
}
```

### 3. Categorization Rules

**Structure Drift**:
- Missing workflow files
- Missing documentation
- Missing directory structure

**Security Drift**:
- Missing `EVIDENCE_SCHEMA.json`
- Missing `.evidence/` directory
- Missing security validation scripts

**Roadmap Drift**:
- Missing `ROADMAP_AGENT_AUTONOMY.md`
- Missing agent model definitions
- Missing handbook documentation

### 4. Severity Computation

| File Pattern | Severity | Rationale |
|-------------|----------|-----------|
| `.github/workflows/*.yml` | high | Breaks CI/CD |
| `EVIDENCE_SCHEMA.json` | high | Compliance requirement |
| `scripts/nist-verify.ts` | medium | Validation tooling |
| `docs/*.md` | low | Documentation only |
| `*GRAMMAR.md`, `*HANDBOOK.md` | medium | Operational guidance |

## Auto-Fix PR Creation

### Branch Naming Convention

- `drift/structure-fix-<timestamp>`
- `drift/security-fix-<timestamp>`
- `drift/roadmap-fix-<timestamp>`

### PR Template

```markdown
## Drift Detection Auto-Fix

**Category**: {structure|security|roadmap}
**Severity**: {low|medium|high}
**Detection Time**: {ISO8601 timestamp}

### Missing Files

- [ ] {file1}
- [ ] {file2}

### Evidence

Trace ID: {uuid}
Detection Run: {workflow_run_url}

### Validation

- [ ] All required files created
- [ ] Files conform to grammar specifications
- [ ] Evidence artifact emitted
- [ ] OPA policies pass

**Auto-merge**: {enabled for low severity only}
```

### Implementation

```typescript
async function createDriftPR(
  drift: DriftItem[],
  category: string
): Promise<string> {
  const branch = `drift/${category}-fix-${Date.now()}`;
  const traceId = randomUUID();
  
  // Create branch
  await git.createBranch(branch);
  
  // Generate missing files with templates
  for (const item of drift) {
    const template = await loadTemplate(item.path);
    await writeFile(item.path, template);
  }
  
  // Emit evidence
  const evidence = {
    trace_id: traceId,
    control_id: "DRIFT-001",
    timestamp: new Date().toISOString(),
    agent: "drift-detector",
    action: "auto_fix",
    result: "pass",
    metadata: { drift_count: drift.length, category }
  };
  await writeFile(`.evidence/${traceId}.json`, JSON.stringify(evidence, null, 2));
  
  // Create PR
  const pr = await github.createPullRequest({
    title: `[AUTO] Drift fix: ${category}`,
    body: generatePRBody(drift, traceId),
    head: branch,
    base: "main"
  });
  
  return pr.url;
}
```

## Detection Output Schema

```json
{
  "detection_id": "uuid",
  "timestamp": "ISO8601",
  "drift_items": [
    {
      "path": "string",
      "status": "missing|present",
      "category": "structure|security|roadmap",
      "severity": "low|medium|high"
    }
  ],
  "auto_fix_prs": [
    {
      "category": "string",
      "pr_url": "string",
      "branch": "string",
      "trace_id": "uuid"
    }
  ],
  "summary": {
    "total_drift_items": 0,
    "by_category": {},
    "by_severity": {}
  }
}
```

## Evidence Emission

Every drift detection run emits evidence:

```json
{
  "trace_id": "uuid",
  "control_id": "DRIFT-001",
  "timestamp": "ISO8601",
  "agent": "drift-detector",
  "action": "scan",
  "result": "pass|fail",
  "metadata": {
    "drift_count": 0,
    "categories_affected": [],
    "auto_fix_prs_created": 0
  }
}
```

## Workflow Integration

Drift detection runs:
1. **On Schedule**: Weekly via cron trigger
2. **On Demand**: Manual workflow dispatch
3. **Post-Merge**: After main branch updates

**Merge Blocking**: Open drift PRs of severity `high` block other merges until resolved.

## Testing

Simulate drift detection locally:

```bash
npm run test:drift -- --dry-run
```

Expected output: JSON detection result without creating PRs.
