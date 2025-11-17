# Copilot Instructions (Project-AtlasIT Wrapper)

## Overview

This repository powers the AtlasIT platform, a Cloudflare Workers-based automation substrate for onboarding, orchestration, documentation, and compliance modules. It integrates multiple services, including onboarding, marketplace, authentication, and orchestration, with a focus on automation and scalability.

## Architecture

- **Core Services**:
  - `onboarding/`: Handles user onboarding workflows.
  - `marketplace/`: Manages marketplace-related operations.
  - `auth/`: Provides authentication services.
  - `orchestrator/`: Coordinates events and workflows across services.
- **Shared Utilities**:
  - `agents/`: Contains AI agents for automation tasks.
  - `utils/`: Shared helper functions and utilities.
- **Infrastructure**:
  - `wrangler.toml`: Configuration for Cloudflare Workers.
  - `docker/`: Docker configurations for local development.

## Developer Workflows

### Build and Test

- **Install Dependencies**:
  ```bash
  npm install
  ```
- **Run Tests**:
  ```bash
  npm test
  ```
- **Lint and Format**:
  ```bash
  npm run lint
  npm run format
  ```
- **Deploy to Cloudflare**:
  ```bash
  wrangler deploy --env <environment>
  ```

### Debugging

- Use `wrangler dev` for local development and debugging.
- Check Cloudflare logs for runtime diagnostics.

## Project Conventions

- **Commit Messages**:
  - Format: `type(scope): message`
  - Examples:
    - `feat(auth): add JWT rotation`
    - `fix(onboarding): resolve null pointer exception`
- **Code Style**:
  - Follow ESLint rules defined in `eslint.config.js`.
  - Use snake_case for field names.
- **Environment Variables**:
  - Secrets must be set via `wrangler secret put`.
  - Avoid hardcoding sensitive data.

## Integration Points

- **External APIs**:
  - Slack Webhooks: Used for notifications.
  - OpenAI Agents SDK: Powers AI-driven workflows.
- **Data Stores**:
  - KV, D1, and R2 bindings configured in `wrangler.toml`.
- **CI/CD**:
  - GitHub Actions workflows for testing and deployment.

## Examples and Documentation

- Refer to `docs/` for detailed guides and examples.
- Explore `examples/` for common agent patterns and workflows.

## Notes for AI Agents

- Always validate environment configurations in `wrangler.toml`.
- Ensure generated code adheres to project conventions.
- Use the `make` commands for consistent formatting and testing.
