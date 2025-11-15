# Evidence Directory (Deprecated)

⚠️ **This directory is deprecated.**

**New Location:** `/artifacts`

All evidence artifacts should now be emitted to the `/artifacts` directory at the repository root.

## Migration

Old evidence files in `.evidence/` are retained for historical reference but are not indexed or validated by the autonomous framework.

To migrate:
1. Review existing evidence in `.evidence/`
2. Re-emit current evidence to `/artifacts` using `scripts/emit-evidence.ts`
3. Run `npm run evidence:aggregate` to generate `artifacts/INDEX.json`

## Current Evidence System

- **Location:** `/artifacts`
- **Schema:** `EVIDENCE_SCHEMA.json`
- **Index:** `artifacts/INDEX.json`
- **Scripts:** `scripts/emit-evidence.ts`, `scripts/aggregate-evidence.ts`
