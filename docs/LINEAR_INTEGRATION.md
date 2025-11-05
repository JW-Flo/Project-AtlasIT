# Linear Integration Guide

This guide explains how to set up and use the Linear integration adapter for AtlasIT to sync data between Linear and your AtlasIT instance.

## Overview

The Linear integration adapter enables:

- **Real-time webhook synchronization** of issues, comments, and labels from Linear
- **Manual data sync** for importing existing data
- **Issue tracking** with full metadata (state, assignee, labels, priority)
- **Audit trail** of all webhook events

## Architecture

```
Linear Workspace
      │
      │ (webhooks)
      ▼
┌──────────────────┐
│ Linear Adapter   │
│ /adapters/linear │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Cloudflare KV   │
│  (Data Storage)  │
└──────────────────┘
```

## Quick Start

### 1. Enable the Linear Adapter

Set the feature flag in your environment:

```bash
export FEATURE_CONNECTOR_LINEAR=1
```

Or add to your `.env` file:

```
FEATURE_CONNECTOR_LINEAR=1
```

### 2. Configure Linear Webhook

In your Linear workspace:

1. Go to **Settings** → **API** → **Webhooks**
2. Click **Create new webhook**
3. Configure:
   - **URL**: `https://your-atlasit-domain.workers.dev/adapters/linear/webhook`
   - **Events**: Select `Issue`, `Comment`, `Label` (as needed)
   - **Secret**: Generate a secure random string
4. Copy the webhook secret

### 3. Set Environment Variables

```bash
# Required for webhook signature verification
export LINEAR_WEBHOOK_SECRET="your-webhook-secret-from-linear"

# Optional: for outbound sync (Linear → AtlasIT → other systems)
export LINEAR_API_KEY="your-linear-api-key"
```

Add these to your Cloudflare Worker secrets:

```bash
wrangler secret put LINEAR_WEBHOOK_SECRET
wrangler secret put LINEAR_API_KEY
```

### 4. Deploy and Test

Deploy your worker:

```bash
wrangler deploy
```

Test the health endpoint:

```bash
curl https://your-atlasit-domain.workers.dev/adapters/linear/health
```

Expected response:

```json
{
  "status": "ok",
  "name": "linear",
  "version": "1.0.0",
  "endpoints": ["/webhook", "/sync", "/issues"],
  "features": {
    "webhookHandling": true,
    "dataSync": true,
    "issueTracking": true
  }
}
```

## Usage

### Receiving Webhooks

Once configured, the adapter automatically receives and processes webhook events from Linear:

- **Issue created**: Stores the issue in KV
- **Issue updated**: Updates the stored issue
- **Issue removed**: Deletes the issue from KV
- **Comment created/updated/removed**: Manages comment data
- **Label created/updated/removed**: Manages label data

All webhook events are logged and stored with a 7-day TTL for audit purposes.

### Manual Data Sync

To import existing data from Linear:

```bash
curl -X POST https://your-atlasit-domain.workers.dev/adapters/linear/sync \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "linear-to-atlas",
    "entityTypes": ["issues", "comments", "labels"]
  }'
```

**Parameters:**

- `direction`: `linear-to-atlas` | `atlas-to-linear` | `bidirectional`
- `entityTypes`: Array of `["issues", "comments", "labels"]`

### Querying Synchronized Issues

Retrieve all synchronized issues:

```bash
curl https://your-atlasit-domain.workers.dev/adapters/linear/issues
```

Response:

```json
{
  "issues": [
    {
      "id": "HAR-4",
      "title": "Import your data (4)",
      "description": "Sync data between Linear and your other tools...",
      "state": {
        "id": "state-123",
        "name": "In Progress",
        "type": "started"
      },
      "assignee": {
        "id": "user-123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "labels": [
        {
          "id": "label-123",
          "name": "integration",
          "color": "#3b82f6"
        }
      ],
      "priority": 2,
      "estimate": 5,
      "createdAt": "2025-11-05T08:13:39.333Z",
      "updatedAt": "2025-11-05T08:14:00.000Z",
      "syncedAt": "2025-11-05T08:14:30.000Z"
    }
  ],
  "count": 1
}
```

## Data Storage

The adapter uses Cloudflare KV for storage:

| Key Pattern                              | Purpose                | TTL       |
| ---------------------------------------- | ---------------------- | --------- |
| `linear:issue:{issueId}`                 | Issue data             | Permanent |
| `linear:comment:{commentId}`             | Comment data           | Permanent |
| `linear:label:{labelId}`                 | Label data             | Permanent |
| `linear:webhook:{type}:{id}:{timestamp}` | Webhook events (audit) | 7 days    |

## Security

### Webhook Signature Verification

When `LINEAR_WEBHOOK_SECRET` is configured, the adapter verifies webhook signatures using HMAC-SHA256:

1. Linear includes a `linear-signature` header with each webhook
2. The adapter validates the signature against the payload
3. Invalid signatures are rejected with HTTP 401

### API Key Protection

- API keys are stored as Cloudflare Worker secrets (not in code)
- Keys are never logged or exposed in responses
- Use separate keys for development and production

### Best Practices

