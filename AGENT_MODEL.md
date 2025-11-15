# Agent Model

## Overview
AtlasIT autonomous development framework consists of three agent tiers:

### 1. Copilot Agent
**Role:** First-line autonomous development  
**Capabilities:**
- Simple feature implementations
- Documentation updates
- Code refactoring
- Routine maintenance
- Evidence emission

**Triggers:** Low-severity changes, documentation-only PRs

### 2. Codex Agent
**Role:** Advanced autonomous development and review  
**Capabilities:**
- Infrastructure changes
- Workflow modifications
- Security implementations
- Policy validation
- Complex integrations
- Evidence verification

**Triggers:** Medium/high-severity changes, infrastructure modifications, security-related changes

### 3. Human Agent
**Role:** Final review and critical decisions  
**Capabilities:**
- Critical security reviews
- Prohibited pattern handling
- Compliance sign-off
- Production deployments
- Exception approvals

**Triggers:** Critical severity, prohibited patterns detected, compliance requirements

## Routing Decision Flow

```
PR Created → Extract Metadata → Evaluate Rules → Route to Agent
                                        ↓
                        ┌───────────────┼───────────────┐
                        ↓               ↓               ↓
                    Copilot          Codex           Human
                    (low)        (medium/high)     (critical)
```

## Deterministic Behavior
- Same PR metadata → Same decision ID (content-based hash)
- Rules version tracked in every decision
- SHA-256 hash of rules.json for verification
- Triggers list documents reasoning

## Evidence Lifecycle
Every agent action emits evidence:
- `trace_id`: Unique identifier
- `control_id`: Control/check performed
- `timestamp`: ISO 8601
- `result`: pass/fail/skip/error
- `metadata`: Context-specific data

## Escalation Paths
- Copilot → Codex: Complexity threshold exceeded
- Codex → Human: Security/compliance triggers
- Any → Human: Prohibited patterns detected
