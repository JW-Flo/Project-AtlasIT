# AtlasIT Documentation Index

## Overview

This directory serves as the single source of truth for all documentation, context, and change logs for the AtlasIT Platform (formerly Project Ignite). All files are append-only and reflect the living history and operational state of the platform.

## Structure

### Core Documentation

- `INTEGRATIONS.md`: **Comprehensive integration guide** for Slack, GitHub, GitLab, Okta, AI Agents, and custom connectors
- `CONNECTORS.md`: Connector toolkit and adapter framework guide
- `api-documentation.md`: API reference and endpoint documentation
- `architecture.md`: System architecture and design patterns

### Context & History

- `project-truth.txt`: Master context and architectural log (append-only)
- `agent-context.txt`: AI/automation agent context and actions (append-only)
- `iterm-context.txt`: Terminal and operational context (append-only)
- `project-overview.txt`: Executive summary and high-level vision
- Additional PDFs and reference docs: For deep dives and compliance

## Automation Policy

- All documentation and context files are updated continuously by both human and AI actors.
- No historical data is overwritten; all changes are appended for full auditability.
- Major changes were historically cross-referenced with the Ignite Jira project and syslog events; future references will use AtlasIT tracking systems.
- Documentation automation is handled by `autoDoc.js` and related services.

## External References

- (Legacy) Jira: <https://flocasts.atlassian.net/jira/software/projects/IG/boards/501> (retained for historical cross-links)
- Confluence: See project-truth.txt for canonical documentation URLs

---

### Legacy Note

Historical documents may still reference the term "Project Ignite". These references are intentionally retained for auditability and are catalogued in `LEGACY.md`.

For details on the automation kickoff and policy, see the latest section in `project-truth.txt`.
