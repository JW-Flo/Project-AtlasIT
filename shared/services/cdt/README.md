## Compliance Digital Twin (CDT) Service

Key security features:

- HMAC request authentication (`X-Atlas-Signature` header)
- Optional mTLS client certificate allowlist (API Shield)
- Idempotent event ingestion via `Idempotency-Key`
- Optimistic concurrency with versioned control state
- Evidence hashing + deterministic R2 path partitioned by date

### mTLS (Client Certificate) Setup

1. In Cloudflare Dashboard, enable API Shield mTLS and generate a client certificate.
2. Provide the cert + private key only to the calling client (never commit or store in KV/R2).
3. Compute SHA-256 DER fingerprint (base64):

   ```bash
   openssl x509 -in client.pem -outform DER | \
     openssl sha256 -binary | openssl base64 -A
   ```

4. Set Wrangler var `ALLOWED_CLIENT_CERT_FPS` with fingerprint(s), comma-separated.
5. Deploy. Worker compares incoming `cf-client-cert` header fingerprint to allowlist.

### Event Ingestion

POST /twin/event with JSON body (CdtEvent). Provide:

- `Idempotency-Key` (optional) for 24h dedupe
- `X-Atlas-Signature` HMAC over raw body (hex SHA-256 of body with shared secret)

### Remediation

POST /twin/remediate/{control_id} enqueues remediation job.

### Testing mTLS Locally

`wrangler dev` does not terminate TLS; mTLS enforcement only triggers if `ALLOWED_CLIENT_CERT_FPS` is set AND you inject a `cf-client-cert` header (simulation). Real validation requires Cloudflare edge.
