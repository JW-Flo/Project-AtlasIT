# AtlasIT Integrations

Integrations turn AtlasIT into your source of truth around product development and operations. Keep data in sync, and eliminate manual updates between tools.

## Key Integrations

### Slack

Connect your Slack workspace to AtlasIT for seamless communication and automation:

- Create issues and tasks from Slack messages
- Sync conversation threads with your workflows
- Receive real-time notifications about system events
- Trigger automation workflows directly from Slack commands

**Configuration:**
- Set `SLACK_WEBHOOK_URL` secret via Wrangler for outbound notifications
- Enable Slack connector with `FEATURE_CONNECTOR_SLACK=1` flag
- Configure workspace integration through the AtlasIT console

**Resources:**
- Implementation: `utils/slack.js`
- Research: `research/raw/slack-provisioning.md`
- Schema: `artifacts/research/slack-provisioning.schema.json`

### GitHub / GitLab

Automate your pull request and commit workflows, and keep issues synced both ways:

- Automatically link commits to issues and tasks
- Sync PR status with workflow stages
- Create issues from code review comments
- Track deployment status and releases
- Bidirectional issue synchronization

**GitHub Integration:**
- Leverage GitHub Actions for CI/CD workflows
- Use `.github/workflows` for automated deployments
- Connect repository events to AtlasIT orchestration

**GitLab Integration:**
- Configure webhook endpoints for pipeline events
- Sync merge request status with workflow states
- Integrate GitLab CI/CD with AtlasIT automation

**Resources:**
- Configuration: `.github/` directory
- Adapter framework: `docs/CONNECTORS.md`

### AI Agents

Deploy AI agents that work alongside you as teammates:

- Automated code review and suggestions
- Intelligent task routing and prioritization
- Natural language query interface
- Automated documentation generation
- Compliance and policy checking

**Agent Types:**
- **Onboarding Agent:** Automates tenant and user provisioning
- **Orchestrator Agent:** Manages task scheduling and workflow execution
- **Documentation Agent:** Maintains operational runbooks
- **Compliance Agent:** Monitors and reports on compliance status

**Configuration:**
- AI Gateway: Set `AI_GATEWAY_TOKEN` secret
- Agent configuration: `ai-agent/config.yaml`
- Orchestrator settings: `ai-orchestrator/` worker

**Resources:**
- Implementation: `onboarding_agent.py`, `ai-orchestrator/`, `documentation-worker/`
- MCP Servers: `mcp/`, `mcp-servers/`
- Examples: `docs/openai-agents-python-main/`

### Jira

Integrate with Jira for project management and issue tracking:

- Sync issues and tasks bidirectionally
- Map Jira workflows to AtlasIT automation
- Track sprint progress and velocity
- Link commits and deployments to Jira tickets

**Resources:**
- Integration notes: `jira-integration-test.txt`

### Okta (Identity & Access Management)

Synchronize user directories and manage access lifecycle:

- Automated user provisioning and deprovisioning
- Group synchronization for role-based access
- Single sign-on (SSO) integration
- Joiner/Mover/Leaver (JML) automation

**Configuration:**
- Enable with `FEATURE_IDP_OKTA=1` flag
- Configure IdP adapters in `packages/idp-adapters/`
- API collections: `Groups (Okta API).postman_collection.json`

**Resources:**
- IdP layer: `docs/IDP_LAYER.md`
- JML engine: `docs/JML_ENGINE.md`
- Packages: `packages/idp/`, `packages/idp-adapters/`, `packages/idp-sim/`

## Browse All Integrations

AtlasIT's connector framework enables integration with 150+ available tools through a standardized adapter architecture:

### Connector Architecture

The AtlasIT Connector Toolkit provides tools for building and validating connector adapters:

1. **Adapter Generator:** Scaffolds Cloudflare Worker-compatible adapters from OpenAPI or custom schemas
2. **Simulator:** Validates adapter contracts and health endpoints
3. **Research Engine:** Normalizes vendor documentation into structured schemas
4. **Registry:** Central catalog of available connectors

