# AtlasIT Deployment Guide

Complete guide for deploying AtlasIT services to production environments.

## Overview

AtlasIT is designed as a cloud-native, microservices architecture that can be deployed across multiple environments. This guide covers deployment to Cloudflare Workers, AWS, Google Cloud, and on-premises infrastructure.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Gateway   │    │   Auth Service  │
│   (Cloudflare)  │────│  (API Manager)  │────│   (Workers)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │ Onboarding   │ │ Marketplace │ │Orchestrator│
        │  Service     │ │   Service   │ │  Service   │
        │ (Workers)    │ │ (Workers)   │ │ (Workers)  │
        └──────────────┘ └─────────────┘ └────────────┘
                │               │               │
        ┌───────▼───────────────▼───────────────▼──────┐
        │            Applications Service              │
        │              (Workers)                      │
        └─────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
        │  Database    │ │   Storage   │ │ Monitoring │
        │    (D1)      │ │    (KV)     │ │ (Analytics)│
        └──────────────┘ └─────────────┘ └────────────┘
```

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- Wrangler CLI (`npm install -g wrangler`)
- Terraform (for infrastructure)
- Git
- Docker (for local development)

### Required Accounts
- Cloudflare account with Workers plan
- Domain name (for custom domains)
- AI API access (OpenAI, Anthropic, or similar)

### Environment Setup
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

## Infrastructure Setup

### 1. Cloudflare Configuration

#### Create D1 Database
```bash
# Create production database
wrangler d1 create atlasit-prod

# Create staging database
wrangler d1 create atlasit-staging

# Note the database IDs for wrangler.toml configuration
```

#### Create KV Namespaces
```bash
# Create production KV namespaces
wrangler kv:namespace create "STATE" --preview false
wrangler kv:namespace create "CACHE" --preview false
wrangler kv:namespace create "SESSIONS" --preview false

# Create staging KV namespaces
wrangler kv:namespace create "STATE" --preview true
wrangler kv:namespace create "CACHE" --preview true
wrangler kv:namespace create "SESSIONS" --preview true
```

#### Configure Custom Domain
```bash
# Add custom domain to Cloudflare
wrangler custom-domains add api.yourdomain.com

# Configure SSL/TLS settings in Cloudflare dashboard
# Set SSL/TLS encryption mode to "Full (strict)"
```

### 2. Terraform Infrastructure

Create infrastructure using Terraform:

```bash
cd terraform/cloudflare
terraform init
terraform plan -var="domain=yourdomain.com"
terraform apply
```

## Service Deployment

### 1. Onboarding Service

```bash
cd onboarding

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
wrangler d1 migrations apply atlasit-prod

# Deploy to production
npm run deploy

# Deploy to staging
npm run deploy:staging
```

#### Onboarding wrangler.toml
```toml
name = "atlasit-onboarding"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }
kv_namespaces = [
  { binding = "STATE", id = "your-kv-namespace-id" }
]
d1_databases = [
  { binding = "DB", database_name = "atlasit-prod", database_id = "your-db-id" }
]

[env.staging]
vars = { ENVIRONMENT = "staging" }
kv_namespaces = [
  { binding = "STATE", id = "your-staging-kv-id" }
]
d1_databases = [
  { binding = "DB", database_name = "atlasit-staging", database_id = "your-staging-db-id" }
]
```

### 2. Marketplace Service

```bash
cd marketplace

# Install and configure
npm install
cp .env.example .env

# Deploy
npm run deploy
```

### 3. Authentication Service

```bash
cd auth

# Install and configure
npm install
cp .env.example .env

# Deploy
npm run deploy
```

### 4. Orchestrator Service

```bash
cd orchestrator

# Install and configure
npm install
cp .env.example .env

# Deploy
npm run deploy
```

### 5. API Manager Service

```bash
cd api-manager

# Install and configure
npm install
cp .env.example .env

# Deploy
npm run deploy
```

### 6. Applications Service

```bash
cd applications

# Install and configure
npm install
cp .env.example .env

# Deploy
npm run deploy
```

## Environment Configuration

### Production Environment Variables

Create `.env` files for each service with production values:

```bash
# Common variables for all services
ENVIRONMENT=production
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com

