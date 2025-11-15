# Copilot Grammar

## Overview

The Copilot Grammar defines strict coding standards for all autonomous agents and human developers working in the AtlasIT ecosystem. Adherence to this grammar ensures consistency, maintainability, and automated validation.

## Language and Runtime

- **Primary Language**: TypeScript 5+ with strict mode enabled
- **Runtime**: Cloudflare Workers (workerd), Node.js 20+ for tooling
- **Module System**: ES Modules (ESM) exclusively

## TypeScript Configuration

### Required compiler options:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### Type Annotations
- All function parameters must have explicit types
- All function return types must be explicit (no inference for exports)
- No usage of `any` type (use `unknown` if type truly unknown)
- Prefer interfaces over type aliases for object shapes

**Example**:
```typescript
// ✅ Correct
export async function processRequest(
  request: Request,
  env: Env
): Promise<Response> {
  // Implementation
}

// ❌ Incorrect - missing return type
export async function processRequest(request: Request, env: Env) {
  // Implementation
}
```

## Code Organization

### Exports
- **Named exports only** - no default exports
- Export functions, interfaces, types, and constants explicitly
- Organize exports at the end of the file or inline

**Example**:
```typescript
// ✅ Correct
export interface Config {
  apiKey: string;
}

export function loadConfig(): Config {
  // Implementation
}

// ❌ Incorrect - default export
export default function loadConfig(): Config {
  // Implementation
}
```

### File Structure
```
1. Imports (external, then internal)
2. Type definitions (interfaces, types, enums)
3. Constants
4. Helper functions (private)
5. Exported functions
6. Main export (if Worker: fetch handler)
```

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Types/Interfaces | PascalCase | `RouterConfig`, `EvidenceItem` |
| Functions | camelCase | `emitEvidence`, `computeSeverity` |
| Variables | camelCase | `traceId`, `prNumber` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| Environment vars | UPPER_SNAKE_CASE | `GITHUB_TOKEN`, `WORKER_ENV` |
| Workflow files | kebab-case | `merge-orchestrator.yml`, `agent-events.yml` |
| Private helpers | _camelCase | `_parseMetadata`, `_validateInput` |

## Formatting

### Indentation
- **2 spaces** (no tabs)
- Consistent across all file types (TS, JSON, YAML, MD)

### Line Length
- Maximum 100 characters
- Break long lines at logical boundaries

### Strings
- Double quotes for strings: `"example"`
- Template literals for interpolation: `` `Hello ${name}` ``

### Semicolons
- Always use semicolons at statement ends

### Trailing Commas
- Use ES5 trailing commas in objects/arrays

**Example**:
```typescript
const config = {
  apiKey: "secret",
  timeout: 5000,
}; // Trailing comma
```

## Comments

### Documentation Comments
```typescript
// Describe the purpose and intent of the function
// Include important assumptions or constraints
export function computeSeverity(files: string[]): Severity {
  // Implementation
}
```

### Inline Comments
- Use `//` for single-line comments
- Place above the code being explained
- Start with lowercase unless starting a sentence
- Describe "why" not "what" (code should be self-documenting)

**Example**:
```typescript
// Calculate weighted severity based on file patterns
// Higher weights for security-critical paths
const severity = files.reduce((acc, file) => {
  return acc + getWeight(file);
}, 0);
```

### TODO Comments
- Format: `// TODO(owner): description`
- Include issue reference if available
- Never use `TODO_REMOVE` (prohibited pattern)

## Error Handling

### Async Operations
- Always use `try-catch` for async operations
- Provide context in error messages
- Include trace_id in error logs

**Example**:
```typescript
try {
  const result = await fetchData(url);
  return result;
} catch (error) {
  console.error(`Failed to fetch data: ${error.message}`, {
    trace_id: traceId,
    url,
  });
  throw error;
}
```

### Validation
- Fail fast with descriptive errors
- Use Zod or similar for runtime validation
- Never silently fail

## Imports

