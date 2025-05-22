# Global Code-Style Instructions (Prometheus)

* **Languages**
  * TypeScript 5 (edge runtime) → `/apps/edge-api`
  * Python 3.11 → `/bridge`
  * Other languages allowed

* **Formatting**
  * Prettier default, 2-space indent, single quotes
  * camelCase vars & functions, kebab-case file names
  * No semicolons in TS unless required by ASI edge-cases
  * No `async`/`await` in TS unless necessary

* **Imports**
  * Pure ESM: `import x from 'y'`
  * Edge-safe libs only—no `fs`, `net`, `tls`, `child_process`
  * No `require()`, `import()` or `import.meta` in TS
  * No `import` in Python

* **Security**
  * Secrets must come from `env.*` (Workers) or `os.getenv()` (Python)—never literals
  * Reject code that hits `aws`, `gcp`, `okta`, or `slack` domains

* **Tests**
  * Vitest (`*.spec.ts`) & Pytest (`test_*.py`) with ≥ 85 % coverage
  * No `console.log` in tests
  * No `console.log` in production code
  * No `console.log` in tests
  * No `console.log` in production code
  * No `console.log` in tests                 