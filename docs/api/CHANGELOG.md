# API Changelog

All notable OpenAPI contract changes for the compliance & platform APIs.

## 1.1.0 - 2025-10-01

- Added evidence layer endpoints (`POST /api/evidence/ingest`, `GET /api/evidence/{hash}`, `GET /api/evidence/search`).
- Extended `/health` payload with `evidenceCount` and `buildVersion` fields.
- Documented snapshot `ageSeconds` response attribute.
- Updated server list to include production `https://www.atlasit.pro` origin.

## 3.1.0 - 2025-09-30

- Baseline specification introduced (`openapi.yaml`): health, compliance snapshot (placeholder), policy evaluate stub path.
- Added `tenantId` field requirement in responses (foundation phase note).
- Established verification script (`scripts/openapi-verify.mjs`).

---

Append-only. For each spec modification create a new dated section referencing semantic version bump rationale (major = breaking, minor = additive endpoints/fields, patch = doc/typo corrections).
