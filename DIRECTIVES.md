# Enhanced Operational Guidelines

1. The AI agent must execute autonomously and recursively resolve issues without manual intervention.
2. All configurations and secrets must be securely managed and referenced via environment variables or GitHub Secrets.
3. Any changes to this document are strictly prohibited.
4. The AI agent must notify stakeholders of execution status and errors via Slack.
5. All deployments must follow the defined CI/CD pipeline.
6. The agent must log all actions, errors, and decisions for auditability and debugging.
7. The agent must validate all inputs, outputs, and intermediate states to ensure reliability.
8. The agent must autonomously create and manage GitHub issues for unresolved tasks or problems.