# Agent Model

## Overview

The AtlasIT Autonomous Development Framework establishes a multi-agent architecture where specialized agents coordinate to manage repository operations, compliance validation, and infrastructure deployment. This document defines the agent roles, communication protocols, and operational boundaries.

## Agent Roles

### Copilot Agent
- **Purpose**: Strategic planning, branch provisioning, and workflow orchestration
- **Responsibilities**:
  - Create feature branches and sub-issues
  - Plan workflow sequences
  - Coordinate with CodeGen and validation agents
  - Emit evidence for planning decisions
- **Communication**: GitHub API, Linear API, workflow dispatch events

### CodeGen Agent
- **Purpose**: Execute code generation tasks from fenced command plans
- **Responsibilities**:
  - Parse and execute `.codex` command plans
  - Generate code following grammar specifications
  - Commit changes with `.codex.done` markers
  - Validate against schema and OPA policies
- **Communication**: File system markers, git commits, CI event hooks

### Router Agent (Worker)
- **Purpose**: Route PRs to appropriate agents based on severity and file patterns
- **Responsibilities**:
  - Analyze PR metadata (files changed, labels, title)
  - Compute severity level (low/medium/high/critical)
  - Assign primary and secondary agents
  - Determine evidence requirements
  - Flag prohibited patterns
- **Communication**: HTTP POST API, GitHub webhooks, simulation mode

### Drift Detection Agent
- **Purpose**: Monitor repository structure against canonical specification
- **Responsibilities**:
  - Compare actual file tree to required structure
  - Classify missing or misconfigured items
  - Auto-create drift fix PRs (structure/security/roadmap)
  - Emit drift evidence artifacts
- **Communication**: Scheduled workflow triggers, PR creation

## Agent Communication Protocol

All agents communicate via:
1. **Evidence Emission**: JSON artifacts conforming to `EVIDENCE_SCHEMA.json`
2. **GitHub Events**: PR comments, labels, status checks
3. **Workflow Dispatch**: Trigger cross-workflow coordination
4. **File Markers**: `.codex.done`, `.evidence/`, commit messages with `[AUTO]` prefix

## Operational Boundaries

- Agents must never introduce static secrets
- All actions must emit verifiable evidence with `trace_id`
- Severity escalation requires human approval for medium+ changes
- Prohibited patterns block merge automatically
- All agents adhere to Copilot Grammar and TypeScript strict mode

## Evidence Chain

```
[Agent Action] → [Evidence JSON] → [.evidence/ directory] → [CI Validation] → [Merge Gate]
```

Every autonomous action creates an evidence trail for compliance audit.
