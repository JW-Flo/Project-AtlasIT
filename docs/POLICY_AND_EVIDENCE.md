# Policy and Evidence

Status: Draft
Owner: AtlasIT Platform
Last Updated: 2025-10-01

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

- Input: `tenantId` (explicit), `subject` (tenant, user, posture, context), `policyPackRef`, `timestamp`.
- Output: `result` (decisions, entitlement deltas, violations[]) and `evidenceEnvelope`.
- Determinism: functions limited to pure ops; no wall-clock beyond provided `timestamp`.

### Evidence Envelope

```json
{
  "id": "uuid",
  "tenantId": "t_...", // mandatory for *all* envelopes (multi-tenant isolation)
  "policyPack": {
    "name": "baseline-mfa",
    "version": "1.2.0",
    "checksum": "sha256:..."
  },
  "subject": { "userId": "u_...", "attributes": { "department": "Sales" } },
  "result": { "allow": true, "requirements": ["mfa"] },
  "artifacts": [
    {
      "kind": "ruleset",
      "hash": "sha256:...",
      "path": "packs/baseline-mfa/rules/main.json"
    },
    { "kind": "input", "hash": "sha256:..." }
  ],
  "hash": "sha256:...", // of canonicalized envelope without storage fields (stable key order)
  "createdAt": "2025-09-17T23:00:00Z"
}
```

- Canonicalization: stable JSON serialization (sorted keys, UTF-8); hash using `sha256`.
- Re-computation of hash MUST yield identical value for identical semantic content; any deviation triggers integrity alert.

#### Canonical JSON Example

```json
// source payload (unordered)
{
  "policyPack": { "version": "1.0.0", "name": "baseline" },
  "tenantId": "demo",
  "subject": { "userId": "u-1", "attributes": { "role": "admin", "region": "US" } },
  "result": { "allow": true, "violations": [] }
}

// canonical string (produced by hashCanonicalJson)
{"policyPack":{"name":"baseline","version":"1.0.0"},"result":{"allow":true,"violations":[]},"subject":{"attributes":{"region":"US","role":"admin"},"userId":"u-1"},"tenantId":"demo"}
```

- The canonical string above is the exact payload written to R2. The SHA-256 digest of this string becomes the evidence key.
- Any client submitting evidence through `/api/evidence/ingest` may send keys in arbitrary order; the worker performs canonicalization prior to hashing.

### Risk Model (Added 2025-09-30)

Risk objects produced or aggregated into snapshots include:

```json
{
  "id": "R1",
  "title": "Example risk",
  "likelihood": 4,
  "impact": 3,
  "score": 12,
  "severity": "high"
}
```

Derivations:

- `score = likelihood * impact` (1–25)
- Suggested severity mapping: 1–5 low, 6–10 medium, 11–16 high, 17–25 critical.
- Manual severity override allowed but stored alongside derived score for transparency.

Validation Rules:

1. `likelihood` and `impact` integers in range [1,5].
2. `score` must equal `likelihood * impact` or evaluation rejected.
3. `severity` must match mapping unless override flag present (`severityOverride=true`).

### Versioning & Schema Evolution

- All policy & evidence JSON structures are append‑only; field removal requires a major version bump.
- OpenAPI specification (`docs/api/openapi.yaml`) is source of truth for public response shapes.
- Breaking change process: propose → review → CHANGELOG entry → gated merge via contract workflow.

## Storage Model

- Evidence blobs stored in R2 with object key = `<sha256>` (no prefix), content-type `application/json; charset=utf-8`.
- Write path: `PUT r2://evidence/<sha256>` with `If-None-Match: *` for immutability.
- Index in D1 table `evidence_index`:
  - `(id INTEGER PRIMARY KEY AUTOINCREMENT, hash TEXT UNIQUE, tenant_id, pack, subject_ref, created_at, payload TEXT)`
- Optional mirror: AWS S3 bucket with same object key for dual-verify.

## API Endpoints (MVP)

- `POST /api/policy/evaluate` → returns `{ result, evidence: { hash } }`; stores envelope to R2 + D1 index.
- `POST /api/evidence/ingest` → canonicalises payload, writes to R2/D1; responds with `{ hash, stored }`.
- `GET /api/evidence/:hash` → returns canonical envelope (JSON) by hash.
- `GET /api/evidence/search?tenant=...&pack=...&subject=...` → paginated D1 query.

## Policy Templates & Generation (Added 1.2.0)

Templates are stored in D1 table `policy_templates` keyed by `key` (e.g. `soc2.demo`). Generation is deterministic:

1. Client calls `POST /api/policies/generate` with `{ tenantId, templateKey, context }`.
2. Server canonicalizes `context` → produces `contextHash` (sha256 of canonical JSON string).
3. Lookup existing row in `generated_policies` by `(tenant_id, template_key, context_hash)`.
4. If found, return cached record (`cached=true`). Otherwise render template with context (must be pure / side‑effect free), compute `hash` of content, store row, return with `cached=false`.

Constraints:

- Template rendering must not perform network I/O.
- Maximum rendered size enforced via environment `MAX_POLICY_SIZE_BYTES` (future – placeholder for guard rails).
- New templates introduced only via migration or seed logic; existing keys stable.

## Control Coverage & Evidence Linking (Added 1.2.0)

Internal controls are defined in `internal_controls` with many-to-many relationship to policies (`control_mappings`). Evidence linking allows associating previously ingested evidence hashes to a control for audit readiness.

Endpoint Flow:

- `GET /api/policies/coverage/{framework}` returns coverage percentage and per-control evidence counts.
- `POST /api/controls/{controlKey}/evidence-link` with `{ tenantId, evidenceHash }` creates idempotent link in `control_evidence_links` (unique composite index prevents duplicates).

Coverage Calculation:

```text
coveragePercent = (number_of_controls_with_at_least_one_evidence / total_controls) * 100
```

## Health Metrics Extensions (Added 1.2.0)

Health response now includes:

- `policyTemplateCount`
- `generatedPolicyCount`
- `controlCount`
- `controlEvidenceLinks`

These are additive and optional for clients; absence should be treated as `unknown`.

## Caching & Idempotency

Policy generation caching relies on context hashing. Clients repeating identical semantic contexts (regardless of object key order) will receive identical `contextHash` and reuse stored content, eliminating duplicate entries and enabling deterministic auditing.

Evidence link creation is idempotent: duplicate submissions return `linked=true` with no additional side-effects.

## Retention Updates (1.2.0)

- `generated_policies`: retained indefinitely until explicit archival process (future) – counts exposed in health.
- `control_evidence_links`: retained indefinitely; removal only through administrative tooling (future) to preserve audit trail.

## Future Considerations

- Multi-framework coverage aggregation.
- Template version pinning and historical regeneration with new formats (will require `template_version` column addition via migration).
- Attestation signing of generated policies with tenant-specific key pairs.

## Snapshots

- Nightly snapshot per tenant: materialize `compliance_snapshot/<tenant>/<YYYY-MM-DD>.json` into R2.
- Snapshot includes counts by decision, violations by rule, top changes vs. prior day.
- Idempotent: `INSERT INTO snapshots ... ON CONFLICT(tenant_id)` and `If-None-Match` on R2 object.

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