- Rotate `LINEAR_WEBHOOK_SECRET` periodically
- Use HTTPS for all webhook URLs
- Monitor webhook delivery failures in Linear dashboard
- Review audit logs regularly

## Troubleshooting

### Webhook Events Not Received

1. **Check webhook configuration in Linear**
   - Verify the URL is correct
   - Check webhook status is "Active"
   - Review delivery logs for errors

2. **Verify adapter is deployed**

   ```bash
   curl https://your-atlasit-domain.workers.dev/adapters/linear/health
   ```

3. **Check feature flag**
   - Ensure `FEATURE_CONNECTOR_LINEAR=1` is set

4. **Review logs**
   ```bash
   wrangler tail
   ```

### Signature Verification Fails

1. **Verify webhook secret matches**
   - Linear webhook secret must match `LINEAR_WEBHOOK_SECRET`

2. **Check secret is set correctly**

   ```bash
   wrangler secret list
   ```

3. **Temporarily disable verification**
   - Unset `LINEAR_WEBHOOK_SECRET` for testing
   - **Warning**: Only for debugging, not for production

### Issues Not Syncing

1. **Check KV binding**
   - Verify `KV_CACHE` binding is configured in `wrangler.toml`

2. **Verify KV storage quota**
   - Check Cloudflare dashboard for quota limits

3. **Review webhook payload**
   - Check logs for webhook event structure
   - Ensure payload matches expected format

### Performance Issues

1. **Monitor KV operations**
   - Use Cloudflare Analytics to track KV read/write latency

2. **Consider batch processing**
   - For large imports, use pagination in sync requests

3. **Optimize data structure**
   - Store only essential fields
   - Use TTL for temporary data

## Migration Guide

### Importing Existing Linear Data

To migrate your existing Linear data to AtlasIT:

1. **Enable the adapter** (see Quick Start)

2. **Trigger initial sync**

   ```bash
   curl -X POST https://your-atlasit-domain.workers.dev/adapters/linear/sync \
     -H "Content-Type: application/json" \
     -d '{
       "direction": "linear-to-atlas",
       "entityTypes": ["issues", "comments", "labels"]
     }'
   ```

3. **Verify data**

   ```bash
   curl https://your-atlasit-domain.workers.dev/adapters/linear/issues | jq '.count'
   ```

4. **Enable webhook** for real-time sync going forward

### Exporting to Other Systems

Once data is in AtlasIT, you can:

- Export to other project management tools
- Generate reports and analytics
- Integrate with CI/CD pipelines
- Trigger automation workflows

## Advanced Configuration

### Custom Event Handling

Extend the adapter to handle custom events:

```typescript
// adapters/linear/routes.ts

private async processCustomEvent(action: string, data: Record<string, unknown>): Promise<void> {
  // Your custom logic here
}
```

### Bidirectional Sync

To enable two-way sync between Linear and AtlasIT:

1. Set up Linear API key for outbound writes
2. Configure sync direction to `bidirectional`
3. Handle conflict resolution for concurrent updates

### Integration with Other Adapters

Connect Linear data with other adapters:

```bash
# Sync Linear issues to HR system
curl -X POST .../adapters/example-hr-suite/import \
  -d '{"source": "linear", "filter": {"label": "hr-related"}}'
```

## API Reference

### POST /webhook

Receives Linear webhook events.

**Headers:**

- `linear-signature`: HMAC-SHA256 signature (required if secret configured)
- `content-type`: application/json

**Request Body:**

```json
{
  "action": "create|update|remove",
  "type": "Issue|Comment|Label",
  "data": {
    /* entity data */
  },
  "createdAt": "2025-11-05T08:13:39.333Z",
  "organizationId": "org-123",
  "webhookId": "webhook-123"
}
```

**Responses:**

- `200`: Webhook processed successfully
- `401`: Missing or invalid signature
- `400`: Invalid payload
- `500`: Server error

### POST /sync

Manually trigger data synchronization.

**Request Body:**

```json
{
  "direction": "linear-to-atlas|atlas-to-linear|bidirectional",
  "entityTypes": ["issues", "comments", "labels"]
}
```

**Response:**

```json
{
  "status": "ok",
  "sync": {
    "direction": "linear-to-atlas",
    "entityTypes": ["issues"],
    "initiated": true,
    "timestamp": "2025-11-05T08:13:39.333Z"
  }
}
```

### GET /issues

List synchronized issues.

**Response:**

```json
{
  "issues": [
    /* array of issue objects */
  ],
  "count": 42
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "name": "linear",
  "version": "1.0.0",
  "endpoints": ["/webhook", "/sync", "/issues"],
  "features": {
    "webhookHandling": true,
    "dataSync": true,
    "issueTracking": true
  }
}
```

## Resources

- [Linear API Documentation](https://developers.linear.app/)
- [Linear Webhook Guide](https://developers.linear.app/docs/graphql/webhooks)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [AtlasIT Connectors Overview](./CONNECTORS.md)

## Support

For issues or questions:

1. Check this documentation
2. Review [GitHub Issues](https://github.com/HarderWorkingCo/Project-AtlasIT/issues)
3. Contact the AtlasIT team via Linear (use `?` in bottom left → Contact us)
