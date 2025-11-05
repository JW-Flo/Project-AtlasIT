# Codex Runner Setup and Usage

This document describes the Codex Runner automation system and remaining manual tasks.

## ✅ Completed Tasks

1. **Branch Created**: `copilot/featurecodex-runner` ✓
2. **Workflow Added**: `.github/workflows/agent-codex.yml` ✓
   - Triggers on push to `ops/hand-off.md` with "READY" in commit message
   - Executes `scripts/run-codex.mjs`
   - Commits `.codex.done` and evidence artifacts
3. **Script Added**: `scripts/run-codex.mjs` ✓
   - Reads and parses `### COMMAND PLAN` from `ops/hand-off.md`
   - Executes commands sequentially
   - Logs output to `.codex.done` in JSON format
4. **Changes Committed and Pushed**: All files committed to branch ✓
5. **Testing**: Script tested locally with mock data ✓

## 📋 Manual Tasks Required

The following tasks require GitHub API access or manual intervention beyond workflow capabilities:

### 5. Create Sub-Issue

A sub-issue needs to be created manually or via GitHub API:

**Title**: `[AUTO] CodeGen — Execute ops/hand-off.md (Codex Runner)`

**Labels**:

- `agent:codegen`
- `area:infra`
- `emits:evidence`

**Body**:

```markdown
Execute the command plan defined in ops/hand-off.md through the Codex Runner workflow.

## Context

- Parent Issue: #61
- Workflow: `.github/workflows/agent-codex.yml`
- Script: `scripts/run-codex.mjs`

## Execution

The workflow will automatically run when:

1. Changes are pushed to `ops/hand-off.md`
2. Commit message contains "READY"

## Expected Outputs

- `.codex.done` - Execution results in JSON format
- `artifacts/policy/EV-codex-execution.json` - Evidence artifact

## Verification

Check the workflow run at: https://github.com/HarderWorkingCo/Project-AtlasIT/actions/workflows/agent-codex.yml
```

### 6. Comment in Master Branch

Add a comment to the original issue or create a new comment:

```markdown
@codegen begin execution per ops/hand-off.md (Codex Runner READY)

The Codex Runner workflow has been implemented and is ready for execution.

**Branch**: `copilot/featurecodex-runner`
**Workflow**: `.github/workflows/agent-codex.yml`
**Script**: `scripts/run-codex.mjs`

To trigger execution:

1. Merge this PR or push changes to `ops/hand-off.md`
2. Ensure commit message contains "READY"

View runs: https://github.com/HarderWorkingCo/Project-AtlasIT/actions/workflows/agent-codex.yml
```

## 🧪 Testing the Workflow

### Local Testing

Test the script locally (will execute actual commands):

```bash
node scripts/run-codex.mjs
```

### Workflow Testing

To test the GitHub Actions workflow:

1. Make a change to `ops/hand-off.md`
2. Commit with message containing "READY", e.g.:
   ```bash
   git commit -m "test: READY to execute codex plan"
   ```
3. Push to the branch
4. Monitor workflow execution at: https://github.com/HarderWorkingCo/Project-AtlasIT/actions

### Expected Workflow Behavior

1. Workflow triggers on push
2. Checks if commit message contains "READY"
3. Installs dependencies
4. Runs `node scripts/run-codex.mjs`
5. Generates `.codex.done` with execution results
6. Creates evidence artifact `EV-codex-execution.json`
7. Commits both files back to the branch
8. Uploads artifacts to workflow run

## 📊 Acceptance Criteria Status

- ✅ `.github/workflows/agent-codex.yml` and `scripts/run-codex.mjs` committed
- ⏳ Workflow executes successfully when marked READY (pending test)
- ✅ `.codex.done` generated with captured logs (verified in local test)
- ✅ Evidence artifacts (EV-\*.json) written where applicable
- ⏳ CodeGen sub-issue created and executed (requires manual action)

## 🔗 Related Resources

- Main Issue: https://github.com/HarderWorkingCo/Project-AtlasIT/issues/61
- Linear Issue: https://linear.app/hardworkco/issue/HAR-15
- Documentation: `scripts/README-codex-runner.md`

## 🏷️ Tags

`agent:copilot`, `area:infra`, `emits:evidence`, `automation`
