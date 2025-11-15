# Copilot Grammar

## Commit Message Format

**Standard Format:**
```
<type>: <description>
<type>(<scope>): <description>
```

**Valid Types:**
- `feat`: New feature
- `fix`: Bug fix
- `ops`: Operational/infrastructure
- `docs`: Documentation
- `test`: Testing
- `refactor`: Code refactoring
- `chore`: Maintenance
- `ci`: CI/CD changes
- `perf`: Performance improvements
- `style`: Code style/formatting

**Optional Evidence Tag:**
```
feat: Implement autonomous routing (EV-0042)
ops(worker): Deploy agent router (EV-0043)
```

**Pattern:** `EV-####` where `####` is a 4-digit numeric identifier.

## PR Title Format

**Options:**
1. `[PR-<ID>] <Description>` (e.g., `[PR-INIT-001] Framework Build-Out`)
2. `[AUTO] <Description>` (agent-generated)
3. Standard commit format (e.g., `feat: Add routing worker`)

## OPA Policy Enforcement

Grammar rules are enforced via `policies/grammar.rego`:
- Validates commit message prefixes
- Checks PR title format
- Detects potential hardcoded secrets
- All deny rules must pass (count = 0)

## Examples

**Valid:**
- `feat: Add drift detection`
- `ops(ci): Enhance workflow matrix`
- `[PR-INIT-001] Autonomous Framework Build-Out`
- `[AUTO] Codex review completed`

**Invalid:**
- `Added new feature` (no type prefix)
- `FIX: broken build` (uppercase type)
- `Random PR title` (no format match)
