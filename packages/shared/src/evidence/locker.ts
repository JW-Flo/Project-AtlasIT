/**
 * Evidence Locker
 *
 * Writes classified evidence to both:
 *   1. R2 (immutable, content-addressed, tamper-evident) — the audit trail
 *   2. D1 compliance_evidence (queryable, indexed) — for scoring + feed
 *
 * Each evidence item stored in R2 gets:
 *   - SHA-256 content hash (tamper detection)
 *   - Control tags (which controls it affects)
 *   - Impact direction (positive/detrimental/neutral)
 *   - Full payload snapshot
 *
 * Tenant-scoped: evidence is partitioned by tenant_id in both R2 paths and D1 queries.
 */

import type { ClassifiedEvidence, ControlClassification } from "./classifier.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EvidenceLockerItem {
  id: string;
  tenantId: string;
  eventType: string;
  source: string;
  actor: string;
  subject: string | null;
  controls: ControlClassification[];
  payload: Record<string, unknown>;
  contentHash: string;
  r2Key: string;
  classifiedAt: string;
  storedAt: string;
}

export interface LockerWriteResult {
  id: string;
  contentHash: string;
  r2Key: string;
  controlsTagged: number;
  d1RowsWritten: number;
  alreadyExists: boolean;
}

export interface LockerDependencies {
  db: D1Database;
  bucket?: R2Bucket;
}

// ── Content Hashing ───────────────────────────────────────────────────────────

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}

function canonicalize(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as Record<string, unknown>).sort());
}

// ── Locker ────────────────────────────────────────────────────────────────────

/**
 * Store classified evidence in the evidence locker.
 *
 * 1. Compute content hash for tamper detection
 * 2. Write immutable envelope to R2 (if bucket available)
 * 3. Write one row per control to compliance_evidence in D1
 *    (each control tag gets its own row for granular scoring)
 */
export async function storeEvidence(
  deps: LockerDependencies,
  evidence: ClassifiedEvidence,
): Promise<LockerWriteResult> {
  const id = crypto.randomUUID();

  // Content hash covers: tenantId + eventType + source + actor + subject + payload + controls
  const hashInput = canonicalize({
    tenantId: evidence.tenantId,
    eventType: evidence.eventType,
    source: evidence.source,
    actor: evidence.actor,
    subject: evidence.subject,
    payload: evidence.payload,
    controls: evidence.controls.map((c) => `${c.framework}:${c.controlId}:${c.impact}`),
  });
  const contentHash = await sha256(hashInput);

  // R2 path: evidence/<tenantId>/<YYYY-MM>/<contentHash>.json
  const month = evidence.classifiedAt.slice(0, 7); // YYYY-MM
  const r2Key = `evidence/${evidence.tenantId}/${month}/${contentHash}.json`;

  // Build the locker item
  const item: EvidenceLockerItem = {
    id,
    tenantId: evidence.tenantId,
    eventType: evidence.eventType,
    source: evidence.source,
    actor: evidence.actor,
    subject: evidence.subject,
    controls: evidence.controls,
    payload: evidence.payload,
    contentHash,
    r2Key,
    classifiedAt: evidence.classifiedAt,
    storedAt: new Date().toISOString(),
  };

  // Write to R2 (immutable audit trail) — idempotent by content hash
  let alreadyExists = false;
  if (deps.bucket) {
    const existing = await deps.bucket.head(r2Key);
    if (existing) {
      alreadyExists = true;
    } else {
      await deps.bucket.put(r2Key, JSON.stringify(item), {
        customMetadata: {
          tenantId: evidence.tenantId,
          eventType: evidence.eventType,
          contentHash,
          controlCount: String(evidence.controls.length),
        },
      });
    }
  }

  // Write to D1 — one row per control tag for granular scoring
  let d1RowsWritten = 0;

  if (!alreadyExists) {
    const batch: D1PreparedStatement[] = [];

    for (const ctrl of evidence.controls) {
      const rowId = crypto.randomUUID();
      batch.push(
        deps.db
          .prepare(
            `INSERT INTO compliance_evidence
             (id, tenant_id, framework, framework_id, control_id, control_name,
              evidence_type, source, source_id, actor, subject, metadata, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            rowId,
            evidence.tenantId,
            ctrl.framework,
            ctrl.framework,
            ctrl.controlId,
            ctrl.controlName,
            ctrl.category,
            evidence.source,
            contentHash, // link back to R2 via content hash
            evidence.actor,
            evidence.subject,
            JSON.stringify({
              impact: ctrl.impact,
              confidence: ctrl.confidence,
              reasoning: ctrl.reasoning,
              eventType: evidence.eventType,
              r2Key,
              contentHash,
              payload: evidence.payload,
            }),
            evidence.classifiedAt,
          ),
      );
    }

    if (batch.length > 0) {
      await deps.db.batch(batch);
      d1RowsWritten = batch.length;
    }
  }

  return {
    id,
    contentHash,
    r2Key,
    controlsTagged: evidence.controls.length,
    d1RowsWritten,
    alreadyExists,
  };
}

/**
 * Query evidence from the locker for a specific tenant.
 * Supports filtering by framework, control, category, impact, and time range.
 */
export async function queryEvidence(
  db: D1Database,
  tenantId: string,
  options: {
    framework?: string;
    controlId?: string;
    category?: string;
    impact?: string;
    since?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ items: Record<string, unknown>[]; total: number }> {
  const conditions = ["tenant_id = ?"];
  const params: unknown[] = [tenantId];

  if (options.framework) {
    conditions.push("framework = ?");
    params.push(options.framework);
  }
  if (options.controlId) {
    conditions.push("control_id = ?");
    params.push(options.controlId);
  }
  if (options.category) {
    conditions.push("evidence_type = ?");
    params.push(options.category);
  }
  if (options.since) {
    conditions.push("created_at >= ?");
    params.push(options.since);
  }
  // Impact is stored in metadata JSON — filter in app layer if needed

  const where = conditions.join(" AND ");
  const limit = Math.min(options.limit ?? 50, 200);
  const offset = Math.max(options.offset ?? 0, 0);

  const [rows, countRow] = await Promise.all([
    db
      .prepare(
        `SELECT * FROM compliance_evidence WHERE ${where}
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...params, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) AS cnt FROM compliance_evidence WHERE ${where}`)
      .bind(...params)
      .first<{ cnt: number }>(),
  ]);

  return {
    items: rows.results ?? [],
    total: countRow?.cnt ?? 0,
  };
}
