# DEPRECATED: Legacy AtlasIT Auth/IDP Service

> This express-based service is superseded by the shared package `@atlasit/auth` (in `packages/auth`). New authentication/session logic should be added there. This directory remains temporarily for historical reference and will be removed once all consumers migrate.

## Original AtlasIT Auth/IDP Service

The Auth/IDP service provides authentication, authorization, and identity management for AtlasIT.

## Features

- Built-in Identity Provider (IDP)
- External IDP integration (Okta, Auth0)
- OIDC/SAML/SCIM support
- Multi-tenant authentication
- Role-based access control (RBAC)
- Token management

## Technical Stack

- TypeScript/Node.js
- Express.js
- JWT authentication
- OAuth 2.0/OIDC
- Cloudflare Workers

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/auth/token` - Token generation
- `GET /api/auth/userinfo` - User information
- `POST /api/auth/logout` - User logout
- `GET /api/auth/config` - IDP configuration

## Next Steps

1. Implement core authentication flow
2. Add external IDP integration
3. Build RBAC system
4. Create token management
5. Add security monitoring
