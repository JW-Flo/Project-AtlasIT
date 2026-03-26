# AtlasIT Developer Guide

Complete guide for developers working on the AtlasIT platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [API Development](#api-development)
7. [Database Management](#database-management)
8. [Frontend Development](#frontend-development)
9. [Deployment Process](#deployment-process)
10. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: JavaScript runtime
- **npm or yarn**: Package manager
- **Git**: Version control
- **Wrangler CLI**: Cloudflare Workers deployment tool
- **Docker**: For local development (optional)
- **VS Code**: Recommended IDE with extensions

### Required VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker"
  ]
}
```

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/atlasit.git
   cd atlasit
   ```

2. **Install global dependencies:**
   ```bash
   npm install -g wrangler
   npm install -g typescript
   ```

3. **Install project dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Authenticate with Cloudflare:**
   ```bash
   wrangler login
   ```

## Development Environment

### Local Development Setup

Each service can be run independently for development:

```bash
# Start all services
npm run dev

# Start specific service
cd onboarding && npm run dev
cd marketplace && npm run dev
cd auth && npm run dev
```

### Environment Configuration

Create `.env` files for each service:

```bash
# Common environment variables
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000

# Service-specific variables
AI_API_KEY=your-development-ai-key
DATABASE_URL=local-database-url
JWT_SECRET=development-jwt-secret
```

### Docker Development (Optional)

```bash
# Build development container
docker build -t atlasit-dev .

# Run with docker-compose
docker-compose up -d
```

## Project Structure

```
atlasit/
├── .github/                    # GitHub Actions workflows
├── docs/                       # Documentation
│   ├── api-documentation.md
│   ├── architecture.md
│   ├── deployment-guide.md
│   └── developer-guide.md
├── onboarding/                 # Onboarding service
│   ├── src/
│   │   ├── handlers/          # Request handlers
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helper functions
│   │   └── types.ts           # TypeScript types
│   ├── tests/                 # Test files
│   ├── migrations/            # Database migrations
│   └── wrangler.toml         # Cloudflare config
├── marketplace/               # Marketplace service
├── auth/                      # Authentication service
├── orchestrator/              # Event orchestration
├── api-manager/               # API gateway
├── applications/              # App integrations
├── shared/                    # Shared utilities
│   ├── types/                # Common TypeScript types
│   ├── utils/                # Shared utilities
│   └── constants/            # Application constants
├── terraform/                 # Infrastructure as code
├── scripts/                   # Build and deployment scripts
└── ui/                       # Frontend application
```

### Service Structure

Each service follows a consistent structure:

```
service/
├── src/
│   ├── handlers/             # HTTP request handlers
│   │   └── service-name.ts
│   ├── services/             # Business logic layer
│   │   ├── ai-service.ts
│   │   └── data-service.ts
│   ├── utils/                # Helper functions
│   │   ├── error.ts
│   │   ├── validation.ts
│   │   └── logger.ts
│   ├── types.ts              # TypeScript interfaces
│   └── index.ts              # Main entry point
├── tests/                    # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── migrations/               # Database migrations
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── wrangler.toml
```

## Coding Standards

### TypeScript Guidelines

1. **Use strict type checking:**
   ```typescript
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "noImplicitReturns": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true
     }
   }
   ```

2. **Define interfaces for all data structures:**
   ```typescript
   interface TenantConfig {
     id: string;
     name: string;
     industry: Industry;
     settings: TenantSettings;
   }
   
   interface TenantSettings {
     notifications: boolean;
     autoBackup: boolean;
     retentionDays: number;
   }
   ```

3. **Use enums for constants:**
   ```typescript
   enum Industry {
     HEALTHCARE = 'healthcare',
     FINANCE = 'finance',
     RETAIL = 'retail',
     MANUFACTURING = 'manufacturing'
   }
   ```

4. **Implement proper error handling:**
   ```typescript
   class ServiceError extends Error {
     constructor(
       message: string,
       public code: string,
       public statusCode: number = 500
     ) {
       super(message);
       this.name = 'ServiceError';
     }
   }
   
   // Usage
   throw new ServiceError('Invalid tenant configuration', 'INVALID_CONFIG', 400);
   ```

### Code Formatting

Use Prettier for consistent code formatting:

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Naming Conventions

- **Files**: kebab-case (`user-service.ts`)
- **Functions**: camelCase (`getUserById`)
- **Classes**: PascalCase (`UserService`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Interfaces**: PascalCase with 'I' prefix optional (`User` or `IUser`)

## Testing Guidelines

### Testing Stack

- **Unit Tests**: Vitest
- **Integration Tests**: Vitest with test environment
- **E2E Tests**: Playwright
- **Mocking**: Vitest mocks

### Test Structure

```typescript
// tests/unit/user-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../src/services/user-service';

describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService();
  });
  
  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const result = await userService.createUser(userData);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name
      });
    });
    
    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User'
      };
      
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/onboarding-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { unstable_dev } from 'wrangler';

describe('Onboarding API', () => {
  let worker: any;
  
  beforeAll(async () => {
    worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
  });
  
  afterAll(async () => {
    await worker.stop();
  });
  
  it('should create tenant successfully', async () => {
    const response = await worker.fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'test-tenant',
        name: 'Test Company',
        industry: 'healthcare'
      })
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.status).toBe('success');
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- user-service.test.ts

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## API Development

### Request Handler Pattern

```typescript
// src/handlers/tenant-handler.ts
import { Env } from '../types';
import { handleError } from '../utils/error';
import { validateRequest } from '../utils/validation';
import { TenantService } from '../services/tenant-service';

export async function handleCreateTenant(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedData = await validateRequest(body, createTenantSchema);
    
    // Initialize service
    const tenantService = new TenantService(env);
    
    // Process request
    const tenant = await tenantService.createTenant(validatedData);
    
    // Return response
    return new Response(JSON.stringify({
      status: 'success',
      data: tenant
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    return handleError(error);
  }
}
```

### Validation with Zod

```typescript
// src/utils/validation.ts
import { z } from 'zod';

export const createTenantSchema = z.object({
  tenantId: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  industry: z.enum(['healthcare', 'finance', 'retail']),
  contactEmail: z.string().email(),
  settings: z.object({
    notifications: z.boolean().default(true),
    autoBackup: z.boolean().default(true)
  }).optional()
});

export async function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new ValidationError('Invalid request data', result.error.errors);
  }
  
  return result.data;
}
```

### Service Layer Pattern

```typescript
// src/services/tenant-service.ts
import { Env } from '../types';
import { TenantRepository } from '../repositories/tenant-repository';
import { AIConfigService } from './ai-config-service';

export class TenantService {
  private tenantRepo: TenantRepository;
  private aiService: AIConfigService;
  
  constructor(private env: Env) {
    this.tenantRepo = new TenantRepository(env.DB);
    this.aiService = new AIConfigService(env.AI_API_KEY);
  }
  
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    // Generate AI configuration
    const config = await this.aiService.generateConfig(data);
    
    // Create tenant record
    const tenant = await this.tenantRepo.create({
      ...data,
      config,
      status: 'active',
      createdAt: new Date()
    });
    
    // Trigger onboarding workflow
    await this.triggerOnboarding(tenant.id);
    
    return tenant;
  }
  
  private async triggerOnboarding(tenantId: string): Promise<void> {
    // Implementation for triggering onboarding workflow
  }
}
```

## Database Management

### Migration System

Create new migrations:

```bash
# Create migration file
wrangler d1 migrations create atlasit-prod "add_tenant_settings_table"
```

Migration file structure:

```sql
-- Migration: add_tenant_settings_table
-- Created: 2024-01-01

CREATE TABLE tenant_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_tenant_settings_tenant_id ON tenant_settings(tenant_id);
CREATE INDEX idx_tenant_settings_key ON tenant_settings(key);
```

### Database Access Pattern

```typescript
// src/repositories/tenant-repository.ts
export class TenantRepository {
  constructor(private db: D1Database) {}
  
  async create(tenant: CreateTenantData): Promise<Tenant> {
    const stmt = this.db.prepare(`
      INSERT INTO tenants (id, name, industry, config, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = await stmt.bind(
      tenant.id,
      tenant.name,
      tenant.industry,
      JSON.stringify(tenant.config),
      tenant.status,
      tenant.createdAt.toISOString()
    ).run();
    
    if (!result.success) {
      throw new DatabaseError('Failed to create tenant');
    }
    
    return this.findById(tenant.id);
  }
  
  async findById(id: string): Promise<Tenant | null> {
    const stmt = this.db.prepare('SELECT * FROM tenants WHERE id = ?');
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return null;
    }
    
    return {
      ...result,
      config: JSON.parse(result.config as string),
      createdAt: new Date(result.created_at as string)
    } as Tenant;
  }
}
```

### Query Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_tenants_industry ON tenants(industry);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_created_at ON tenants(created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_tenants_industry_status ON tenants(industry, status);
```

## Frontend Development

### React Component Structure

```typescript
// src/components/TenantCard.tsx
import React from 'react';
import { Tenant } from '../types/tenant';

interface TenantCardProps {
  tenant: Tenant;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenantId: string) => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">{tenant.name}</h3>
        <span className={`px-2 py-1 rounded text-sm ${
          tenant.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {tenant.status}
        </span>
      </div>
      
      <p className="text-gray-600 mb-2">Industry: {tenant.industry}</p>
      <p className="text-gray-500 text-sm mb-4">
        Created: {tenant.createdAt.toLocaleDateString()}
      </p>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(tenant)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(tenant.id)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
```

### State Management with Zustand

```typescript
// src/stores/tenant-store.ts
import { create } from 'zustand';
import { Tenant } from '../types/tenant';
import { tenantApi } from '../api/tenant-api';

interface TenantStore {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  
  fetchTenants: () => Promise<void>;
  createTenant: (data: CreateTenantData) => Promise<void>;
  updateTenant: (id: string, data: UpdateTenantData) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
}

export const useTenantStore = create<TenantStore>((set, get) => ({
  tenants: [],
  loading: false,
  error: null,
  
  fetchTenants: async () => {
    set({ loading: true, error: null });
    try {
      const tenants = await tenantApi.getAll();
      set({ tenants, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  
  createTenant: async (data) => {
    set({ loading: true, error: null });
    try {
      const tenant = await tenantApi.create(data);
      set(state => ({
        tenants: [...state.tenants, tenant],
        loading: false
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));
```

## Deployment Process

### Development Workflow

1. **Feature Development:**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   npm test
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Code Review:**
   - Create pull request
   - Automated tests run
   - Code review by team
   - Merge to main branch

3. **Deployment:**
   ```bash
   # Automatic deployment via GitHub Actions
   # Or manual deployment:
   npm run deploy:staging
   npm run deploy:production
   ```

### Environment Promotion

```bash
# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke:staging

# Deploy to production
npm run deploy:production

# Monitor deployment
npm run monitor:production
```

## Troubleshooting

### Common Issues

#### 1. Worker Deployment Fails

**Problem:** `Error: Authentication failed`

**Solution:**
```bash
# Re-authenticate with Cloudflare
wrangler logout
wrangler login

# Verify authentication
wrangler whoami
```

#### 2. Database Connection Issues

**Problem:** `Error: D1 database not found`

**Solution:**
```bash
# List available databases
wrangler d1 list

# Update wrangler.toml with correct database ID
# Verify database binding in wrangler.toml
```

#### 3. KV Namespace Issues

**Problem:** `Error: KV namespace not found`

**Solution:**
```bash
# List KV namespaces
wrangler kv:namespace list

# Create missing namespace
wrangler kv:namespace create "STATE"

# Update wrangler.toml with correct namespace ID
```

#### 4. TypeScript Compilation Errors

**Problem:** Type errors during build

**Solution:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update types
npm install --save-dev @types/node

# Clear TypeScript cache
rm -rf node_modules/.cache
```

### Debugging Tools

#### 1. Local Development

```bash
# Run with debug logging
DEBUG=* npm run dev

# Use Wrangler dev with local database
wrangler dev --local

# Inspect database locally
wrangler d1 execute atlasit-local --local --command "SELECT * FROM tenants"
```

#### 2. Production Debugging

```bash
# View real-time logs
wrangler tail

# Filter logs by service
wrangler tail --filter "onboarding"

# View specific time range
wrangler tail --since "2024-01-01T00:00:00Z"
```

#### 3. Performance Monitoring

```bash
# Check worker metrics
wrangler metrics

# Monitor database performance
wrangler d1 insights atlasit-prod
```

### Error Handling Best Practices

```typescript
// Structured error handling
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export function handleError(error: unknown): Response {
  console.error('Error occurred:', error);
  
  if (error instanceof AppError) {
    return new Response(JSON.stringify({
      status: 'error',
      error: {
        code: error.code,
        message: error.message
      }
    }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Unknown error
  return new Response(JSON.stringify({
    status: 'error',
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for large dependencies
const heavyLibrary = await import('./heavy-library');

// Lazy loading components
const LazyComponent = React.lazy(() => import('./LazyComponent'));
```

### Caching Strategies

```typescript
// KV caching implementation
export class CacheService {
  constructor(private kv: KVNamespace) {}
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.kv.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl
    });
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Implementation for cache invalidation
  }
}
```

### Database Optimization

```sql
-- Use EXPLAIN QUERY PLAN to optimize queries
EXPLAIN QUERY PLAN SELECT * FROM tenants WHERE industry = 'healthcare';

-- Add appropriate indexes
CREATE INDEX idx_tenants_industry ON tenants(industry);

-- Use prepared statements for repeated queries
```

## Security Guidelines

### Input Validation

```typescript
// Always validate and sanitize input
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input);
};

const validateAndSanitize = (data: unknown) => {
  const schema = z.object({
    name: z.string().min(1).max(100).transform(sanitizeInput),
    email: z.string().email(),
    description: z.string().optional().transform(val => 
      val ? sanitizeInput(val) : val
    )
  });
  
  return schema.parse(data);
};
```

### Authentication & Authorization

```typescript
// JWT token validation
export async function validateToken(token: string): Promise<User | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return await getUserById(payload.userId);
  } catch (error) {
    return null;
  }
}

// Role-based access control
export function requireRole(role: string) {
  return (handler: Handler) => async (request: Request, env: Env) => {
    const user = await getCurrentUser(request);
    
    if (!user || !user.roles.includes(role)) {
      return new Response('Forbidden', { status: 403 });
    }
    
    return handler(request, env);
  };
}
```

## Contributing Guidelines

### Pull Request Process

1. **Before Starting:**
   - Check existing issues and PRs
   - Create issue for new features
   - Discuss approach with team

2. **Development:**
   - Create feature branch from main
   - Follow coding standards
   - Write tests for new functionality
   - Update documentation

3. **Submission:**
   - Ensure all tests pass
   - Update CHANGELOG.md
   - Create detailed PR description
   - Request review from team members

4. **Review Process:**
   - Address review feedback
   - Ensure CI/CD passes
   - Squash commits if needed
   - Merge after approval

### Code Review Checklist

- [ ] Code follows project standards
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Error handling implemented
- [ ] Logging added where appropriate

---

For additional help, refer to the [API Documentation](./api-documentation.md) and [Deployment Guide](./deployment-guide.md).
