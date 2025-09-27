## Onboarding Service Phase 1 Additions

### Endpoints

1. POST /api/onboarding
   - Creates (or returns existing) onboarding configuration for a tenant.
   - Idempotent: subsequent identical POSTs return 200 with `idempotent: true` and original config/template.
2. GET /api/onboarding/questions?industry=tech&req=analytics&req=compliance
   - Returns dynamic question set based on industry and requirement keywords.
3. GET /api/onboarding/:tenantId
   - Returns stored onboarding state (status, config, template) if exists.

### Error Codes (taxonomy)

| Code    | Meaning                                                |
| ------- | ------------------------------------------------------ |
| ONB-001 | Missing required fields (tenantId, name, industry)     |
| ONB-002 | Unsupported industry (details includes allowed list)   |
| ONB-003 | Invalid configuration (details list validation issues) |
| ONB-004 | Onboarding already provisioned (idempotent path)       |
| ONB-005 | Tenant ID required (status endpoint)                   |
| ONB-006 | Onboarding not found (status endpoint)                 |
| ONB-999 | Unknown error                                          |

### Audit Events

- On success an `audit_events` row is inserted: type `onboarding.completed` with payload `{ tenantId, industry }`.
- Idempotent re-invocations do NOT create duplicate audit events.

### Security & Observability (Phase 1 Hardening + Enhancements)

- API Key Authentication: All onboarding endpoints optionally require an `x-api-key` when `API_ALLOWED_KEYS` is configured.
- Actor Attribution: The provided API key is surfaced as `actor` in JSON responses and (for onboarding) embedded in `audit_events.payload` for provenance.
- Correlation IDs: Each request has a `requestId` (UUID) in JSON and `x-request-id` header; joined with `actor` for consistent trace context.
- Rate Limiting: Per-API-key sliding window controls (env: `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`) return `429` with standard rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).
- Schema Drift Detection: `schema.hash` baseline + integrity test prevents unnoticed migration changes.

### Questions Generation Inputs

- Industry (default technology) influences specialized questions (e.g., healthcare adds PHI question).
- Requirements keywords (compliance, analytics, etc.) add targeted questions.

### AI Config Enhancements

- Extended keyword mapping for monitoring/observability, logging, audit, sso, gdpr/privacy.

### Testing Coverage

- Unit: health, onboarding POST (create + idempotent), questions, status (found & not found).
- Integration: full flow, status retrieval, idempotent POST, error taxonomy (ONB-001, ONB-002, conditional ONB-003 attempt).

### Idempotency Behavior

- KV key `onboarding:{tenantId}` as source of truth; presence triggers 200 path with `idempotent: true`.

### Future Work (Phase 2 Ideas)

- Enrich validation details, add partial progress states, expand question taxonomy.

# AtlasIT

AtlasIT is a modular, cloud-first IT management platform for SMBs that automates user provisioning, SaaS onboarding, identity/infrastructure access, device enrollment, communications, security, reporting, and cost management—with compliance and AI-powered onboarding built in.

## Key Features

- **🤖 AI-Guided Tenant Onboarding**: Dynamic template Q&A system for rapid, secure setup tailored to client needs
- **🏪 App Marketplace**: Pluggable app/integration onboarding for SaaS, security, finance, and more
- **🎯 Central Orchestrator (MCP)**: Event-driven microservices architecture with automated workflow management
- **🔐 Multi-Tenant Authentication**: Support for OIDC/SAML/SCIM, Okta, Auth0, or AtlasIT's internal IdP
- **🌐 API Manager**: Unified gateway for all internal/external API traffic with security enforcement
- **☁️ Cloud-First, Serverless**: Powered by Cloudflare Workers with global edge distribution
- **🛡️ Security & Compliance**: Built-in logging, audit trails, SIEM/EDR integrations, and compliance reporting

## Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Services Overview](#services-overview)
- [Documentation](#documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/atlasit.git
cd atlasit
```

1. **Install dependencies:**

```bash
# Preferred (installs root + all workspaces)
npm run install:all

# Or just root (then manually install per service)
npm install
```

1. **Set up environment:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

1. **Authenticate with Cloudflare:**

```bash
wrangler login
```

1. **Start core development services:**

```bash
npm run dev:core
```

Or start all declared dev targets (may include placeholders not yet implemented):

```bash
npm run dev
```

1. **Access the application:**

- API: `http://localhost:8787`
- Dashboard: `http://localhost:3000`

## Project Structure

```text
atlasit/
├── 📚 docs/                    # Comprehensive documentation
│   ├── api-documentation.md    # Complete API reference
│   ├── architecture.md         # System architecture
│   ├── deployment-guide.md     # Production deployment
│   └── developer-guide.md      # Development guidelines
├── 🎯 onboarding/              # AI-guided tenant setup
│   ├── src/handlers/           # Request handlers
│   ├── src/services/           # Business logic
│   ├── src/utils/              # Helper functions
│   ├── migrations/             # Database migrations
│   └── tests/                  # Test suites
├── 🏪 marketplace/             # App store & integrations
├── 🔐 auth/                    # Authentication service
├── 🎭 orchestrator/            # Event orchestration (MCP)
├── 🌐 api-manager/             # API gateway & routing
├── 📱 applications/            # SaaS integrations
├── 🏗️ terraform/               # Infrastructure as code
├── 🎨 ui/                      # React dashboard
├── 🔧 shared/                  # Shared utilities
└── 📜 scripts/                 # Build & deployment scripts
```

## Services Overview

### 🎯 Onboarding Service

AI-powered tenant configuration with industry-specific templates, automated setup workflows, and integration validation.

**Key Features:**

- Dynamic questionnaire generation
- Industry-specific configurations (Healthcare, Finance, Retail)
- Automated template creation
- Integration validation pipeline

#### Current Orchestrator Endpoints

| Method | Path                        | Description                                     |
| ------ | --------------------------- | ----------------------------------------------- |
| GET    | `/health`                   | Service health probe                            |
| POST   | `/onboarding/start`         | Generate dynamic onboarding question set        |
| POST   | `/onboarding/submit`        | Submit tenant data and generate config/template |
| POST   | `/api/onboarding`           | Legacy alias of `/onboarding/submit`            |
| GET    | `/api/onboarding/:tenantId` | Retrieve onboarding state & generated config    |
| ANY    | (all above)                 | Require `x-api-key` if `API_ALLOWED_KEYS` set   |

### 🏪 Marketplace Service

Centralized app discovery and management platform for SaaS integrations and custom solutions.

**Key Features:**

- App discovery and installation
- Version management
- Dependency resolution
- Usage analytics

### 🔐 Authentication Service

Multi-tenant authentication with support for various identity providers and protocols.

**Key Features:**

- JWT/OAuth/SAML support
- Role-based access control (RBAC)
- Multi-tenant isolation
- SSO integration

### 🎭 Orchestrator Service

Event-driven workflow management using Model Context Protocol (MCP) for service coordination.

**Key Features:**

- Event processing and routing
- Workflow automation
- State management
- Service coordination

#### Current Endpoints (with Security Metadata)

| Method | Path            | Auth            | Description                                      |
| ------ | --------------- | --------------- | ------------------------------------------------ |
| GET    | `/health`       | None            | Health probe (returns status + requestId header) |
| GET    | `/status`       | x-api-key (401) | Returns deployment/task state (MCP may 403)      |
| POST   | `/task`         | x-api-key (401) | Submit a new task (MCP may 403)                  |
| POST   | `/terminal`     | x-api-key (401) | Execute terminal command (MCP approval)          |
| POST   | `/workflow`     | x-api-key (401) | Create in-memory workflow (MVP)                  |
| GET    | `/workflow/:id` | x-api-key (401) | Fetch workflow by id                             |

All authenticated endpoints also include a `x-request-id` header and JSON `requestId` field for correlation.

#### Testing Status

Vitest suites cover:

- Public `/health` availability (200 + `x-request-id`)
- Unauthorized access to `/status` without API key (401)
- Authorized `/status` path behavior (MCP may 403, ensures no 401 when key valid)
- Per-key rate limiting (third `/status` call -> 429)
- Workflow create & retrieval (`/workflow` + `/workflow/:id`)

Planned expansions:

- `/task` success + MCP rejection path coverage
- `/terminal` execution & rejection paths
- AI assistance decision logic (mock MCP + AI provider)
- Workflow step mutation & progression lifecycle

Security note: `/health` deliberately bypasses API key enforcement to support external uptime monitoring while still emitting a correlation ID.

### 🌐 API Manager

Unified API gateway providing routing, security, rate limiting, and monitoring.

**Key Features:**

- Request routing and load balancing
- Authentication and authorization
- Rate limiting and throttling
- API analytics and monitoring

### 📱 Applications Service

Manages SaaS integrations and custom applications with health monitoring and performance tracking.

**Key Features:**

- SaaS integration management
- Health monitoring
- Performance analytics
- Custom app deployment

## 📚 Documentation

| Document                                          | Description                                             |
| ------------------------------------------------- | ------------------------------------------------------- |
| [🏗️ Architecture Guide](docs/architecture.md)     | System design, components, and data flow                |
| [📖 API Documentation](docs/api-documentation.md) | Complete REST API reference with examples               |
| [🚀 Deployment Guide](docs/deployment-guide.md)   | Production deployment and infrastructure setup          |
| [👨‍💻 Developer Guide](docs/developer-guide.md)     | Development setup, coding standards, and best practices |

## 💻 Development

### Local Development Setup

1. **Install service dependencies:**

```bash
# Install all service dependencies
npm run install:all

# Or install individually
cd onboarding && npm install
cd marketplace && npm install
# ... repeat for each service
```

1. **Set up databases (D1 for onboarding service):**

```bash
# Create (or ensure) local D1 database (name can differ)
wrangler d1 create atlasit-local

# Apply onboarding service migrations
cd onboarding
wrangler d1 migrations apply atlasit-local --local
```

1. **Start development servers:**

```bash
# Core services (onboarding + orchestrator)
npm run dev:core

# All declared services (parallel)
npm run dev

# Individual
cd onboarding && npm run dev
```

### Testing

Current implemented suite uses Vitest unit tests.

```bash
# Run unit tests
npm run test:unit

# Run with coverage (thresholds enforced: lines 40%, funcs 40%, branches 30%, statements 40%)
npm run test:coverage
```

Service-specific tests can be run within each service directory.

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

### Secret Scanning

Secret scanning runs in CI (pre typecheck/lint) and can be invoked locally:

```bash
npm run scan:secrets
```

The script flags common credential patterns (API keys, private keys). Use mock-looking values that avoid real key patterns when adding fixtures.

### Environment Validation (Script)

Validate required environment variables before running broader workflows:

```bash
npm run validate:env
```

This checks for: Cloudflare account id, API token (prefers CLOUDFLARE_API_TOKEN, accepts legacy CF_API_TOKEN), D1 db name, KV namespace, R2 bucket, service API keys, and Okta credentials when `FEATURE_IDP_OKTA=true`.
Cross-reference `ops/DEPLOYMENT_SECRETS_CHECKLIST.md` for 1Password mapping and service key generation guidance before deploys.

### Environment Validation (Runtime)

Both onboarding and AI orchestrator perform a one-time environment validation on first request using a shared Zod schema. Warnings (not fatal) surface missing or invalid optional values early.

## MVP Readiness Matrix

| Component                          | Status                             | Included in MVP | Operational Criteria Met                                                    | Notes                                                    |
| ---------------------------------- | ---------------------------------- | --------------- | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| Onboarding Worker                  | Implemented                        | Yes             | Health, start/submit/state endpoints, negative tests, D1 migration baseline | Further: add persistence logic using D1                  |
| AI Orchestrator (ai-orchestrator/) | Endpoints + rate limit + workflows | Yes (expanded)  | /health, /status, rate limiting, workflow create/get, tests                 | Refactor AI calls; persist workflows (Durable Object)    |
| Shared Utilities (@atlasit/shared) | Implemented                        | Yes             | Logger, env, AI abstraction, http helpers exported                          | Needs build step in CI before tests (pretest hook added) |
| Auth Service                       | Placeholder                        | Deferred        | N/A                                                                         | Future: OIDC/SAML integration                            |
| Marketplace                        | Placeholder                        | Deferred        | N/A                                                                         | Future: app registry & install flows                     |
| API Manager                        | Placeholder                        | Deferred        | N/A                                                                         | Future: routing, rate limits                             |
| Applications Service               | Placeholder                        | Deferred        | N/A                                                                         | Future: integration adapters                             |
| Infrastructure (Terraform)         | Scaffold                           | Yes (baseline)  | Directory + plan docs                                                       | Apply once domains decided                               |
| Security (Secret Scan)             | Implemented                        | Yes             | CI step + local script                                                      | Extend patterns incrementally                            |
| Testing & Coverage                 | Partial                            | Yes             | Unit tests + coverage thresholds                                            | Increase thresholds over time                            |
| Database (D1)                      | Initial migration                  | Yes             | tenants & onboarding_sessions tables                                        | Add queries & persistence code                           |
| Observability                      | Planned                            | Optional        | —                                                                           | Future: metrics, tracing, dashboards                     |
| UI Dashboard                       | Planned                            | Optional        | —                                                                           | React app not yet scaffolded                             |

## Optional / Phase 2+ Components

These are intentionally deferred to keep MVP lean while preserving clear upgrade paths:

- Advanced AI workflow orchestration (multi-model strategies, tool selection)
- Full Auth provider federation (Okta/Auth0/Entra) & SCIM provisioning
- Marketplace publish/approval workflow & billing hooks
- Comprehensive observability stack (Prometheus exporters, Grafana dashboards, tracing)
- UI dashboard (tenant admin console & analytics)
- Rate limiting & advanced API analytics (per-tenant quotas)
- Fine-grained RBAC & policy engine (OPA/Rego or Cedar)
- Automated compliance report generation (SOC2-style evidence collection)

## Roadmap Next Steps (Short-Term Updated)

1. Persist onboarding state fully in D1 (remove KV dependency) & add retrieval queries.
2. Orchestrator: Refactor AI invocation to shared provider + mockable interface for tests.
3. Durable Object (or R2) backed workflow engine (persist + status transitions, step logs).
4. Expand orchestrator tests: `/task`, `/terminal`, AI assistance decision, negative paths.
5. Add Auth service skeleton (health + /login + token issuance) & integrate with API gateway.
6. Introduce centralized rate limit analytics (export metrics; prepare for Prometheus integration).
7. CI: Per-workspace lint/typecheck/test matrix & coverage gating (raise thresholds gradually).
8. Add SECURITY.md (threat model, key management, rate limiting strategy, future mTLS plan).

## Script Reference (Updated)

| Script                  | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `npm run install:all`   | Install root + all workspace dependencies              |
| `npm run dev:core`      | Start core MVP services (onboarding + ai-orchestrator) |
| `npm run test:unit`     | Run Vitest unit suite (shared + service tests)         |
| `npm run test:coverage` | Run tests with coverage & threshold enforcement        |
| `npm run scan:secrets`  | Execute local secret scanning script                   |
| `npm run build:shared`  | Build shared utilities package                         |

## Orchestrator Directory Note

The active orchestrator worker source lives in `ai-orchestrator/` (Hono-based). A legacy `orchestrator/` directory remains for documentation drafts; future consolidation will either migrate or remove the legacy folder.

## Deployment

### Production Deployment

1. **Configure infrastructure:**

```bash
cd terraform/cloudflare
terraform init
terraform plan -var="domain=yourdomain.com"
terraform apply
```

1. **Deploy services:**

```bash
# Deploy all services
npm run deploy

# Or deploy individually
cd onboarding && npm run deploy
```

1. **Verify deployment:**

```bash
# Check service health
curl https://api.yourdomain.com/health
```

For detailed deployment instructions, see the [Deployment Guide](docs/deployment-guide.md).

### Environment Configuration

| Environment | Purpose                | URL                                  |
| ----------- | ---------------------- | ------------------------------------ |
| Development | Local development      | `http://localhost:8787`              |
| Staging     | Pre-production testing | `https://staging-api.yourdomain.com` |
| Production  | Live environment       | `https://api.yourdomain.com`         |

## Contributing

We welcome contributions! Please see our [Developer Guide](docs/developer-guide.md) for detailed information.

### Quick Contribution Steps

1. **Fork the repository**
1. **Create a feature branch:**

```bash
git checkout -b feature/amazing-feature
```

1. **Make your changes and add tests**

1. **Ensure all tests pass:**

```bash
npm test
```

1. **Commit your changes:**

```bash
git commit -m 'feat: add amazing feature'
```

1. **Push to your branch:**

```bash
git push origin feature/amazing-feature
```

1. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure code passes all quality checks

## Technology Stack

| Category           | Technology                       |
| ------------------ | -------------------------------- |
| **Runtime**        | Cloudflare Workers (V8 Isolates) |
| **Language**       | TypeScript                       |
| **Database**       | Cloudflare D1 (SQLite)           |
| **Storage**        | Cloudflare KV                    |
| **Frontend**       | React + TypeScript               |
| **Testing**        | Vitest + Playwright              |
| **Infrastructure** | Terraform                        |
| **CI/CD**          | GitHub Actions                   |

## Performance & Scalability

- **Global Edge Distribution**: Deployed across 200+ Cloudflare data centers
- **Sub-100ms Response Times**: Optimized for low latency
- **Auto-scaling**: Serverless architecture scales automatically
- **99.9% Uptime SLA**: Enterprise-grade reliability

## Security Features

- **Zero-Trust Architecture**: Every request is authenticated and authorized
- **End-to-End Encryption**: Data encrypted in transit and at rest
- **Compliance Ready**: GDPR, CCPA, SOC 2, HIPAA support
- **Audit Logging**: Comprehensive audit trails for all operations
- **Rate Limiting**: Protection against abuse and DDoS attacks

## Monitoring & Observability

- **Real-time Metrics**: Performance and usage analytics
- **Error Tracking**: Comprehensive error monitoring and alerting
- **Health Checks**: Automated service health monitoring
- **Distributed Tracing**: Request tracing across services
- **Custom Dashboards**: Grafana-based monitoring dashboards

## Support

- **📖 Documentation**: Comprehensive guides and API reference
- **🐛 Issues**: [GitHub Issues](https://github.com/yourusername/atlasit/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/yourusername/atlasit/discussions)
- **📧 Email**: [support@atlasit.com](mailto:support@atlasit.com)
- **📊 Status Page**: [status.atlasit.com](https://status.atlasit.com)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Cloudflare Workers team for the excellent serverless platform
- The open-source community for the amazing tools and libraries
- All contributors who help make AtlasIT better

---

### Built with ❤️ by the AtlasIT team
