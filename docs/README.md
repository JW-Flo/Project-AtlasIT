# Project Ignite Documentation Index

## Overview
This directory serves as the single source of truth for all documentation, context, and change logs for Project Ignite. All files are append-only and reflect the living history and operational state of the platform.

## Structure
- `project-truth.txt`: Master context and architectural log (append-only)
- `agent-context.txt`: AI/automation agent context and actions (append-only)
- `iterm-context.txt`: Terminal and operational context (append-only)
- `project-overview.txt`: Executive summary and high-level vision
- Additional PDFs and reference docs: For deep dives and compliance

## Automation Policy
- All documentation and context files are updated continuously by both human and AI actors.
- No historical data is overwritten; all changes are appended for full auditability.
- Major changes are cross-referenced with the Ignite Jira project and syslog events.
- Documentation automation is handled by `autoDoc.js` and related services.

## External References
- Jira: https://flocasts.atlassian.net/jira/software/projects/IG/boards/501
- Confluence: See project-truth.txt for canonical documentation URLs

## Build & Logging Requirements

For robust observability and auditability, every request handled by Project Ignite services must be logged with method, path, and status. This is especially important for debugging and for compliance with Project Ignite's non-negotiable error handling and logging rules. Logging must be concise, structured, and cover all major code paths: successful requests, errors, and 404s. Logs should be output via `console.log` for normal operations and `console.error` for errors, and must be present in all Cloudflare Workers, Node.js services, and automation scripts.

## Incident Responder Agent

The Incident Responder Agent (`scripts/incident-responder-agent.js`) is an autonomous L3/L4 SRE bot that monitors for missing or failed GitHub Actions workflow runs. It automatically triggers a no-op commit to remediate workflow drift, opens a GitHub issue if remediation fails, and logs all actions to `docs/incident-log.md`. The agent is run via `.github/workflows/incident-responder.yml` on a schedule and on every push. This reduces QA friction and ensures CI/CD reliability.

## MCP (Master Control Plane)

The MCP (`mcp/index.js`) is the central orchestrator for Project Ignite. It exposes endpoints for health (`/healthz`), status (`/status`), and orchestration triggers (`/orchestrate`). All requests are logged for auditability. MCP actions and orchestration events are logged in `docs/mcp-log.md`. The MCP is designed for extensibility, robust error handling, and full CI/CD integration.

---
For details on the automation kickoff and policy, see the latest section in `project-truth.txt`. 