**Creating New Connectors:**

```bash
# Generate adapter from schema
npm run build:adapter-gen
node packages/adapter-gen/dist/cli.js gen \
  --schema contracts/examples/example-openapi.json \
  --name "Tool Name" \
  --out adapters

# Validate adapter
npm run build:adapter-sim
node packages/adapter-sim/dist/cli.js sim \
  --adapter adapters/tool-name \
  --contract contracts/examples/contract.json
```

**Feature Flags:**
- Enable connectors with `FEATURE_CONNECTOR_<SLUG>=1` environment variable
- Adapters are discoverable via `/api/connectors` endpoint when enabled
- Safe rollout through feature flag control

### Supported Integration Categories

- **Support Tools:** Intercom, Zendesk, Dixa
- **Design Tools:** Figma
- **HR Systems:** Various HR suite connectors (see `adapters/example-hr-suite`)
- **Security Tools:** CrowdStrike integration (planned)
- **Cloud Providers:** AWS integration (see `docs/HYBRID_AWS.md`)
- **Custom Adapters:** Build your own using the adapter framework

**Resources:**
- Complete guide: `docs/CONNECTORS.md`
- Adapter packages: `packages/adapter-gen/`, `packages/adapter-sim/`
- Research engine: `packages/research-engine/`
- Registry: `adapters/registry.json`

## AtlasIT API

If you need something more custom, you can build directly on the AtlasIT API (built on REST/GraphQL patterns).

### API Architecture

AtlasIT provides multiple API surfaces:

#### Core Workers API

Three primary workers handle core operations:

- **Onboarding Worker:** Tenant/user provisioning and IDP integration
- **Orchestrator Worker:** Task submission and scheduled execution
- **Documentation Worker:** Operational runbook management

**Authentication:**
- API key authentication via `x-api-key` header
- Set secrets: `ONBOARDING_API_KEY`, `API_ALLOWED_KEYS`

**Endpoints:**
```bash
# Onboarding
curl -H "x-api-key: $ONBOARDING_API_KEY" \
  https://<domain>/onboarding/start \
  -d '{"industry":"technology"}'

# Health checks
curl https://<orchestrator-domain>/health
curl https://<docs-domain>/docs
```

#### Connector API

Access integrated tools through standardized endpoints:

- `/api/connectors` - List available connectors
- `/api/idp/list` - Identity provider listing
- `/api/idp/provision` - User provisioning

#### Compliance & Risk API (Planned)

Future endpoints for governance and compliance:

- `/api/compliance/score` - Compliance score calculation
- `/api/compliance/frameworks` - Framework status
- `/api/compliance/audit-timeline` - Audit event history
- `/api/risk/matrix` - Risk assessment matrix

### API Development

**Local Development:**

```bash
# Install dependencies
npm install

# Start core workers
npm run dev:core

# Or start individual workers
npm run dev:onboarding
npm run dev:orchestrator
npm run dev:docs
```

**Testing:**

```bash
# Validate environment
npm run validate:env

# Type checking
npm run typecheck

# Run tests
npm run test:unit

# Pre-deployment validation
npm run predeploy
```

### API Storage & State

AtlasIT leverages Cloudflare's edge infrastructure:

- **KV Namespaces:** Sessions, cache, feature flags, MCP store
- **D1 Databases:** Core data, audit logs, compliance records
- **R2 Buckets:** Policies, evidence, artifacts
- **Dispatch Namespaces:** Sub-worker routing (optional)

**Configuration:**
See `README.md` Cloudflare Binding Configuration section for complete setup.

### API Documentation

- **Endpoints catalog:** `ops/ENDPOINTS.md`
- **API documentation:** `docs/api-documentation.md`
- **Architecture details:** `docs/architecture.md`
- **Data schema:** `docs/data-schema.md`
- **Development guide:** `AtlasIT Development Guide.md`

### Building Custom Integrations

1. **Use Existing Adapters:** Start with the connector framework for standard integrations
2. **Custom Workers:** Create Cloudflare Workers for specialized logic
3. **API Integration:** Build against core worker endpoints
4. **MCP Protocols:** Leverage Model Context Protocol for AI-native integrations

