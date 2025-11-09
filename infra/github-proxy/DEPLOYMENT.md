# GitHub Proxy Worker - Deployment Guide

## Prerequisites

Before deploying the GitHub Proxy Worker, ensure you have:

1. **Wrangler CLI** installed globally or in the project:

   ```bash
   npm install -g wrangler
   # or use the local version
   npx wrangler --version
   ```

2. **Cloudflare Account** with Workers enabled
   - Account ID: `620865722bd88ef0a77dbbb60c91392e` (configured in wrangler.toml)
   - **Note**: If deploying to a different account, update the `account_id` in `wrangler.toml`

3. **GitHub Personal Access Token (PAT)** with `repo` scope
   - Create at: https://github.com/settings/tokens
   - Required permissions: Full control of private repositories

4. **Proxy Secret Token** (generate a secure random string)
   ```bash
   # Generate a secure token (example)
   openssl rand -base64 32
   ```

## Deployment Steps

### 1. Navigate to Worker Directory

```bash
cd infra/github-proxy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Secrets

Set the required secrets in Cloudflare:

```bash
# Set proxy authentication token
wrangler secret put PROXY_SECRET
# Enter your secure token when prompted

# Set GitHub Personal Access Token
wrangler secret put GH_PAT
# Enter your GitHub PAT when prompted
```

**Important**: Store these secret values in a secure location (e.g., password manager) as they cannot be retrieved from Cloudflare after being set.

### 4. Validate Configuration

Review `wrangler.toml` to ensure the configuration is correct:

```bash
cat wrangler.toml
```

Verify:

- `account_id` matches your Cloudflare account
- `name` is set to `atlasit-github-proxy`
- `compatibility_date` is current

### 5. Deploy Worker

```bash
wrangler deploy
```

Expected output:

```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded atlasit-github-proxy (X.XX sec)
Published atlasit-github-proxy (X.XX sec)
  https://atlasit-github-proxy.<account>.workers.dev
Current Deployment ID: <deployment-id>
```

### 6. Verify Deployment

Test the health endpoint:

```bash
curl https://atlasit-github-proxy.<account>.workers.dev/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "atlasit-github-proxy",
  "traceId": "<uuid>"
}
```

### 7. Test Authentication

Test with invalid token (should return 403):

```bash
curl -H "X-Proxy-Token: invalid" \
  "https://atlasit-github-proxy.<account>.workers.dev?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/README.md"
```

Test with valid token (should return GitHub data):

```bash
curl -H "X-Proxy-Token: YOUR_PROXY_SECRET" \
  "https://atlasit-github-proxy.<account>.workers.dev?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/README.md"
```

## Post-Deployment Configuration

### Configure Codex Environment

On Codex agent machines or environments:

```bash
# Set environment variables
export PROXY_ENDPOINT="https://atlasit-github-proxy.<account>.workers.dev"
export PROXY_TOKEN="YOUR_PROXY_SECRET"

# Source helper script
source /path/to/scripts/codex-gh-helper.sh

# Test connectivity
codex_test
```

### Update GitHub Environment Secrets

If using GitHub Actions for CI/CD, add these secrets:

1. Go to: https://github.com/HarderWorkingCo/Project-AtlasIT/settings/secrets/actions
2. Add secrets:
   - `PROXY_ENDPOINT`: `https://atlasit-github-proxy.<account>.workers.dev`
   - `PROXY_TOKEN`: Your proxy secret value

## Monitoring

### View Worker Logs

Real-time logs:

```bash
wrangler tail
```

View logs in Cloudflare Dashboard:

- Navigate to: Workers & Pages > atlasit-github-proxy > Logs

### Check Deployment Status

```bash
wrangler deployments list
```

### View Worker Metrics

```bash
wrangler metrics
```

Or view in Cloudflare Dashboard:

- Navigate to: Workers & Pages > atlasit-github-proxy > Metrics

## Updating the Worker

### Update Code

1. Make changes to `src/index.ts` or `index.js`
2. Test locally:
   ```bash
   wrangler dev
   ```
3. Deploy update:
   ```bash
   wrangler deploy
   ```

### Update Secrets

To rotate secrets:

```bash
# Update proxy token
wrangler secret put PROXY_SECRET

# Update GitHub PAT
wrangler secret put GH_PAT
```

**Note**: After rotating secrets, update all Codex environments with the new values.

## Rollback

If you need to rollback to a previous deployment:

```bash
# List deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback <deployment-id>
```

## Troubleshooting

### Deployment Fails

**Error**: `Authentication error`

- Solution: Run `wrangler login` to authenticate

**Error**: `Account ID not found`

- Solution: Verify `account_id` in `wrangler.toml` matches your Cloudflare account

### Worker Returns 500

- Check worker logs: `wrangler tail`
- Verify secrets are set: Secrets cannot be viewed, but you can reset them
- Ensure GitHub PAT is valid and has correct permissions

### 403 Forbidden from GitHub

- Verify `GH_PAT` secret is set correctly
- Check GitHub PAT permissions (requires `repo` scope)
- Verify PAT hasn't expired (check https://github.com/settings/tokens)

### Codex Cannot Connect

- Verify `PROXY_ENDPOINT` is correct
- Test health endpoint directly in browser
- Check Cloudflare Workers status: https://www.cloudflarestatus.com/

## Security Considerations

1. **Rotate Secrets Regularly**
   - Recommended schedule: Every 90 days
   - Update both `PROXY_SECRET` and `GH_PAT`

2. **Monitor Access Logs**
   - Review worker logs regularly for unauthorized access attempts
   - Check for unusual patterns in trace IDs

3. **Limit GitHub PAT Scope**
   - Use a machine account with minimal required permissions
   - Only grant `repo` scope, no admin or delete permissions

4. **Network Security**
   - Worker is HTTPS-only (enforced by Cloudflare)
   - No plaintext traffic possible

## Compliance Documentation

Document deployment in compliance logs:

1. **Trace IDs**: All requests generate unique trace IDs for audit trail
2. **Evidence Logs**: Codex operations logged to `ops/.codex_proxy.log`
3. **Token Metadata**: Document token expiration in `VAULT/TOKENS/` (if directory exists)

## Support

For issues or questions:

- Review logs: `wrangler tail`
- Check documentation: `docs/codex-github-access.md`
- Test guide: `TESTING.md`
- GitHub API status: https://www.githubstatus.com/
- Cloudflare status: https://www.cloudflarestatus.com/

## References

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Project Documentation](../../docs/codex-github-access.md)
