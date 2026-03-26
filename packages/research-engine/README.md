# AtlasIT Research Engine

CLI to normalize vendor docs to deterministic JSON and embed OpenAPI 3.1 paths/schemas for adapter scaffolding.

## Install & Build

```bash
# from repo root
npm --workspaces -w packages/research-engine run build
```

## Normalize Markdown → research schema

```bash
node packages/research-engine/dist/cli.js normalize \
  --input research/raw/example-hr-suite.md \
  --out artifacts/research/example-hr-suite.schema.json \
  --name "Example HR Suite"
```

Repeat for other sources:

```bash
node packages/research-engine/dist/cli.js normalize \
  --input research/raw/slack-provisioning.md \
  --out artifacts/research/slack-provisioning.schema.json \
  --name "Slack Provisioning"

node packages/research-engine/dist/cli.js normalize \
  --input research/raw/google-workspace.md \
  --out artifacts/research/google-workspace.schema.json \
  --name "Google Workspace"
```

## Generate adapter from research schema

```bash
npm --workspaces -w packages/adapter-gen run build
node packages/adapter-gen/dist/cli.js gen \
  --schema artifacts/research/example-hr-suite.schema.json \
  --name "Example HR Suite" \
  --out adapters \
  --force
```

## Notes

- Deterministic schemas are stored under `artifacts/research/`.
- Adapter generator stores both `schema.json` and `research.schema.json` when fed a research schema.
- Feature-gate newly generated adapters with env var: `FEATURE_CONNECTOR_<SLUG>=1`.
