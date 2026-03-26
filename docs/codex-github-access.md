# Codex GitHub Access via Proxy Worker

This document describes the AtlasIT GitHub Proxy Worker, which enables secure, controlled access from Codex automation environments to the Project-AtlasIT GitHub repository without requiring direct outbound network access.

## Overview

**Worker Name:** `atlasit-github-proxy`  
**Endpoint:** `https://atlasit-github-proxy.<account>.workers.dev`  
**Purpose:** Proxy authenticated requests from Codex agents to GitHub REST API  
**Security Model:** Token-based authentication with path allowlisting

---

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐         ┌─────────────────┐
│ Codex Agent     │────────>│ GitHub Proxy Worker  │────────>│ GitHub API      │
│ (No Direct      │  HTTPS  │ (Cloudflare Workers) │  HTTPS  │ api.github.com  │
│  Internet)      │<────────│                      │<────────│                 │
└─────────────────┘         └──────────────────────┘         └─────────────────┘
```

---

## Endpoint Structure

### Base URL
```
https://atlasit-github-proxy.<account>.workers.dev
```

### Query Parameters
- `path` (required): GitHub API path (must start with `/repos/HarderWorkingCo/Project-AtlasIT`)
- `raw` (optional): Set to `true` for raw content access
- `ref` (optional): Git reference (branch/tag/commit), default: `main`
- `file_path` (optional): File path for raw content requests

### Request Headers
- `X-Proxy-Token`: Authentication token (required)
- `Content-Type`: Request content type (for POST/PUT/PATCH)

### Response Headers
- `x-trace-id`: Unique trace ID for request tracking
- `x-service`: Service identifier (`atlasit-github-proxy`)

---

## Usage Examples

### Health Check

```bash
curl -H "X-Proxy-Token: $PROXY_TOKEN" \
  https://atlasit-github-proxy.<account>.workers.dev/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "atlasit-github-proxy",
  "traceId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get File Contents

```bash
curl -H "X-Proxy-Token: $PROXY_TOKEN" \
  "https://atlasit-github-proxy.workers.dev?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/README.md"
```

**Response:** Standard GitHub Contents API JSON response

### Create or Update File

```bash
curl -X PUT \
  -H "X-Proxy-Token: $PROXY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Update documentation",
    "content": "SGVsbG8gV29ybGQh",
    "branch": "main"
  }' \
  "https://atlasit-github-proxy.workers.dev?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/docs/example.md"
```

### List Repository Contents

```bash
curl -H "X-Proxy-Token: $PROXY_TOKEN" \
  "https://atlasit-github-proxy.workers.dev?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/docs"
```

---

## Helper Script Integration

The repository includes a Bash helper script at `scripts/codex-gh-helper.sh` that wraps proxy calls for common operations.

### Setup

```bash
# Set environment variables
export PROXY_ENDPOINT="https://atlasit-github-proxy.workers.dev"
export PROXY_TOKEN="your-proxy-token-here"

# Source the helper script
source scripts/codex-gh-helper.sh
```

### Available Functions

#### `codex_test`
Test proxy connectivity and authentication.

```bash
codex_test
```

#### `codex_pull <file_path> [ref]`
Retrieve file contents from the repository.

```bash
codex_pull "docs/README.md"
codex_pull "docs/README.md" "develop"
```

#### `codex_commit <message> <file_path> <content> [branch]`
Create or update a file in the repository.

```bash
codex_commit "Update docs" "docs/example.md" "New content here"
```

#### `codex_push`
Placeholder for future git push proxy support.

---

## Security Controls

### Token Validation

The worker validates every request using the `X-Proxy-Token` header against the `PROXY_SECRET` environment variable. Requests without a valid token receive an HTTP 403 response.

**Implementation:**
```typescript
const token = request.headers.get('X-Proxy-Token');
if (!token || token !== env.PROXY_SECRET) {
  return json({ error: 'Forbidden', message: 'Invalid or missing X-Proxy-Token' }, 403);
}
```

### Path Allowlisting

Only requests targeting the AtlasIT repository are permitted. All paths must start with:
```
/repos/HarderWorkingCo/Project-AtlasIT
```

Any other path returns HTTP 403.

**Implementation:**
```typescript
if (!targetPath.startsWith('/repos/HarderWorkingCo/Project-AtlasIT')) {
  return json({ error: 'Forbidden', message: 'Path not allowed' }, 403);
}
```

### Authorization Header Stripping

The worker strips the `Authorization` header from incoming requests and replaces it with the GitHub PAT stored in `env.GH_PAT`. This prevents credential leakage from Codex environments.

### Trace ID Logging

Every request generates a unique trace ID (UUID v4) that is:
- Included in all response headers (`x-trace-id`)
- Logged to console for debugging
- Written to `ops/.codex_proxy.log` by the helper script

**Log Format:**
```json
{
  "timestamp": "2025-11-06T01:00:00Z",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "codex_pull",
  "status": "success",
  "details": "path=docs/README.md,ref=main"
}
```

### No Request Body Logging

The worker does not log request or response bodies to prevent sensitive data exposure in logs.

---

## Token Management

### Secrets Configuration

The worker requires two secrets:

