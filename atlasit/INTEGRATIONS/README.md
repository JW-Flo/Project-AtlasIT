# AtlasIT Integrations

External system connectors and adapters.

## Available Integrations

### Identity Providers

- **Okta**: Enterprise SSO and directory (mock for PR0)
- **Google Workspace**: G Suite directory and provisioning (planned)
- **Microsoft Entra ID**: Azure AD integration (planned)

### SaaS Applications

- **Ramp**: Corporate card and expense management (planned)
- **Slack**: Team communication (planned)
- **GitHub**: Code repository and access control (planned)

### HR Systems

- **BambooHR**: HR and employee data (planned)
- **Rippling**: HR, IT, and payroll platform (planned)

## Integration Architecture

All integrations follow a common adapter pattern:

```typescript
interface Adapter {
  name: string;
  version: string;

  // User lifecycle
  createUser(params: CreateUserParams): Promise<AdapterResult>;
  updateUser(params: UpdateUserParams): Promise<AdapterResult>;
  deleteUser(params: DeleteUserParams): Promise<AdapterResult>;

  // Group management
  addToGroup(params: AddToGroupParams): Promise<AdapterResult>;
  removeFromGroup(params: RemoveFromGroupParams): Promise<AdapterResult>;

  // Health check
  healthCheck(): Promise<HealthStatus>;
}
```

## Adapter Guidelines

1. **Idempotent Operations**: Safe to retry without side effects
2. **Evidence Generation**: Emit evidence for all mutations
3. **Error Handling**: Clear error messages, retryable vs. non-retryable
4. **Mock Mode**: Support testing without real credentials
5. **Rate Limiting**: Respect API limits, implement backoff

## Adding a New Integration

1. Create adapter interface in `/src/adapters/[name]`
2. Implement core methods
3. Add mock implementation for testing
4. Create integration tests
5. Document configuration requirements
6. Add to CI/CD pipeline
7. Update this README

## Configuration

Adapters are configured via:

- **Environment variables**: API endpoints, client IDs
- **Secrets**: API keys, OAuth tokens (from Vault)
- **Tenant settings**: Per-tenant adapter config (in D1)

## Security

- **No static secrets**: Use Vault or OIDC for credentials
- **Least privilege**: Request minimum required scopes
- **Audit trail**: Log all API calls with evidence
- **Token rotation**: Refresh tokens regularly

## Testing

Each adapter includes:

- **Unit tests**: Core logic with mocks
- **Integration tests**: Real API calls (optional, requires credentials)
- **Smoke tests**: Basic connectivity and health checks

Run tests:

```bash
npm test -- tests/adapters/[name]
```

## Contributing

See [Development Guide](../../docs/developer-guide.md) for adapter contribution guidelines.
