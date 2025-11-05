# Codex Runner

The Codex Runner is an automation system that executes command plans defined in `ops/hand-off.md` through GitHub Actions.

## How It Works

1. **Trigger**: The workflow (`.github/workflows/agent-codex.yml`) is triggered when:
   - A push includes changes to `ops/hand-off.md`
   - The commit message contains the keyword `READY`

2. **Execution**: The `scripts/run-codex.mjs` script:
   - Reads `ops/hand-off.md` and extracts the `## COMMAND PLAN` section
   - Parses the bash commands from the fenced code block
   - Executes each command sequentially
   - Stops on the first failure (non-zero exit code)
   - Logs all output to `.codex.done`

3. **Results**: After execution:
   - `.codex.done` is committed with detailed execution results (JSON format)
   - Evidence artifacts are generated in `artifacts/policy/EV-codex-execution.json`
   - Execution logs are uploaded as workflow artifacts

## Command Plan Format

In `ops/hand-off.md`, define commands in a fenced code block under `## COMMAND PLAN`:

````markdown
## COMMAND PLAN

```bash
# Comment lines are ignored
echo "First command"

# Commands can span multiple lines if they end with \
export MY_VAR="value" && \
  echo $MY_VAR

# Multi-line constructs with parentheses are supported
(cd some-dir && \
  npm install && \
  npm run build)
```
````

````

## Output Format

The `.codex.done` file contains a JSON report with:

```json
{
  "status": "success" | "failure" | "error",
  "timestamp": "ISO-8601 timestamp",
  "totalCommands": 10,
  "executedCommands": 10,
  "results": [
    {
      "command": "echo 'hello'",
      "exitCode": 0,
      "stdout": "hello\n",
      "stderr": "",
      "timestamp": "ISO-8601 timestamp"
    }
  ]
}
````

## Evidence Artifacts

Execution generates compliance evidence at `artifacts/policy/EV-codex-execution.json`:

```json
{
  "id": "EV-codex-{RUN_ID}",
  "type": "automation_execution",
  "control": "CODEX_RUNNER_EXECUTION",
  "subject": "codex-runner",
  "result": {
    "status": "executed",
    "run_id": "{GITHUB_RUN_ID}",
    "commit": "{SHA}",
    "branch": "{BRANCH}",
    "artifact_hash": "{SHA256}"
  },
  "timestamp": "ISO-8601 timestamp",
  "metadata": {
    "workflow": "agent-codex.yml",
    "trigger": "push",
    "actor": "{GITHUB_ACTOR}"
  }
}
```

## Local Testing

Test the script locally:

```bash
# The script will execute commands from ops/hand-off.md
node scripts/run-codex.mjs
```

**Warning**: This will execute the actual commands in your local environment.

## Troubleshooting

- **No execution**: Ensure commit message contains "READY" and `ops/hand-off.md` was modified
- **Failed commands**: Check `.codex.done` for error details and exit codes
- **Parsing issues**: Verify the `## COMMAND PLAN` section exists and is properly fenced

## Tags

Applies to: `agent:copilot`, `area:infra`, `emits:evidence`, `automation`
