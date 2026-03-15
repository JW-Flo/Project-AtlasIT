## Summary
- What problem does this PR solve?
- What user-facing/ops-facing behavior changes?

## Type safety
- [ ] `npm run typecheck` passes (tsc --noEmit)
- [ ] No new `any` leakage in public interfaces

## Tests
- [ ] `npm run test:unit` passes
- [ ] Added/updated tests for new logic

## Evidence & auditability (if applicable)
- [ ] New workflow steps emit evidence envelopes
- [ ] Evidence hash is stable under key reorder (canonical JSON)
- [ ] TenantId is authenticated and cannot be spoofed

## Ops
- [ ] Updated docs/runbooks if behavior changed

## Rollback plan
- How do we revert safely?
