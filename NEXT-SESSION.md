# Next Session: Demo Readiness Phases 5-7

## What's Done

PRs #477-480 merged. Phases 1-4 complete:

- Bug fixes (compliance-api prefix, settings pathMap, directory sync, policy content)
- 41+ endpoint audit with Lambda fixes (MFA cast, JML columns, NHI handler, pathMap gaps)
- Demo data seeded
- UI response shapes aligned

## What's Next

### Phase 5: UI/UX Polish

Test every page at https://www.atlasit.pro in browser. Fix issues found.

1. **Dark mode audit** — check all pages for white-on-white, invisible inputs, broken focus states
2. **Loading states** — verify spinners/skeletons on every data-fetching page
3. **Toast notifications** — verify appear on save/error, auto-dismiss (4000ms)
4. **Form validation** — settings save, policy create, automation rule create, invite user
5. **Responsive layout** — test at 1024px, 768px, 375px
6. **Navigation** — all AppFrame sidebar links work (no dead links or 404s)
7. **Browser console** — clear JS errors/warnings on each page load
8. **Empty states** — pages with no data show helpful messages, not blank screens

### Phase 6: Performance & Reliability

1. **Lambda cold starts** — `curl` each endpoint after 15min idle. Target: <3s cold, <500ms warm
2. **API response times** — time dashboard, compliance scores, policies list. Target: <500ms
3. **Auth flow** — login -> session -> API calls E2E, session expiry handling
4. **CORS** — no browser CORS errors
5. **Error handling** — API errors return user-friendly messages, not stack traces
6. **CloudWatch alarm** — add log-metric filter on `ERROR|Unhandled|TypeError` for compliance-api
7. **Events consumer** — walk one event from publish -> SQS -> orchestrator -> processed

### Phase 7: Demo Script & Prep

1. **Demo click-path**: Login -> Dashboard -> Compliance -> Packs -> Policies -> Automation -> Directory -> Access Reviews -> Settings -> Marketplace -> Trust Center
2. Talking points per screen
3. Known limitations (what NOT to click)
4. Capture "known good" screenshots as backup deck

## Key Files

| Purpose           | Path                                                         |
| ----------------- | ------------------------------------------------------------ |
| Fetch interceptor | `console-app/src/routes/+layout.svelte:25-100`               |
| AppFrame/nav      | `console-app/src/lib/components/layout/AppFrame.svelte`      |
| Toast system      | `console-app/src/lib/components/feedback/toastStore.ts`      |
| Theme store       | `console-app/src/lib/stores/theme.ts`                        |
| Full plan         | Plan file in `~/.claude/plans/drifting-splashing-volcano.md` |

## Build & Deploy

```bash
# Console-app (SPA to S3)
cd console-app
SVELTE_CONFIG=svelte.config.aws.js VITE_API_URL=https://ahjoepuw96.execute-api.us-east-1.amazonaws.com pnpm build
aws s3 sync build/ s3://atlasit-console-dev-457335975503 --delete
aws cloudfront create-invalidation --distribution-id E1AHLAH04F9IIZ --paths "/*"

# Lambda rebuild + deploy
node scripts/build-lambdas.mjs --function <name>
cd lambdas/<name>/dist && npm install pg && cd ..
powershell Compress-Archive -Path dist/handler.js,dist/node_modules -DestinationPath dist/lambda.zip -Force
aws lambda update-function-code --function-name atlasit-<name>-dev --zip-file "fileb://lambdas/<name>/dist/lambda.zip"
```