### Order
1. Node built-ins: `import { randomUUID } from "crypto";`
2. External packages: `import { z } from "zod";`
3. Internal packages: `import { Evidence } from "@atlasit/shared";`
4. Local modules: `import { helper } from "./utils";`

### Style
- Named imports preferred
- Group imports with blank lines between categories
- No wildcard imports unless necessary

**Example**:
```typescript
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";

import { z } from "zod";

import { Evidence } from "@atlasit/shared";

import { computeSeverity } from "./severity";
import { loadRules } from "./rules";
```

## Function Design

### Principles
- Single responsibility
- Maximum 50 lines per function
- Maximum 4 parameters (use object for more)
- Pure functions preferred (no side effects when possible)

### Async/Await
- Prefer `async/await` over `.then()` chains
- Use `Promise.all()` for parallel operations
- Never mix callback and promise patterns

**Example**:
```typescript
// ✅ Correct - parallel execution
async function loadData(): Promise<Data> {
  const [users, roles] = await Promise.all([
    fetchUsers(),
    fetchRoles(),
  ]);
  return { users, roles };
}

// ❌ Incorrect - sequential when parallel possible
async function loadData(): Promise<Data> {
  const users = await fetchUsers();
  const roles = await fetchRoles();
  return { users, roles };
}
```

## Commit Messages

### Format
```
<type>: <short summary>

<optional detailed description>

Evidence: <trace_id>
Refs: #<issue_number>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `ops`: Operational/infrastructure change
- `docs`: Documentation only
- `test`: Test additions or modifications
- `refactor`: Code restructuring without behavior change

### Prefix for Automation
- `[AUTO]` prefix for agent-generated commits
- Example: `[AUTO] feat: Add drift detection workflow`

## Security

### Prohibited Patterns
- Hardcoded secrets: API keys, tokens, passwords
- `console.log()` in production code (use proper logging)
- `eval()` or `Function()` constructors
- Unsafe string interpolation in shell commands
- Direct use of `any` type

### Required Practices
- Validate all external inputs
- Use parameterized queries/commands
- Sanitize user-provided data
- Never log sensitive information
- Use environment variables for configuration

## Testing

### File Naming
- Test files: `*.test.ts`
- Spec files: `*.spec.ts`
- Co-locate with source or in `tests/` directory

### Test Structure
```typescript
import { describe, it, expect } from "vitest";

describe("computeSeverity", () => {
  it("returns high for security files", () => {
    const files = ["EVIDENCE_SCHEMA.json"];
    expect(computeSeverity(files)).toBe("high");
  });
  
  it("returns low for documentation files", () => {
    const files = ["docs/README.md"];
    expect(computeSeverity(files)).toBe("low");
  });
});
```

## Cloudflare Worker Specifics

### Module Format
```typescript
export interface Env {
  // Define environment bindings
  GITHUB_TOKEN: string;
  RULES_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Worker logic
  },
};
```

### Durable Objects
```typescript
export class RouterState implements DurableObject {
  constructor(private state: DurableObjectState, private env: Env) {}
  
  async fetch(request: Request): Promise<Response> {
    // Durable Object logic
  }
}
```

## Validation Checklist

Before committing code, verify:

- [ ] TypeScript strict mode enabled
- [ ] All exports are named (no default exports)
- [ ] All functions have explicit parameter and return types
- [ ] No `any` types used
- [ ] Naming conventions followed (PascalCase, camelCase, UPPER_SNAKE_CASE)
- [ ] 2-space indentation throughout
- [ ] Maximum 100 character line length
- [ ] Comments describe intent, not implementation
- [ ] Error handling present for async operations
- [ ] No prohibited patterns (hardcoded secrets, console.log, eval)
- [ ] Imports organized and grouped
- [ ] Commit message follows format with type prefix
- [ ] Evidence emitted for autonomous actions

## Enforcement

Grammar compliance enforced via:
- ESLint with TypeScript plugin
- Prettier formatting
- Pre-commit hooks
- CI validation in `ci.yml`
- CodeQL security scanning
