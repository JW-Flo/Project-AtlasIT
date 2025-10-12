# Restructure Plan (Project-AtlasIT)

Alignment
Follows canonical normalization rules (see AWhittleWandering docs).

Current Targets (Hypothetical)

- Consolidate misc util scripts → src/utils/.
- Move loose infra YAML → infra/ (terraform, pipelines).
- Co-locate service-specific tests beside src or under tests/<service>/.

Actions

1. Inventory script (reuse canonical pattern).
2. Phase PRs per service domain.
3. Update imports; run full build + tests.
4. Append single feed entry referencing all moved groups.