1. **`PROXY_SECRET`**: Authentication token for Codex agents
   - Set via: `wrangler secret put PROXY_SECRET`
   - Also configured in GitHub Environment for CI/CD

2. **`GH_PAT`**: GitHub Personal Access Token
   - Permissions: `repo` (full repository access)
   - Set via: `wrangler secret put GH_PAT`
   - Also configured in GitHub Environment for CI/CD

### Token TTLs and Rotation

Token metadata and expiration tracking is documented in:
```
VAULT/TOKENS/CLOUDFLARE_API_TOKEN_METADATA.md
```

**Recommended Rotation Schedule:**
- `PROXY_SECRET`: 90 days
- `GH_PAT`: 90 days or as per GitHub organization policy

---

## Deployment

### Prerequisites
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare account credentials configured
- GitHub PAT with repository access

### Deploy Steps

1. Navigate to worker directory:
   ```bash
   cd infra/github-proxy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set secrets:
   ```bash
   wrangler secret put PROXY_SECRET
   wrangler secret put GH_PAT
   ```

4. Deploy worker:
   ```bash
   wrangler deploy
   ```

5. Verify deployment:
   ```bash
   curl https://atlasit-github-proxy.<account>.workers.dev/health
   ```

---

## Monitoring and Observability

### Request Tracing

Every request includes a trace ID for correlation across systems:

```
x-trace-id: 550e8400-e29b-41d4-a716-446655440000
```

### Logs

Worker logs are available via:
- Cloudflare Dashboard: Workers > atlasit-github-proxy > Logs
- Wrangler CLI: `wrangler tail`

Local Codex proxy logs:
```bash
tail -f ops/.codex_proxy.log
```

### Health Monitoring

Health check endpoint for uptime monitoring:
```
GET /health
```

Expected response:
```json
{
  "status": "ok",
  "service": "atlasit-github-proxy",
  "traceId": "<uuid>"
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Missing required query parameter: path",
  "traceId": "<uuid>"
}
```

#### 403 Forbidden (Invalid Token)
```json
{
  "error": "Forbidden",
  "message": "Invalid or missing X-Proxy-Token",
  "traceId": "<uuid>"
}
```

#### 403 Forbidden (Path Not Allowed)
```json
{
  "error": "Forbidden",
  "message": "Path not allowed. Only /repos/HarderWorkingCo/Project-AtlasIT/* endpoints are permitted",
  "traceId": "<uuid>"
}
```

#### 502 Bad Gateway
```json
{
  "error": "Bad Gateway",
  "message": "Failed to communicate with GitHub API",
  "traceId": "<uuid>"
}
```

---

## Compliance Mapping

This integration supports the following compliance controls:

- **NIST 800-53 AC-3**: Access Enforcement (path allowlisting)
- **NIST 800-53 AC-6**: Least Privilege (token-based authentication)
- **NIST 800-53 AU-2**: Audit Events (trace ID logging)
- **NIST 800-53 SC-8**: Transmission Confidentiality (HTTPS only)
- **SOC2 CC6.1**: Logical Access Controls (token validation)
- **ISO27001 A.9.4.1**: Information Access Restriction (repository-scoped access)

Evidence artifacts are logged to:
```
ops/.codex_proxy.log
```

---

## Limitations and Constraints

1. **Repository Scope**: Only `/repos/HarderWorkingCo/Project-AtlasIT/*` paths are allowed
2. **API Coverage**: Supports GitHub REST API v3 endpoints only
3. **Rate Limits**: Subject to GitHub API rate limits (5,000 requests/hour for authenticated requests)
4. **Request Size**: Cloudflare Workers limit of 100MB per request
5. **Authentication**: Single shared token (no per-agent tokens currently)

---

## Troubleshooting

### Connection Refused
- Verify `PROXY_ENDPOINT` environment variable is set correctly
- Check worker deployment status: `wrangler deployments list`

### 403 Forbidden
- Verify `PROXY_TOKEN` matches the deployed `PROXY_SECRET`
- Check token has not expired
- Ensure request path starts with `/repos/HarderWorkingCo/Project-AtlasIT`

### 502 Bad Gateway
- Check GitHub API status: https://www.githubstatus.com/
- Verify `GH_PAT` secret is set and valid
- Check worker logs: `wrangler tail`

### Empty Response
- Check GitHub API endpoint exists and is valid
- Verify file path exists in repository
- Review trace ID in logs for detailed error information

---

## Future Enhancements

- **Per-Agent Tokens**: Individual authentication tokens for Codex agents
- **Rate Limiting**: Built-in rate limiting at the proxy level
- **Caching**: Response caching for frequently accessed resources
- **Metrics**: Prometheus-compatible metrics endpoint
- **Git Push Proxy**: Support for full git push operations
- **Webhook Forwarding**: Proxy GitHub webhooks to Codex environments

---

## References

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [VAULT/TOKENS/CLOUDFLARE_API_TOKEN_METADATA.md](../VAULT/TOKENS/CLOUDFLARE_API_TOKEN_METADATA.md)
- [AtlasIT Security Documentation](./security/token-inventory.md)

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-06  
**Owner:** Platform Engineering  
**Control ID:** CX-006
