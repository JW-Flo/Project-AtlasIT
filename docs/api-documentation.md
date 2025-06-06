# AtlasIT API Documentation

Complete API reference for the AtlasIT multi-tenant platform services.

## Overview

AtlasIT provides a comprehensive suite of microservices for enterprise automation and integration. Each service exposes RESTful APIs with consistent patterns for authentication, error handling, and data formats.

## Base URLs

- **Production**: `https://api.atlasit.com`
- **Staging**: `https://staging-api.atlasit.com`
- **Development**: `http://localhost:3000`

## Authentication

All API endpoints require authentication unless otherwise specified. AtlasIT supports multiple authentication methods:

### JWT Bearer Token
```http
Authorization: Bearer <jwt_token>
```

### API Key
```http
X-API-Key: <api_key>
```

### OAuth 2.0
```http
Authorization: Bearer <oauth_token>
```

## Common Response Format

All API responses follow a consistent structure:

### Success Response
```json
{
  "status": "success",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "req_123456789"
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [...],
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req_123456789"
  }
}
```

## HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `400` - Bad Request: Invalid request parameters
- `401` - Unauthorized: Authentication required
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource not found
- `409` - Conflict: Resource already exists
- `422` - Unprocessable Entity: Validation failed
- `429` - Too Many Requests: Rate limit exceeded
- `500` - Internal Server Error: Server error
- `503` - Service Unavailable: Service temporarily unavailable

---

# Onboarding Service API

Manages AI-guided tenant configuration and setup processes.

## Base Path: `/api/onboarding`

### POST /api/onboarding
Create and configure a new tenant with AI-generated recommendations.

**Request Body:**
```json
{
  "tenantId": "string",
  "name": "string",
  "industry": "healthcare|finance|retail|manufacturing|education",
  "requirements": ["string"],
  "contactEmail": "string",
  "organizationSize": "startup|small|medium|large|enterprise"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "tenantId": "tenant_123",
    "config": {
      "industry": "healthcare",
      "integrations": [
        {
          "id": "epic-integration",
          "name": "Epic EHR Integration",
          "type": "saas",
          "enabled": true,
          "config": {...}
        }
      ],
      "workflows": [...],
      "security": {
        "authentication": {
          "method": "saml",
          "config": {...}
        },
        "authorization": {...},
        "encryption": {...}
      }
    },
    "template": {
      "id": "template_456",
      "name": "Healthcare Configuration Template",
      "files": [...]
    }
  }
}
```

### GET /api/onboarding/{tenantId}
Retrieve onboarding status and configuration for a tenant.

**Parameters:**
- `tenantId` (path): Unique tenant identifier

**Response:**
```json
{
  "status": "success",
  "data": {
    "status": "configured|in_progress|failed",
    "timestamp": "2024-01-01T00:00:00Z",
    "config": {...},
    "template": {...},
    "progress": {
      "completed": 75,
      "total": 100,
      "currentStep": "integration_setup"
    }
  }
}
```

### PUT /api/onboarding/{tenantId}
Update tenant configuration.

**Request Body:**
```json
{
  "config": {...},
  "requirements": ["string"]
}
```

### DELETE /api/onboarding/{tenantId}
Remove tenant onboarding configuration.

---

# Marketplace Service API

Manages application discovery, installation, and lifecycle.

## Base Path: `/api/marketplace`

### GET /api/marketplace/apps
List available applications and integrations.

