# Linear Integration Adapter

This adapter enables data synchronization between Linear and AtlasIT through webhook handling and API integration.

## Features

- **Webhook Handler**: Receives and processes Linear webhook events for real-time sync
- **Data Sync**: Manual and automatic synchronization of issues, comments, and labels
- **Issue Tracking**: Query and manage synchronized issues from Linear

## Setup

### 1. Enable the Feature Flag

Set the environment variable to enable this adapter:

```bash
FEATURE_CONNECTOR_LINEAR=1
```

### 2. Configure Linear Webhook

In your Linear workspace settings:

1. Go to Settings → API → Webhooks
2. Create a new webhook
3. Set the URL to: `https://your-atlasit-domain.com/adapters/linear/webhook`
4. Select the events you want to sync (Issue, Comment, Label)
5. Copy the webhook secret

### 3. Set Environment Variables

```bash
# Linear API Key for outbound sync (optional)
LINEAR_API_KEY=your_linear_api_key

# Webhook secret for verifying incoming webhooks (recommended)
LINEAR_WEBHOOK_SECRET=your_webhook_secret
```

## API Endpoints

### POST /webhook

Receives webhook events from Linear.

**Headers:**

- `linear-signature`: HMAC signature for webhook verification

**Request Body:**

```json
{
  "action": "create",
  "type": "Issue",
  "data": {
    "id": "issue-123",
    "title": "Example issue",
    "description": "Issue description",
    "state": {
      "name": "In Progress"
    }
  },
  "createdAt": "2025-11-05T08:13:39.333Z"
}
```

### POST /sync

Manually trigger data synchronization.

**Request Body:**

```json
{
  "direction": "linear-to-atlas",
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

List synchronized issues from Linear.

**Response:**

```json
{
  "issues": [
    {
      "id": "issue-123",
      "title": "Example issue",
      "description": "Issue description",
      "state": { "name": "In Progress" },
      "createdAt": "2025-11-05T08:13:39.333Z",
      "updatedAt": "2025-11-05T08:13:39.333Z",
      "syncedAt": "2025-11-05T08:14:00.000Z"
    }
  ],
  "count": 1
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

## Data Storage

The adapter uses Cloudflare KV for storing synchronized data:

- **Issues**: `linear:issue:{issueId}`
- **Comments**: `linear:comment:{commentId}`
- **Labels**: `linear:label:{labelId}`
- **Webhook Events**: `linear:webhook:{type}:{id}:{timestamp}` (7-day TTL)

## Sync Directions

- `linear-to-atlas`: Import data from Linear to AtlasIT (default)
- `atlas-to-linear`: Export data from AtlasIT to Linear (requires Linear API key)
- `bidirectional`: Two-way sync (requires Linear API key)

## Security

- Webhook signatures are verified using HMAC-SHA256 (when `LINEAR_WEBHOOK_SECRET` is set)
- API keys are stored as environment secrets
- All webhook events are logged for audit purposes

## Migration Guide

To import existing data from Linear:

1. Enable the adapter with `FEATURE_CONNECTOR_LINEAR=1`
2. Configure your Linear API key
3. Trigger a manual sync:
   ```bash
   curl -X POST https://your-atlasit-domain.com/adapters/linear/sync \
     -H "Content-Type: application/json" \
     -d '{"direction": "linear-to-atlas", "entityTypes": ["issues", "comments", "labels"]}'
   ```

## Troubleshooting

### Webhook not receiving events

1. Verify the webhook URL is correct in Linear settings
2. Check that `FEATURE_CONNECTOR_LINEAR=1` is set
3. Ensure the adapter is deployed and healthy (check `/health`)

### Signature verification fails

1. Verify `LINEAR_WEBHOOK_SECRET` matches the secret in Linear
2. Check webhook logs for signature mismatch errors

### Issues not syncing

1. Check KV binding is configured (`KV_CACHE`)
2. Verify webhook events are being received (check logs)
3. Ensure sufficient KV storage quota

## Development

```bash
# Type check
npm run typecheck

# Build
npm run build
```

## References

- [Linear API Documentation](https://developers.linear.app/)
- [Linear Webhook Guide](https://developers.linear.app/docs/graphql/webhooks)
- [AtlasIT Connectors Documentation](../../docs/CONNECTORS.md)
