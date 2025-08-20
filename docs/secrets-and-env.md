# Secrets & Environment Management

## Principles

- No plaintext secrets in repo.
- Use `wrangler secret put` for Workers secrets.
- Local dev: optional `.dev.vars` (Cloudflare convention) – gitignored.
- Validation via shared `validateEnv` helper.

## Required (Current Workers)

| Worker                | Secret                      | Purpose                                   |
| --------------------- | --------------------------- | ----------------------------------------- |
| root / project-ignite | SLACK_WEBHOOK_URL           | Slack notification integration (optional) |
| onboarding            | AI_API_KEY                  | AI generation for config recommendations  |
| ai-orchestrator       | AI_GATEWAY_TOKEN            | Cloudflare AI gateway token               |
| ai-orchestrator       | TOGETHER_API_KEY (optional) | Alt AI provider                           |
| ai-orchestrator       | OPENAI_API_KEY (optional)   | Alt AI provider                           |
| mcp-idp               | JWT_SECRET                  | Token signing                             |
| mcp-mobile            | JWT_SECRET                  | Mobile auth                               |

## Adding a Secret

```
wrangler secret put AI_API_KEY --config onboarding/wrangler.toml
```

## Local Dev Strategy

1. Create `.dev.vars` adjacent to each worker `wrangler.toml` with non-production placeholders.
2. Never commit `.dev.vars`.
3. Reference secrets via `env.SECRET_NAME` in code.

## Automatic Validation

Example usage:

```ts
import { validateEnv, commonEnvSpec } from "@atlasit/shared";

const env = validateEnv(
  {
    ...commonEnvSpec,
    AI_API_KEY: z.string().min(1),
  },
  envRaw,
);
```

## CI Enforcement

Add future CI job: grep for forbidden patterns (`OPENAI_API_KEY=` style) & fail build if found.

## Rotation

Track rotation cadence in future compliance module (Phase 3). Manual rotation via re-running `wrangler secret put`.
