# Prompt Versioning Strategy

We introduce lightweight implicit prompt versioning in early phases using a deterministic hash of the full prompt template + embedded variable keys. This keeps storage minimal while enabling:

- Reproducibility of AI outputs in audit scenarios
- Drift detection when prompts evolve
- Rollback capability by retaining prior template text in VCS

## Deterministic Mode

For tests and stable snapshots, set `AI_DETERMINISTIC=1` which short‑circuits `generateAI` to produce a hash-based pseudo response. This ensures CI does not rely on external AI providers.

## Hash Composition

`version_hash = sha256(template_text + '\n' + JSON.stringify(variable_keys_sorted))`

This mirrors the schema hash approach for migrations and allows quick diffing. Collisions are practically negligible for our scale.

## Storage Approach (Later Phase)

If/when persistence is required:

1. `prompt_versions` table with: id, name, version_hash, template_text, created_at
2. Foreign keys from generated artifacts referencing `(name, version_hash)`
3. Optional `active` flag for runtime selection

Until then, Git history + computed hash offers sufficient traceability.

## Change Workflow

1. Edit prompt template in repo
2. Run tests (deterministic mode) to validate structure
3. Commit – hash changes surface in code review
4. (Optional) record hash in audit log when first used in production

## Future Enhancements

- Add structured linter to validate placeholders exist in code
- Automatic changelog generation from prompt diffs
- Multi-locale prompt bundles sharing semantic version core
