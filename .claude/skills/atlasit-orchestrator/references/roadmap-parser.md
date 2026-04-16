# Roadmap Parser & Work Prompt Generator

## Roadmap Item Structure

Roadmap items can be provided in various formats. Parse them into a normalized structure:

```typescript
interface RoadmapItem {
  id: string; // e.g., "ROAD-123" or auto-generated
  title: string; // Brief, action-oriented title
  description?: string; // Detailed description
  stage: Stage; // backlog | planned | in-progress | review | done
  priority: Priority; // critical | high | medium | low
  type: ItemType; // feature | bugfix | refactor | infra | docs
  estimate?: string; // T-shirt size: XS | S | M | L | XL
  dependencies?: string[]; // IDs of blocking items
  tags?: string[]; // e.g., ["frontend", "api", "database"]
  acceptanceCriteria?: string[];
}
```

## Parsing Rules

### From Markdown Checklist

```markdown
## Planned

- [ ] Add real-time charging notifications (high, M) #frontend #api
- [ ] Implement trip history export (medium, S) #api
- [x] Fix map marker clustering (done)
```

Parse as:

```typescript
{
  id: 'ROAD-001',
  title: 'Add real-time charging notifications',
  stage: 'planned',
  priority: 'high',
  estimate: 'M',
  tags: ['frontend', 'api'],
}
```

### From GitHub Issues

Extract from issue title, labels, and body:

- Title → `title`
- Labels → `priority`, `type`, `tags`
- Body sections → `description`, `acceptanceCriteria`
- Milestone → `stage`

### From Plain Text

```
Build a battery degradation chart showing health over time
```

Infer:

- Type: `feature` (adding new capability)
- Tags: `['frontend', 'charts', 'analytics']`
- Estimate: `M` (new component + data fetching)

## Work Prompt Template

Generate structured prompts for each roadmap item:

```markdown
## Task: ${item.title}

**ID:** ${item.id} | **Priority:** ${item.priority} | **Estimate:** ${item.estimate}

### Context

${generateContext(item)}

### Acceptance Criteria

${item.acceptanceCriteria?.map(ac => `- [ ] ${ac}`).join('\n') || generateDefaultCriteria(item)}

### Technical Approach

#### Files to Create/Modify

${generateFileList(item)}

#### Implementation Steps

${generateSteps(item)}

#### Code Scaffolds

${generateScaffolds(item)}

### Testing Requirements

${generateTestRequirements(item)}

### Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing (>80% coverage for new code)
- [ ] No TypeScript errors
- [ ] Responsive on mobile/desktop
- [ ] Documented in code comments
- [ ] PR reviewed and approved
```

## Context Generation

Based on item type and tags, generate relevant context:

```typescript
function generateContext(item: RoadmapItem): string {
  const contexts: string[] = [];

  // Type-based context
  if (item.type === "feature") {
    contexts.push("This is a new feature that adds functionality to the application.");
  } else if (item.type === "bugfix") {
    contexts.push("This fixes an existing issue affecting user experience.");
  }

  // Tag-based context
  if (item.tags?.includes("api")) {
    contexts.push("Involves backend API changes - follow Hono patterns in api-patterns.md");
  }
  if (item.tags?.includes("frontend")) {
    contexts.push("Involves UI changes - follow component patterns in ui-patterns.md");
  }
  if (item.tags?.includes("database")) {
    contexts.push("Requires D1 schema changes - create migration file");
  }

  // Dependencies
  if (item.dependencies?.length) {
    contexts.push(`Blocked by: ${item.dependencies.join(", ")}`);
  }

  return contexts.join("\n");
}
```

## File List Generation

Map item tags to expected file changes:

```typescript
function generateFileList(item: RoadmapItem): string {
  const files: string[] = [];

  if (item.tags?.includes("api")) {
    files.push(
      "backend/edge-worker/src/routers/[feature].ts - New/modified router",
      "backend/edge-worker/src/schemas/[feature].ts - Zod schemas",
      "backend/edge-worker/tests/[feature].test.ts - Unit tests",
    );
  }

  if (item.tags?.includes("frontend")) {
    files.push(
      "frontend/src/components/[feature]/[Component].tsx - React component",
      "frontend/src/hooks/use[Feature].ts - Custom hook (if needed)",
      "frontend/src/types/[feature].ts - TypeScript interfaces",
    );
  }

  if (item.tags?.includes("database")) {
    files.push(
      "backend/edge-worker/migrations/NNNN_[feature].sql - Migration",
      "backend/edge-worker/src/services/[feature].ts - DB queries",
    );
  }

  return files.map((f) => `- ${f}`).join("\n");
}
```

## Scaffold Generation

Generate starter code based on item type:

### API Endpoint Scaffold