# AI Configuration
AI_API_KEY=your-ai-api-key
AI_MODEL=gpt-4

# Database Configuration
DATABASE_URL=your-d1-database-url

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# External Integrations
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SALESFORCE_CLIENT_ID=your-sf-client-id
SALESFORCE_CLIENT_SECRET=your-sf-client-secret

# Monitoring
ANALYTICS_API_KEY=your-analytics-key
ERROR_TRACKING_DSN=your-sentry-dsn
```

### Staging Environment Variables

```bash
# Staging-specific overrides
ENVIRONMENT=staging
LOG_LEVEL=debug
CORS_ORIGIN=https://staging.yourdomain.com
AI_MODEL=gpt-3.5-turbo
```

## Database Migrations

### Running Migrations

```bash
# Production
wrangler d1 migrations apply atlasit-prod

# Staging
wrangler d1 migrations apply atlasit-staging

# Local development
wrangler d1 migrations apply atlasit-local --local
```

### Creating New Migrations

```bash
# Create new migration file
wrangler d1 migrations create atlasit-prod "add_new_table"

# Edit the generated SQL file
# Run the migration
wrangler d1 migrations apply atlasit-prod
```

## Custom Domains and SSL

### Configure Custom Domains

1. **Add Domain to Cloudflare**
   ```bash
   wrangler custom-domains add api.yourdomain.com
   ```

2. **Configure DNS Records**
   - Add CNAME record: `api.yourdomain.com` → `your-worker.workers.dev`
   - Enable Cloudflare proxy (orange cloud)

3. **SSL Configuration**
   - Set SSL/TLS mode to "Full (strict)"
   - Enable "Always Use HTTPS"
   - Configure HSTS headers

### Route Configuration

Update `wrangler.toml` for custom domains:

```toml
routes = [
  { pattern = "api.yourdomain.com/onboarding/*", custom_domain = true },
  { pattern = "api.yourdomain.com/marketplace/*", custom_domain = true },
  { pattern = "api.yourdomain.com/auth/*", custom_domain = true }
]
```

## Monitoring and Observability

### 1. Cloudflare Analytics

Enable analytics in `wrangler.toml`:

```toml
[observability]
enabled = true
head_sampling_rate = 1.0
```

### 2. Error Tracking

Configure Sentry or similar:

```javascript
// In each service
import * as Sentry from '@sentry/cloudflare';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.ENVIRONMENT,
  tracesSampleRate: 1.0,
});
```

### 3. Health Checks

Implement health check endpoints:

```javascript
// Health check endpoint
if (url.pathname === '/health') {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'onboarding',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### 4. Logging

Structured logging configuration:

```javascript
const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      service: 'onboarding',
      ...meta
    }));
  },
  error: (message, error, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      service: 'onboarding',
      ...meta
    }));
  }
};
```

## Security Configuration

### 1. CORS Configuration

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};
```

### 2. Rate Limiting

```javascript
// Rate limiting implementation
const rateLimiter = {
  async isAllowed(key, limit = 100, window = 3600) {
    const current = await env.CACHE.get(`rate_limit:${key}`);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      return false;
    }
    
    await env.CACHE.put(`rate_limit:${key}`, (count + 1).toString(), {
      expirationTtl: window
    });
    
    return true;
  }
};
```

### 3. Input Validation

```javascript
import { z } from 'zod';

const onboardingSchema = z.object({
  tenantId: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  industry: z.enum(['healthcare', 'finance', 'retail', 'manufacturing']),
  requirements: z.array(z.string()).optional()
});

// Validate request
const validation = onboardingSchema.safeParse(requestBody);
if (!validation.success) {
  return new Response(JSON.stringify({
    error: 'Validation failed',
    details: validation.error.errors
  }), { status: 400 });
}
```

## Performance Optimization

### 1. Caching Strategy

```javascript
// Cache configuration
const cacheConfig = {
  static: 86400,      // 24 hours for static content
  api: 300,           // 5 minutes for API responses
  user: 60,           // 1 minute for user-specific data
};