**Query Parameters:**
- `category` (optional): Filter by category
- `industry` (optional): Filter by industry
- `search` (optional): Search term
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "status": "success",
  "data": {
    "apps": [
      {
        "id": "app_123",
        "name": "Salesforce CRM",
        "description": "Customer relationship management",
        "category": "crm",
        "industry": ["finance", "retail"],
        "version": "1.2.0",
        "pricing": {...},
        "features": [...],
        "screenshots": [...],
        "ratings": {
          "average": 4.5,
          "count": 150
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### GET /api/marketplace/apps/{appId}
Get detailed information about a specific application.

### POST /api/marketplace/apps/{appId}/install
Install an application for a tenant.

**Request Body:**
```json
{
  "tenantId": "string",
  "config": {...}
}
```

### GET /api/marketplace/installed
List installed applications for a tenant.

### PUT /api/marketplace/installed/{installationId}
Update installed application configuration.

### DELETE /api/marketplace/installed/{installationId}
Uninstall an application.

---

# Authentication Service API

Manages multi-tenant authentication and authorization.

## Base Path: `/api/auth`

### POST /api/auth/login
Authenticate user credentials.

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "tenantId": "string"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "roles": ["admin"],
      "permissions": [...]
    },
    "tenant": {
      "id": "tenant_123",
      "name": "Acme Corp"
    },
    "expiresAt": "2024-01-01T01:00:00Z"
  }
}
```

### POST /api/auth/refresh
Refresh authentication token.

### POST /api/auth/logout
Logout and invalidate tokens.

### GET /api/auth/me
Get current user information.

### POST /api/auth/register
Register new user account.

### POST /api/auth/forgot-password
Initiate password reset process.

### POST /api/auth/reset-password
Complete password reset.

### GET /api/auth/sso/{provider}
Initiate SSO authentication.

### POST /api/auth/sso/callback
Handle SSO callback.

---

# Orchestrator Service API

Manages workflows, events, and automation.

## Base Path: `/api/orchestrator`

### GET /api/orchestrator/workflows
List workflows for a tenant.

### POST /api/orchestrator/workflows
Create a new workflow.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "trigger": {
    "type": "webhook|schedule|event",
    "config": {...}
  },
  "actions": [
    {
      "type": "api_call|notification|data_transform",
      "config": {...}
    }
  ],
  "enabled": true
}
```

### GET /api/orchestrator/workflows/{workflowId}
Get workflow details.

### PUT /api/orchestrator/workflows/{workflowId}
Update workflow configuration.

### DELETE /api/orchestrator/workflows/{workflowId}
Delete workflow.

### POST /api/orchestrator/workflows/{workflowId}/execute
Manually execute workflow.

### GET /api/orchestrator/workflows/{workflowId}/executions
Get workflow execution history.

### GET /api/orchestrator/events
List recent events.

### POST /api/orchestrator/events
Create custom event.

---

# API Manager Service API

Manages API routing, security, and monitoring.

## Base Path: `/api/manager`

### GET /api/manager/routes
List configured API routes.

### POST /api/manager/routes
Create new API route.

**Request Body:**
```json
{
  "path": "/api/custom/*",
  "method": "GET|POST|PUT|DELETE|*",
  "target": "https://backend.example.com",
  "authentication": {
    "required": true,
    "methods": ["jwt", "api_key"]
  },
  "rateLimit": {
    "requests": 100,
    "window": "1h"
  },
  "caching": {
    "enabled": true,
    "ttl": 300
  }
}
```

### GET /api/manager/routes/{routeId}
Get route configuration.

### PUT /api/manager/routes/{routeId}
Update route configuration.

### DELETE /api/manager/routes/{routeId}
Delete route.

### GET /api/manager/analytics
Get API usage analytics.

### GET /api/manager/logs
Get API access logs.

---

# Applications Service API

Manages SaaS integrations and custom applications.

## Base Path: `/api/applications`

### GET /api/applications
List configured applications.

### POST /api/applications
Add new application integration.

**Request Body:**
```json
{
  "name": "string",
  "type": "saas|api|database|custom",
  "config": {
    "apiKey": "string",
    "baseUrl": "string",
    "webhookUrl": "string"
  },
  "healthCheck": {
    "enabled": true,
    "interval": 300,
    "timeout": 10
  }
}
```

### GET /api/applications/{appId}
Get application details.

### PUT /api/applications/{appId}
Update application configuration.

### DELETE /api/applications/{appId}
Remove application.

### POST /api/applications/{appId}/test
Test application connectivity.

### GET /api/applications/{appId}/health
Get application health status.

### GET /api/applications/{appId}/logs
Get application logs.

---

# Webhooks

AtlasIT supports webhooks for real-time event notifications.

## Webhook Events

### Tenant Events
- `tenant.created`
- `tenant.updated`
- `tenant.deleted`

### Application Events
- `application.installed`
- `application.updated`
- `application.uninstalled`

### Workflow Events
- `workflow.executed`
- `workflow.failed`
- `workflow.completed`

### Authentication Events
- `user.login`
- `user.logout`
- `user.registered`

## Webhook Payload Format

```json
{
  "event": "tenant.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {...},
  "tenantId": "tenant_123",
  "signature": "sha256=..."
}
```

## Webhook Security

Webhooks are signed using HMAC-SHA256. Verify the signature using your webhook secret:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

---

# Rate Limiting

API endpoints are rate limited to ensure fair usage:

- **Default**: 1000 requests per hour per API key
- **Burst**: 100 requests per minute
- **Premium**: 10,000 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

# SDKs and Libraries

Official SDKs are available for popular programming languages:

- **JavaScript/Node.js**: `npm install @atlasit/sdk`
- **Python**: `pip install atlasit-sdk`
- **Go**: `go get github.com/atlasit/go-sdk`
- **Java**: Maven/Gradle dependency available

## JavaScript SDK Example

```javascript
import { AtlasIT } from '@atlasit/sdk';

const client = new AtlasIT({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.atlasit.com'
});

// Create tenant
const tenant = await client.onboarding.create({
  tenantId: 'my-tenant',
  name: 'My Company',
  industry: 'finance'
});

// Install application
await client.marketplace.install('salesforce-crm', {
  tenantId: 'my-tenant',
  config: { apiKey: 'sf-key' }
});
```

---

# Error Codes

## Common Error Codes

- `INVALID_REQUEST`: Malformed request
- `AUTHENTICATION_REQUIRED`: Missing authentication
- `INSUFFICIENT_PERMISSIONS`: Access denied
- `RESOURCE_NOT_FOUND`: Resource doesn't exist
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily down

## Service-Specific Error Codes

### Onboarding Service
- `TENANT_ALREADY_EXISTS`: Tenant ID already in use
- `INVALID_INDUSTRY`: Unsupported industry type
- `CONFIG_GENERATION_FAILED`: AI configuration failed

### Marketplace Service
- `APP_NOT_AVAILABLE`: Application not available
- `INSTALLATION_FAILED`: Installation process failed
- `DEPENDENCY_CONFLICT`: Conflicting dependencies

### Authentication Service
- `INVALID_CREDENTIALS`: Wrong username/password
- `ACCOUNT_LOCKED`: Account temporarily locked
- `TOKEN_EXPIRED`: Authentication token expired
- `SSO_ERROR`: SSO authentication failed

---

# Support

For API support and questions:

- **Documentation**: https://docs.atlasit.com
- **Support Portal**: https://support.atlasit.com
- **Email**: api-support@atlasit.com
- **Status Page**: https://status.atlasit.com

## SLA

- **Uptime**: 99.9% availability
- **Response Time**: < 200ms average
- **Support Response**: < 4 hours for critical issues
