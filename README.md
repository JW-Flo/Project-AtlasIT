# AtlasIT

AtlasIT is a modular, cloud-first IT management platform for SMBs that automates user provisioning, SaaS onboarding, identity/infrastructure access, device enrollment, communications, security, reporting, and cost management—with compliance and AI-powered onboarding built in.

## 🚀 Key Features

- **🤖 AI-Guided Tenant Onboarding**: Dynamic template Q&A system for rapid, secure setup tailored to client needs
- **🏪 App Marketplace**: Pluggable app/integration onboarding for SaaS, security, finance, and more
- **🎯 Central Orchestrator (MCP)**: Event-driven microservices architecture with automated workflow management
- **🔐 Multi-Tenant Authentication**: Support for OIDC/SAML/SCIM, Okta, Auth0, or AtlasIT's internal IdP
- **🌐 API Manager**: Unified gateway for all internal/external API traffic with security enforcement
- **☁️ Cloud-First, Serverless**: Powered by Cloudflare Workers with global edge distribution
- **🛡️ Security & Compliance**: Built-in logging, audit trails, SIEM/EDR integrations, and compliance reporting

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Services Overview](#services-overview)
- [Documentation](#documentation)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

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

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Authenticate with Cloudflare:**
   ```bash
   wrangler login
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Access the application:**
   - API: `http://localhost:8787`
   - Dashboard: `http://localhost:3000`

## 📁 Project Structure

```
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

## 🔧 Services Overview

### 🎯 Onboarding Service
AI-powered tenant configuration with industry-specific templates, automated setup workflows, and integration validation.

**Key Features:**
- Dynamic questionnaire generation
- Industry-specific configurations (Healthcare, Finance, Retail)
- Automated template creation
- Integration validation pipeline

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

| Document | Description |
|----------|-------------|
| [🏗️ Architecture Guide](docs/architecture.md) | System design, components, and data flow |
| [📖 API Documentation](docs/api-documentation.md) | Complete REST API reference with examples |
| [🚀 Deployment Guide](docs/deployment-guide.md) | Production deployment and infrastructure setup |
| [👨‍💻 Developer Guide](docs/developer-guide.md) | Development setup, coding standards, and best practices |

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

2. **Set up databases:**
   ```bash
   # Create local D1 databases
   wrangler d1 create atlasit-local
   
   # Run migrations
   cd onboarding && wrangler d1 migrations apply atlasit-local --local
   ```

3. **Start development servers:**
   ```bash
   # Start all services
   npm run dev
   
   # Or start individual services
   cd onboarding && npm run dev
   ```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 🚀 Deployment

### Production Deployment

1. **Configure infrastructure:**
   ```bash
   cd terraform/cloudflare
   terraform init
   terraform plan -var="domain=yourdomain.com"
   terraform apply
   ```

2. **Deploy services:**
   ```bash
   # Deploy all services
   npm run deploy

   # Or deploy individually
   cd onboarding && npm run deploy
   ```

3. **Verify deployment:**
   ```bash
   # Check service health
   curl https://api.yourdomain.com/health
   ```

For detailed deployment instructions, see the [Deployment Guide](docs/deployment-guide.md).

### Environment Configuration

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local development | `http://localhost:8787` |
| Staging | Pre-production testing | `https://staging-api.yourdomain.com` |
| Production | Live environment | `https://api.yourdomain.com` |

## 🤝 Contributing

We welcome contributions! Please see our [Developer Guide](docs/developer-guide.md) for detailed information.

### Quick Contribution Steps

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes and add tests**
4. **Ensure all tests pass:**
   ```bash
   npm test
   ```
5. **Commit your changes:**
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push to your branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages
- Ensure code passes all quality checks

## 🏗️ Technology Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Cloudflare Workers (V8 Isolates) |
| **Language** | TypeScript |
| **Database** | Cloudflare D1 (SQLite) |
| **Storage** | Cloudflare KV |
| **Frontend** | React + TypeScript |
| **Testing** | Vitest + Playwright |
| **Infrastructure** | Terraform |
| **CI/CD** | GitHub Actions |

## 📊 Performance & Scalability

- **Global Edge Distribution**: Deployed across 200+ Cloudflare data centers
- **Sub-100ms Response Times**: Optimized for low latency
- **Auto-scaling**: Serverless architecture scales automatically
- **99.9% Uptime SLA**: Enterprise-grade reliability

## 🛡️ Security Features

- **Zero-Trust Architecture**: Every request is authenticated and authorized
- **End-to-End Encryption**: Data encrypted in transit and at rest
- **Compliance Ready**: GDPR, CCPA, SOC 2, HIPAA support
- **Audit Logging**: Comprehensive audit trails for all operations
- **Rate Limiting**: Protection against abuse and DDoS attacks

## 📈 Monitoring & Observability

- **Real-time Metrics**: Performance and usage analytics
- **Error Tracking**: Comprehensive error monitoring and alerting
- **Health Checks**: Automated service health monitoring
- **Distributed Tracing**: Request tracing across services
- **Custom Dashboards**: Grafana-based monitoring dashboards

## 🆘 Support

- **📖 Documentation**: Comprehensive guides and API reference
- **🐛 Issues**: [GitHub Issues](https://github.com/yourusername/atlasit/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/yourusername/atlasit/discussions)
- **📧 Email**: support@atlasit.com
- **📊 Status Page**: [status.atlasit.com](https://status.atlasit.com)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Cloudflare Workers team for the excellent serverless platform
- The open-source community for the amazing tools and libraries
- All contributors who help make AtlasIT better

---

**Built with ❤️ by the AtlasIT team**
