# AtlasIT Connector Toolkit

This guide enumerates tooling available for building and validating AtlasIT connector adapters.

## Generator v1

The Adapter Generator CLI scaffolds a Cloudflare Worker-compatible adapter from a JSON schema (OpenAPI or bespoke). Run the CLI from the repository root:

```bash
npm run build:adapter-gen
node packages/adapter-gen/dist/cli.js gen \
  --schema contracts/examples/example-openapi.json \
  --name "Example HR Suite" \
  --out adapters
```

Flags:

- `--flag` (optional): override the default feature flag name (`FEATURE_CONNECTOR_<SLUG>`).
- `--force`: overwrite an existing adapter directory.
- `--out`: change the output directory (defaults to `adapters/`).

The generator produces:

- Worker scaffold files (`index.ts`, `routes.ts`, `types.d.ts`, `README.md`).
- A local `schema.json` copy of the source schema.
- `atlasit.adapter.json` metadata (name, slug, feature flag).
- Updates `adapters/registry.json` with the adapter manifest.

## Simulator

The Simulator CLI executes the adapter's `/health` route and validates headers against a contract definition. After building the adapter (`tsc -p adapters/<slug>/tsconfig.json`), run:

```bash
npm run build:adapter-sim
node packages/adapter-sim/dist/cli.js sim \
  --adapter adapters/example-hr-suite \
  --contract contracts/examples/example-contract.json \
  --junit artifacts/pr4_adapter/junit.xml
```

All assertions stream to stdout. The command exits non-zero on failure and emits JUnit XML when `--junit` is provided.

## Connectors API Listing

Adapters become discoverable via the `/api/connectors` Worker endpoint only when their feature flag is enabled in the execution environment (`FEATURE_CONNECTOR_<SLUG>=1`). This allows safe rollout of generated adapters.

## Research Normalizer

AtlasIT Research Engine turns vendor documentation into structured schemas that the generator can consume. Normalize Markdown-based research notes into JSON using:

```bash
npm run build:research-engine
node packages/research-engine/dist/cli.js normalize \
  --input research/raw/example-hr-suite.md \
  --out artifacts/research/schema.json \
  --name "Example HR Suite"
```

The resulting `atlasit.research-schema` document includes `openapi` output for adapter scaffolding. When the generator receives a research schema, it stores both the original research payload (`research.schema.json`) and the derived `schema.json` in the adapter directory.
