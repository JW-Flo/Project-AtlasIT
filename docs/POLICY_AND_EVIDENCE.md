# Policy and Evidence

Status: Draft
Owner: AtlasIT Platform
Last Updated: 2025-09-17

## Purpose

Define how policies are authored, evaluated, and how resulting evidence is produced, stored, and verifiable across environments. Provide a clear, append-only audit model and snapshotting cadence.

## Policy Packs

- Pack structure: `packs/<namespace>/<name>/pack.json`
- Contents:
  - `rules/*.json` (DSL or CEL subset)
  - `schemas/*.json` (subject/result schemas via Valibot/Zod)
  - `mappings/*.json` (attribute mapping presets)
  - `tests/*.json` (golden cases) + `fixtures/`
- Versioning: semantic version; checksum (sha256) of pack folder; stored in D1 `policy_packs`.

## Evaluation Contract

- Input: `subject` (tenant, user, posture, context), `policyPackRef`, `timestamp`.
- Output: `result` (decisions, entitlement deltas, violations[]) and `evidenceEnvelope`.
- Determinism: functions limited to pure ops; no wall-clock beyond provided `timestamp`.

### Evidence Envelope

```json
{
  "id": "uuid",
  "tenantId": "t_...",
  "policyPack": {
    "name": "baseline-mfa",
    "version": "1.2.0",
    "checksum": "sha256:..."
  },
  "subject": { "userId": "u_...", "attributes": {"department":"Sales"} },
  "result": { "allow": true, "requirements": ["mfa"] },
  "artifacts": [
    { "kind": "ruleset", "hash": "sha256:...", "path": "packs/baseline-mfa/rules/main.json" },
    { "kind": "input", "hash": "sha256:..." }
  ],
  "hash": "sha256:...", // of canonicalized envelope without storage fields
  "createdAt": "2025-09-17T23:00:00Z"
}
```

- Canonicalization: stable JSON serialization (sorted keys, UTF-8); hash using `sha256`.

## Storage Model

- Evidence blobs stored in R2 with object key = `<sha256>` (no prefix), content-type `application/json; charset=utf-8`.
- Write path: `PUT r2://evidence/<sha256>` with `If-None-Match: *` for immutability.
- Index in D1 table `evidence_index`:
  - `(hash PRIMARY KEY, tenant_id, pack_name, pack_version, subject_ref, created_at)`
- Optional mirror: AWS S3 bucket with same object key for dual-verify.

## API Endpoints (MVP)

- `POST /api/policy/evaluate` → returns `{ result, evidence: { hash } }`; stores envelope to R2 + D1 index.
- `GET /api/evidence/:hash` → presigned URL or 302 to R2 object (respect tenant auth).
- `GET /api/evidence/search?tenant=...&pack=...&subject=...` → paginated D1 query.

## Snapshots

- Nightly snapshot per tenant: materialize `compliance_snapshot/<tenant>/<YYYY-MM-DD>.json` into R2.
- Snapshot includes counts by decision, violations by rule, top changes vs. prior day.
- Idempotent: `INSERT OR IGNORE` into D1 `snapshots` table and `If-None-Match` on R2 object.

## Integrity & Verification

- Double-write optional: write to R2 then mirror to S3; verify hashes match; record mirror status in D1.
- External notarization (optional): publish daily Merkle root of `evidence_index.hash` to a public log.
- Access control: only tenant-scoped tokens can fetch evidence; admin scopes only.

## Operational Notes

- Keep envelope small (<128KB). Store large inputs as separate artifacts with their own hashes.
- Redact secrets before hashing. Use deterministic masking for PII where possible.
- TTL: none for R2; rely on access controls; snapshots retained indefinitely unless policy dictates.

### Compliance Snapshot Renderer

A CLI helper consolidates raw evidence into a Markdown snapshot for auditors.

```bash
npm run render:compliance
```

Outputs:
- `docs/COMPLIANCE_SNAPSHOT.md` for human review
- `artifacts/policy/snapshot.md` (identical copy)
- `artifacts/policy/RUN.json` with metadata about the render (timestamp, controls)