**Resources:**
- MCP examples: `docs/ModelContextProtocols_Examples.md`
- Platform foundation: `docs/PLATFORM_FOUNDATION.md`
- Engineering decisions: `docs/ENGINEERING_DECISIONS.md`

## Deployment

### Configuration

Required secrets (set via Wrangler):

```bash
# Onboarding worker
wrangler secret put ONBOARDING_API_KEY
wrangler secret put ORCHESTRATOR_API_KEY

# Orchestrator worker
wrangler secret put API_ALLOWED_KEYS
wrangler secret put AI_GATEWAY_TOKEN

# Slack integration
wrangler secret put SLACK_WEBHOOK_URL --env core
```

### Deploy Workers

```bash
# Deploy all workers
cd onboarding && wrangler deploy
cd ../ai-orchestrator && wrangler deploy
cd ../documentation-worker && wrangler deploy
```

### Environment Setup

```bash
# Copy template and configure
cp .env.example .env

# Validate configuration
npm run validate:env

# Run pre-deployment checks
npm run predeploy
```

## Observability & Monitoring

Track integration health and performance:

- **Structured Logging:** Correlation IDs for request tracing
- **Metrics:** Performance counters and latency gauges
- **Health Endpoints:** Status checks for all services
- **Audit Trail:** Complete event history with hash chains

**Resources:**
- Observability guide: `docs/OBSERVABILITY.md`
- Logging standards: `LOGGING.md`
- Cron jobs: `docs/CRON_JOBS.md`

## Security

Integration security best practices:

- **No Plaintext Secrets:** All credentials stored in Cloudflare Secrets
- **Encrypted Configuration:** Connector configs use encrypted-at-rest wrappers
- **Audit Events:** Complete audit trail with cryptographic hash chains
- **Row-Level Security:** Tenant-scoped data access controls

**Security Resources:**
- Data retention: `docs/DATA_RETENTION_MATRIX.md`
- Policy & evidence: `docs/POLICY_AND_EVIDENCE.md`

## Roadmap

### Current Status (Implemented)

- ✅ Onboarding, Orchestrator, and Documentation Workers
- ✅ Connector framework and adapter generator
- ✅ IdP layer with Okta integration
- ✅ Basic API endpoints and health checks
- ✅ MCP protocol support for AI agents

### Planned Integrations (Roadmap)

- **Phase 4 - Directory & Lifecycle:** Enhanced Okta sync, JML automation
- **Phase 1-3:** UI console, compliance core, policy engine
- **Phase 5:** Reporting & export capabilities
- **Phase 6:** Advanced observability and rate limiting

See `ROADMAP.md` for detailed phase breakdown.

## Support & Resources

- **Documentation:** `docs/` directory
- **Development Guide:** `AtlasIT Development Guide.md`
- **API Reference:** `docs/api-documentation.md`
- **Contributing:** Open issues or PRs for improvements
- **Status:** `STATUS.md` for current implementation state

## Examples & Getting Started

### Quick Start Integration

1. **Enable Integration:**
   ```bash
   # Enable Slack connector
   export FEATURE_CONNECTOR_SLACK=1
   wrangler secret put SLACK_WEBHOOK_URL
   ```

2. **Verify Integration:**
   ```bash
   curl https://<domain>/api/connectors
   ```

3. **Use Integration:**
   ```javascript
   // Send Slack notification
   await fetch('https://<domain>/api/slack/notify', {
     method: 'POST',
     headers: { 'x-api-key': API_KEY },
     body: JSON.stringify({ message: 'Hello from AtlasIT!' })
   });
   ```

### Creating a Custom Adapter

See the complete guide in `docs/CONNECTORS.md` for step-by-step instructions on:

- Generating adapters from OpenAPI schemas
- Validating adapter contracts
- Registering new connectors
- Testing and deploying adapters

---

**Last Updated:** 2025-11-05  
**Version:** 1.0.0  
**Status:** Active Development

For questions or support, please open an issue in the repository.