```typescript
// For items tagged with 'api'
const apiScaffold = `
\`\`\`typescript
// src/routers/${featureName}.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ${pascalCase(featureName)}Schema } from '../schemas/${featureName}';

const router = new Hono();

router.get('/${featureName}', async (c) => {
  // TODO: Implement
  return c.json({ status: 'success', data: [] });
});

router.post('/${featureName}',
  zValidator('json', ${pascalCase(featureName)}Schema),
  async (c) => {
    const body = c.req.valid('json');
    // TODO: Implement
    return c.json({ status: 'success', data: body }, 201);
  }
);

export { router as ${camelCase(featureName)}Router };
\`\`\`
`;
```

### React Component Scaffold

```typescript
// For items tagged with 'frontend'
const componentScaffold = `
\`\`\`tsx
// src/components/${featureName}/${pascalCase(featureName)}.tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ${pascalCase(featureName)}Props {
  className?: string;
  // TODO: Add props
}

export function ${pascalCase(featureName)}({ className }: ${pascalCase(featureName)}Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <${pascalCase(featureName)}Skeleton />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className={cn("", className)}>
      {/* TODO: Implement */}
    </div>
  );
}

function ${pascalCase(featureName)}Skeleton() {
  return (
    <div className="animate-pulse">
      {/* TODO: Skeleton UI */}
    </div>
  );
}
\`\`\`
`;
```

### Migration Scaffold

```typescript
// For items tagged with 'database'
const migrationScaffold = `
\`\`\`sql
-- migrations/NNNN_${snakeCase(featureName)}.sql
-- Up
CREATE TABLE IF NOT EXISTS ${snakeCase(featureName)} (
  id TEXT PRIMARY KEY,
  -- TODO: Add columns
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_${snakeCase(featureName)}_created_at 
  ON ${snakeCase(featureName)}(created_at);

-- Down
DROP TABLE IF EXISTS ${snakeCase(featureName)};
\`\`\`
`;
```

## Batch Processing

When given multiple roadmap items, generate a prioritized work plan:

```markdown
# Sprint Work Plan

## Critical Path (Must Complete)

1. [ROAD-001] Fix authentication bug (P0, XS)
2. [ROAD-005] Database migration for new schema (P0, M)

## High Priority

3. [ROAD-002] Add charging notifications (P1, M) - depends on ROAD-005
4. [ROAD-003] Implement trip export (P1, S)

## Medium Priority (If Time Permits)

5. [ROAD-004] UI polish for dashboard (P2, S)

---

## Individual Task Prompts

### ROAD-001: Fix authentication bug

[Full work prompt...]

### ROAD-005: Database migration

[Full work prompt...]
```

## Agent Handoff Format

When generating prompts for agent dissemination:

```markdown
---
agent: claude
task_id: ROAD-123
priority: high
timeout: 30m
context_files:
  - references/api-patterns.md
  - references/testing.md
---

# Task Assignment

[Work prompt content...]

## Success Criteria for Handoff

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Changes committed with conventional message
- [ ] Ready for human review

## On Completion

1. Update change feed with completion entry
2. Mark task as 'review' stage
3. Notify orchestrator
```

## Example: Full Parse & Generate

**Input:**

```
Add a battery health chart to the dashboard showing degradation over time
```

**Output:**

```markdown
## Task: Add Battery Health Degradation Chart

**ID:** ROAD-042 | **Priority:** medium | **Estimate:** M

### Context

This feature adds a new analytics visualization to help users understand their Tesla's battery health trends over time. It combines historical data from the Tessie API with D1-stored telemetry.

Involves UI changes - follow component patterns in ui-patterns.md
Involves backend API changes - follow Hono patterns in api-patterns.md

### Acceptance Criteria

- [ ] Chart displays battery health % over selectable time periods (1mo, 6mo, 1yr, all)
- [ ] Shows degradation trend line with projected future health
- [ ] Tooltip shows exact values on hover
- [ ] Handles loading and error states gracefully
- [ ] Responsive: stacks appropriately on mobile
- [ ] Data refreshes on dashboard reload

### Technical Approach

#### Files to Create/Modify

- `frontend/src/components/charts/BatteryHealthChart.tsx` - Main chart component
- `frontend/src/hooks/useBatteryHealth.ts` - Data fetching hook
- `backend/edge-worker/src/routers/analytics.ts` - Add /battery-health endpoint
- `backend/edge-worker/src/services/analytics.ts` - Aggregation logic

#### Implementation Steps

1. **Backend**: Create analytics endpoint that aggregates battery_health readings by day
2. **Frontend**: Build chart component using Recharts (see ui-patterns.md)
3. **Hook**: Create useBatteryHealth hook with period parameter
4. **Integration**: Add chart to Dashboard page in metrics grid
5. **Polish**: Add loading skeleton, error boundary, responsive styles

#### Code Scaffolds

[API endpoint scaffold]
[React component scaffold with Recharts]

### Testing Requirements

- Unit test for aggregation logic (mock D1)
- Component test for chart rendering with mock data
- E2E test for full flow on dashboard

### Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing (>80% coverage for new code)
- [ ] No TypeScript errors
- [ ] Responsive on mobile/desktop
- [ ] Documented in code comments
- [ ] PR reviewed and approved
```
