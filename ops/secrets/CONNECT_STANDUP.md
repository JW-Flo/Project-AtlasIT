# 1Password Connect standup

This document describes a minimal standup for 1Password Connect (Dev/QA). It includes a Docker Compose example and notes about configuring GitHub OIDC trust and an exchange endpoint.

Prereqs

- A 1Password business account with Admin access to create Connect tokens and configure the Connect app.
- A server or VM to run the Connect container(s) (dev/qa can use a small VM or container host).

Docker Compose example (minimal)

```yaml
version: "3.7"
services:
  connect:
    image: 1password/connect:latest
    restart: unless-stopped
    environment:
      OP_CONNECT_TOKEN: "<token-from-1password>"
      OP_CONNECT_HOSTNAME: "0.0.0.0"
    ports:
      - "8080:8080"
    volumes:
      - ./data:/var/lib/connect
```

Notes

- Replace `<token-from-1password>` with the Connect server token generated in the 1Password Admin console.
- Secure the host and restrict network access (bind to internal interface or use a VPN).

Token details for this deployment

- The Connect server for Atlas IT uses a token stored as `op_atlas_it_connect_server_pat` in GitHub Secrets and as an env secret on the Connect host.
- Expiration: 2026-02-15 23:59:59 UTC. Ensure you plan rotation ahead of this date.

Configuring GitHub OIDC trust (summary)

- In GitHub, configure Actions OIDC and set audience/claims as needed. This allows a job to request an id-token with `permissions: id-token: write`.
- On the Connect side, implement an exchange endpoint that validates the incoming OIDC token (iss/aud/exp) and returns a short-lived Connect token scoped to the required vaults.

Exchange endpoint guidance

- The exchange endpoint should:
  - Validate OIDC token signature and claims
  - Check the token audience (aud) matches your expected value
  - Map GitHub repo / workflow claims to allowed vault scopes
  - Issue a short-lived Connect token and return it to the caller

Security

- Restrict the exchange endpoint to only accept requests from GitHub IPs or authenticate via mTLS if possible.
- Audit all token exchanges and monitor for anomalous behavior.

\*\*\* End of doc
