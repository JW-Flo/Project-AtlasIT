# Work Prompt Templates

## Standard Feature Prompt

```markdown
## Task: {{TITLE}}

**ID:** {{ID}} | **Priority:** {{PRIORITY}} | **Estimate:** {{ESTIMATE}}
**Tags:** {{TAGS}}

---

### Context

{{CONTEXT}}

### Acceptance Criteria

{{ACCEPTANCE_CRITERIA}}

### Technical Approach

#### Files to Create/Modify

{{FILE_LIST}}

#### Implementation Steps

{{STEPS}}

### Code Scaffolds

{{SCAFFOLDS}}

### Testing Requirements

{{TESTING}}

### Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests passing (>80% coverage for new code)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Lint passing (`npm run lint`)
- [ ] Responsive on mobile/desktop
- [ ] PR reviewed and approved
```

## Bugfix Prompt

```markdown
## Bugfix: {{TITLE}}

**ID:** {{ID}} | **Priority:** {{PRIORITY}} | **Severity:** {{SEVERITY}}

---

### Problem Statement

{{DESCRIPTION}}

### Steps to Reproduce

{{REPRO_STEPS}}

### Expected Behavior

{{EXPECTED}}

### Actual Behavior

{{ACTUAL}}

### Root Cause Analysis

{{RCA}}

### Fix Approach

{{FIX_APPROACH}}

### Files to Modify

{{FILE_LIST}}

### Regression Testing

{{REGRESSION_TESTS}}

### Definition of Done

- [ ] Bug no longer reproducible
- [ ] Root cause addressed (not just symptoms)
- [ ] Regression test added
- [ ] No new issues introduced
- [ ] PR reviewed and approved
```

## Refactor Prompt

```markdown
## Refactor: {{TITLE}}

**ID:** {{ID}} | **Scope:** {{SCOPE}}

---

### Current State

{{CURRENT_STATE}}

### Problems with Current Approach

{{PROBLEMS}}

### Target State

{{TARGET_STATE}}

### Refactor Strategy

{{STRATEGY}}

### Migration Path

{{MIGRATION}}

### Breaking Changes

{{BREAKING_CHANGES}}

### Rollback Plan

{{ROLLBACK}}

### Definition of Done

- [ ] All existing tests still pass
- [ ] New architecture documented
- [ ] No performance regression
- [ ] Breaking changes communicated
- [ ] PR reviewed and approved
```

## Infrastructure Prompt

```markdown
## Infrastructure: {{TITLE}}

**ID:** {{ID}} | **Environment:** {{ENV}}

---

### Objective

{{OBJECTIVE}}

### Current Infrastructure

{{CURRENT}}

### Proposed Changes

{{CHANGES}}

### Terraform/Config Changes

{{CONFIG}}

### Security Considerations

{{SECURITY}}

### Rollout Plan

{{ROLLOUT}}

### Monitoring & Alerts

{{MONITORING}}

### Rollback Procedure

{{ROLLBACK}}

### Definition of Done

- [ ] Changes applied to staging first
- [ ] Smoke tests passing
- [ ] Monitoring configured
- [ ] Runbook updated
- [ ] PR reviewed by infra owner
```

## Agent Handoff Wrapper

````markdown
---
agent: {{AGENT_ID}}
task_id: {{TASK_ID}}
priority: {{PRIORITY}}
timeout: {{TIMEOUT}}
context_files:
{{CONTEXT_FILES}}
---

{{WORK_PROMPT}}

---

## Agent Instructions

### Before Starting

1. Read all referenced context files
2. Verify dependencies are available
3. Create feature branch: `{{BRANCH_NAME}}`

### During Work

1. Make incremental commits with conventional messages
2. Run tests after each significant change
3. Document complex logic in code comments

### On Completion

1. Run full test suite: `npm run qa:core`
2. Push branch and create draft PR
3. Update change feed:
   ```json
   {
     "seq": {{NEXT_SEQ}},
     "ts": "{{TIMESTAMP}}",
     "type": "task_completed",
     "ref": "{{TASK_ID}}",
     "agent": "{{AGENT_ID}}",
     "summary": "{{SUMMARY}}"
   }
   ```
````

4. Mark task as 'review' stage
5. Notify orchestrator for next assignment

### On Blocker

1. Document blocker in change feed with type "blocked"
2. List specific questions or missing resources
3. Return to orchestrator for reassignment or escalation

````

## Sprint Planning Template

```markdown
# Sprint {{SPRINT_NUMBER}} Work Plan
**Period:** {{START_DATE}} - {{END_DATE}}
**Capacity:** {{CAPACITY}} story points

---

## Sprint Goals
{{GOALS}}

## Critical Path (Must Complete)
{{CRITICAL_ITEMS}}

## High Priority
{{HIGH_ITEMS}}

## Medium Priority (Stretch)
{{MEDIUM_ITEMS}}

## Carry-over from Previous Sprint
{{CARRYOVER}}

---

## Risk Assessment
{{RISKS}}

## Dependencies
{{DEPENDENCIES}}

---

## Individual Task Prompts

{{TASK_PROMPTS}}
````
