# OIDC exchange worker (example)

This folder contains a small example Cloudflare Worker that demonstrates how a CI pipeline
could exchange a GitHub Actions OIDC id_token for a short-lived 1Password Connect token.

IMPORTANT: This is a template for deployments that support the exchange flow. Your
1Password Connect deployment and identity provider must support this exchange endpoint.

Files:

- `index.js` — example worker that accepts an `id_token` in the POST body and forwards it
  to the 1Password Connect exchange endpoint.
- `wrangler.toml.example` — sample configuration for local deployment.

Security notes:

- Never accept or log full id_tokens in public logs.
- Protect this worker by restricting access (IP allowlist, internal-only routing, or per-repo secrets).
- Perform thorough security review before enabling in production.

Usage:

1. Deploy the worker to a private endpoint.
2. Configure the worker's URL as `OP_CONNECT_OIDC_EXCHANGE_URL` in your repo secrets.
3. Call the worker from CI with a short-lived GitHub OIDC token to receive a short-lived
   1Password Connect token for that job.

Example (curl):

```bash
curl -sS -X POST "https://your-exchange-host.example.com/exchange" \
  -H 'Content-Type: application/json' \
  -d '{"id_token":"<GITHUB_OIDC_ID_TOKEN>"}'
```

This is intentionally minimal and requires deployment-specific adjustments.