// Cache implementation
async function getCachedResponse(key, ttl, generator) {
  const cached = await env.CACHE.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await generator();
  await env.CACHE.put(key, JSON.stringify(data), {
    expirationTtl: ttl
  });
  
  return data;
}
```

### 2. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_tenants_industry ON tenants(industry);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);
CREATE INDEX idx_onboarding_status ON onboarding_sessions(status);
```

### 3. Bundle Optimization

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    minimize: true,
    sideEffects: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
};
```

## Backup and Recovery

### 1. Database Backups

```bash
# Export database
wrangler d1 export atlasit-prod --output backup.sql

# Import database
wrangler d1 execute atlasit-prod --file backup.sql
```

### 2. KV Backup

```bash
# Backup KV namespace
wrangler kv:bulk get --namespace-id your-kv-id > kv-backup.json

# Restore KV namespace
wrangler kv:bulk put --namespace-id your-kv-id kv-backup.json
```

## Deployment Automation

### 1. GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy AtlasIT Services

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 2. Deployment Script

Create `scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying AtlasIT Services..."

# Deploy each service
services=("onboarding" "marketplace" "auth" "orchestrator" "api-manager" "applications")

for service in "${services[@]}"; do
  echo "📦 Deploying $service..."
  cd $service
  npm ci
  npm run build
  npm run deploy
  cd ..
  echo "✅ $service deployed successfully"
done

echo "🎉 All services deployed successfully!"
```

## Troubleshooting

### Common Issues

#### 1. Worker Deployment Fails
```bash
# Check wrangler configuration
wrangler whoami
wrangler kv:namespace list
wrangler d1 list

# Verify environment variables
wrangler secret list
```

#### 2. Database Connection Issues
```bash
# Test database connection
wrangler d1 execute atlasit-prod --command "SELECT 1"

# Check migrations
wrangler d1 migrations list atlasit-prod
```

#### 3. KV Access Issues
```bash
# Test KV access
wrangler kv:key get "test-key" --namespace-id your-kv-id

# List KV keys
wrangler kv:key list --namespace-id your-kv-id
```

### Debugging

#### 1. Local Development
```bash
# Run locally with --local flag
wrangler dev --local

# Use local D1 database
wrangler d1 execute atlasit-local --local --command "SELECT * FROM tenants"
```

#### 2. Production Debugging
```bash
# View real-time logs
wrangler tail

# View specific service logs
wrangler tail --filter "onboarding"
```

## Scaling Considerations

### 1. Worker Limits
- CPU time: 50ms per request (paid plan: 50ms-30s)
- Memory: 128MB
- Request size: 100MB
- Response size: 100MB

### 2. Database Limits
- D1: 25GB storage per database
- 25 million row reads per day
- 50,000 row writes per day

### 3. KV Limits
- 1GB per namespace
- 25 million reads per month
- 1 million writes per month

### 4. Optimization Strategies
- Use KV for caching frequently accessed data
- Implement request batching for database operations
- Use Durable Objects for stateful operations
- Consider edge caching for static content

## Support and Maintenance

### 1. Monitoring Checklist
- [ ] Health checks responding
- [ ] Error rates within acceptable limits
- [ ] Response times under 200ms
- [ ] Database connections healthy
- [ ] KV operations successful

### 2. Regular Maintenance
- Weekly: Review error logs and performance metrics
- Monthly: Update dependencies and security patches
- Quarterly: Review and optimize database queries
- Annually: Security audit and penetration testing

### 3. Emergency Procedures
1. **Service Outage**: Check Cloudflare status page
2. **Database Issues**: Switch to read-only mode if needed
3. **Security Incident**: Rotate secrets and API keys
4. **Performance Issues**: Enable additional caching

## Cost Optimization

### 1. Cloudflare Workers Pricing
- Free tier: 100,000 requests/day
- Paid tier: $5/month + $0.50/million requests

### 2. Cost Monitoring
```bash
# Monitor usage
wrangler metrics

# Set up billing alerts in Cloudflare dashboard
```

### 3. Optimization Tips
- Use KV caching to reduce database queries
- Implement efficient request routing
- Monitor and optimize bundle sizes
- Use appropriate cache TTLs

---

For additional support, contact the AtlasIT team or refer to the [API Documentation](./api-documentation.md).
