# MCP Local Development Guide

## Quick Start

1. **Shell Requirement:**
   - Use `zsh` (default on macOS). If not, run `chsh -s /bin/zsh`.

2. **Start the MCP Dev Server:**
   - From the `mcp/` directory, run:
     ```sh
     nohup wrangler dev --port 8080 > ../mcp/_remote.log 2>&1 &
     ```
   - This starts the server on port 8080 and logs output to `mcp/_remote.log`.

3. **Check Logs:**
   - View logs with:
     ```sh
     tail -f _remote.log
     ```

4. **Stop the Dev Server:**
   - Use the provided script:
     ```sh
     ../scripts/kill-mcp-dev.sh
     ```
   - Or manually:
     ```sh
     pkill -f 'wrangler dev'
     ```

5. **Run the Smoke Test:**
   - From the project root:
     ```sh
     ./scripts/smoke-test-worker.sh
     ```

## Health Checks & Auditor

- **Health Check:**
  - To check if the MCP dev server is healthy (port and HTTP):
    ```sh
    ./scripts/health-check-mcp.sh
    ```
- **Auditor (Self-Healing & Slack Alerts):**
  - To ensure the server is always running and auto-restart if down:
    ```sh
    ./scripts/audit-mcp-dev.sh
    ```
  - If the server fails to restart, a Slack alert will be sent **if `SLACK_WEBHOOK_URL` is set in your environment**. Requires `jq` to be installed.
  - You can run this auditor in a loop or via cron for continuous monitoring. Example (every 2 minutes):
    ```sh
    */2 * * * * /path/to/Project-Ignite/scripts/audit-mcp-dev.sh >> /tmp/mcp_audit.log 2>&1
    ```
  - Or in a background shell:
    ```sh
    while true; do ./scripts/audit-mcp-dev.sh; sleep 120; done
    ```

## Troubleshooting

- **Port Binding Errors:**
  - Ensure port 8080 is free: `lsof -i :8080`
  - Kill any process using it: `kill -9 <PID>`
- **Shell Issues:**
  - Make sure your shell is `zsh`.
- **Log File Bloat:**
  - Logs are ignored by git and can be safely deleted.

## File Cleanup
- `agents/orchestrator.js` has been intentionally deleted as part of codebase cleanup.

## .gitignore
- Log files and background process artifacts are now ignored by git. 