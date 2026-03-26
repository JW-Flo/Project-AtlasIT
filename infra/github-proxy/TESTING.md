# Testing the GitHub Proxy Worker

This document describes how to test the GitHub Proxy Worker locally and in production.

## Local Testing

### 1. Start Local Development Server

```bash
cd infra/github-proxy
npm install
wrangler dev
```

### 2. Set Environment Variables

Create a `.dev.vars` file (excluded from git):

```
PROXY_SECRET=test-secret-token
GH_PAT=ghp_your_github_pat_here
```

### 3. Test Health Endpoint

```bash
curl http://localhost:8787/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "atlasit-github-proxy",
  "traceId": "<uuid>"
}
```

### 4. Test Authentication

#### Invalid Token (should fail with 403)

```bash
curl -H "X-Proxy-Token: invalid" \
  "http://localhost:8787?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/README.md"
```

Expected response:

```json
{
  "error": "Forbidden",
  "message": "Invalid or missing X-Proxy-Token",
  "traceId": "<uuid>"
}
```

#### Valid Token (should succeed)

```bash
curl -H "X-Proxy-Token: test-secret-token" \
  "http://localhost:8787?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/README.md"
```

Expected: GitHub API response with file contents

### 5. Test Path Validation

#### Blocked Path (should fail with 403)

```bash
curl -H "X-Proxy-Token: test-secret-token" \
  "http://localhost:8787?path=/repos/someother/repo/contents/README.md"
```

Expected response:

```json
{
  "error": "Forbidden",
  "message": "Path not allowed. Only /repos/HarderWorkingCo/Project-AtlasIT/* endpoints are permitted",
  "traceId": "<uuid>"
}
```

#### Allowed Path (should succeed)

```bash
curl -H "X-Proxy-Token: test-secret-token" \
  "http://localhost:8787?path=/repos/HarderWorkingCo/Project-AtlasIT/git/trees/main"
```

Expected: GitHub API response with tree data

## Production Testing

### Deploy Worker

```bash
cd infra/github-proxy
wrangler secret put PROXY_SECRET
wrangler secret put GH_PAT
wrangler deploy
```

### Test Deployed Worker

```bash
# Set your production endpoint
PROXY_ENDPOINT="https://atlasit-github-proxy.<account>.workers.dev"
PROXY_TOKEN="your-production-token"

# Test health
curl "$PROXY_ENDPOINT/health"

# Test authenticated request
curl -H "X-Proxy-Token: $PROXY_TOKEN" \
  "$PROXY_ENDPOINT?path=/repos/HarderWorkingCo/Project-AtlasIT/contents/README.md"
```

## Helper Script Testing

### Setup

```bash
export PROXY_ENDPOINT="http://localhost:8787"  # or production URL
export PROXY_TOKEN="test-secret-token"
source scripts/codex-gh-helper.sh
```

### Test Functions

```bash
# Test connectivity
codex_test

# Pull file
codex_pull "README.md"

# Commit file (creates or updates)
codex_commit "Test commit" "test.txt" "Hello World"
```

## Acceptance Criteria Validation

✅ **Worker Security Controls:**

- Token authentication enforced
- Path allowlisting active
- Authorization header stripped
- Trace IDs generated

✅ **Codex Integration:**

- Helper script functions work
- Logs written to `ops/.codex_proxy.log`
- No direct GitHub access required

✅ **Error Handling:**

- Invalid tokens rejected with 403
- Unauthorized paths rejected with 403
- Missing parameters return 400
- GitHub errors proxied correctly

## Monitoring

View worker logs:

```bash
wrangler tail
```

View Codex proxy logs:

```bash
tail -f ops/.codex_proxy.log
```

## Troubleshooting

### Worker won't start

- Check `wrangler.toml` syntax
- Verify account_id is correct
- Run `npm install`

### 403 Forbidden

- Verify PROXY_SECRET matches PROXY_TOKEN
- Check path starts with `/repos/HarderWorkingCo/Project-AtlasIT`
- Ensure GH_PAT is valid

### 502 Bad Gateway

- Check GitHub API status
- Verify GH_PAT has correct permissions
- Check worker logs for detailed error

## Success Criteria

The worker is ready for production when:

1. Health endpoint returns 200
2. Authentication works correctly (403 for invalid tokens)
3. Path validation works (403 for unauthorized paths)
4. GitHub API requests proxy successfully
5. Trace IDs appear in logs
6. Helper script functions work
7. No secrets leaked in logs
