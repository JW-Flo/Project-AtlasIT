# Secrets Management (Local Dev + 1Password CLI)

## Overview

Local development secrets are sourced from:

1. `.env` (developer overrides / non-sensitive defaults)
2. 1Password CLI (`op`) using mapping file `op-map.json`
3. Ephemeral injection via `op run` or the helper script `op-inject.sh`

## Files

| Path                                  | Purpose                                            |
| ------------------------------------- | -------------------------------------------------- |
| `.env.example`                        | Template of required variables (copy to `.env`)    |
| `.env`                                | Developer local values (never commit real secrets) |
| `ops/secrets/op-map.json`             | Mapping of env var -> 1Password item field         |
| `ops/secrets/op-inject.sh`            | Loads mapped secrets into current shell session    |
| `ops/DEPLOYMENT_SECRETS_CHECKLIST.md` | Production/staging required secret inventory       |

## 1Password Mapping Format

`op-map.json` format:

```json
{
  "version": 1,
  "mappings": {
    "CF_API_TOKEN": "op://Vault/Item/field"
  }
}
```

Each value after `op://` follows: `vault name / item title / field label`.

## Loading Secrets (Two Approaches)

### 1. Direct Shell Export

```bash
source ops/secrets/op-inject.sh
# Now env vars are available
npm run dev
```

### 2. Ephemeral Execution (Preferred)

```bash
op run --env-file=.env -- npm run dev
```

This merges `.env` definitions with secrets read just-in-time from 1Password ( precedence: op > .env ).

## Adding a New Secret

1. Store secret in appropriate 1Password vault/item.
2. Add mapping to `op-map.json`.
3. (Optional) Add placeholder to `.env.example`.
4. Use either loading approach above.

## Validating

```bash
op read op://AtlasIT\ Cloudflare/Cloudflare\ API\ Token/credential | head -c 8
printenv CF_API_TOKEN | head -c 8
```

Both prefixes should match.

## Security Notes

- Avoid exporting secrets permanently in shell startup files.
- Prefer ephemeral `op run` in CI (GitHub Actions supports 1Password OIDC—future enhancement).
- Rotate tokens per policy in `DEPLOYMENT_SECRETS_CHECKLIST.md`.

## Troubleshooting

| Symptom                    | Cause              | Fix                                    |
| -------------------------- | ------------------ | -------------------------------------- |
| Empty env var after script | Mapping path wrong | Verify with `op item get` or `op read` |
| `op` auth errors           | Not signed in      | Run `op signin` first                  |
| JSON parse failure         | jq not installed   | `brew install jq`                      |

## Roadmap

- Add CI integration via OIDC + 1Password Connect.

## CI integration

For CI workflows we prefer ephemeral access (OIDC + 1Password Connect) or using the 1Password CLI with an automation token. See `ops/secrets/GITHUB_ACTIONS_1PASSWORD.md` for examples and recommended patterns.

- Pre-commit secret scanning (already in security workflow).
