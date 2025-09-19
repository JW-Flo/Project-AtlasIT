# Identity Provider Layer (Phase 3b)

AtlasIT routes identity lifecycle actions through a pluggable IdP interface. Each adapter implements a common contract and can be toggled via environment feature flags for safe rollout.

## Feature Flags

| Adapter                                                       | Flag               |
| ------------------------------------------------------------- | ------------------ |
| Okta Mock                                                     | `FEATURE_IDP_OKTA` |
| Dev OIDC Issuer (future)                                      | `DEV_OIDC`         |
| Additional adapters (Entra, Google, AWS, Paycom, CrowdStrike) | Coming soon        |

Flags are disabled by default. Set the flag to `1`/`true` to enable the adapter within workers or API routes.

## Package Overview

- `@atlasit/idp`: core types (`IdpUser`, `IdpGroup`, etc.) and adapter registry utilities (`registerAdapter`, `listAdapters`).
- `@atlasit/idp-okta`: deterministic Okta mock adapter backed by fixtures.
- `@atlasit/idp-sim`: CLI simulator (`atlasit-idp-sim`) that provisions a fixture user via the adapter and emits JUnit output.
- API Routes:
  - `GET /api/idp/list` → lists enabled adapters.
  - `POST /api/idp/provision` → provisions a user via the enabled primary adapter.

## Usage

```bash
# Enable the Okta adapter and list adapters
FEATURE_IDP_OKTA=1 node -e "import('./routes/api/idp/list/+server.ts').then(m => m.GET({ env: { FEATURE_IDP_OKTA: '1' } }).then(res => res.text()).then(console.log))"

# Simulator
node packages/idp-sim/dist/cli.js
cat artifacts/idp/junit.xml
```

## Roadmap

- Entra, Google Workspace, and AWS Cognito adapters stubbed for parity with AtlasIT research fixtures.
- Paycom payroll ingest and CrowdStrike device posture adapters.
- Dev-only OIDC issuer to support end-to-end login flows.
