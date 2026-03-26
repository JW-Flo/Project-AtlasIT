# PR7: Hybrid AWS Support Docs

## Scope

- Add Hybrid AWS section to central roadmap.
- New docs/HYBRID_AWS.md covering purpose, services, integration patterns, Terraform path, security notes.
- Update docs/architecture.md with ASCII diagram for hybrid flow.
- Update ops/codex-active-work.json to include PR7 entry.

## Done Means

- Docs build/lint pass.
- No app runtime code changes.
- Clear guidance for contributors on optional AWS backplane.

## Artifacts

- docs/roadmap.md
- docs/HYBRID_AWS.md
- docs/architecture.md
- ops/codex-active-work.json

## Risks

- Scope creep into implementation; kept strictly docs/ops metadata.
- Ensure AWS free-tier usage only; OIDC federation; no secrets committed.

## Next Steps

- Add Terraform modules under infra/aws/** (separate PR).
- Wire minimal POC flow (Workers → EventBridge → StepFn) behind feature flag (separate PR).
