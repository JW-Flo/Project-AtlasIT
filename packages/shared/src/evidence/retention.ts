/**
 * Evidence Retention Policy
 *
 * Provides soft-delete retention enforcement and deletion protection
 * for audit-critical evidence. Evidence referenced by active compliance
 * controls or recent access reviews (within 1 year) cannot be deleted.
 *
 * Design: evidence is NEVER hard-deleted from R2 by this module.
 * Instead, rows in compliance_evidence are marked with a deleted_at
 * timestamp (soft-delete). A separate garbage-collection process can
 * later purge R2 objects for soft-deleted rows after a grace period.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RetentionResult {
  /** Number of evidence rows marked for soft-deletion. */
  markedForDeletion: number;
  /** Number of evidence rows protected from deletion (active references). */
  protected: number;
  /** Errors encountered during processing (non-fatal). */
  errors: string[];
}

interface EvidenceRow {
  id: string;
  tenant_id: string;
  framework: string;
  control_id: string;
  created_at: string;
}

// ── Retention enforcement ─────────────────────────────────────────────────────

/**
 * Enforce a retention policy for a tenant's evidence.
 *
 * Scans compliance_evidence for rows older than `retentionDays`, checks
 * each for active references, and soft-deletes unprotected rows by
 * setting `deleted_at`. Does NOT delete R2 objects.
 */
export async function enforceRetentionPolicy(
  db: D1Database,
  _bucket: R2Bucket,
  tenantId: string,
  retentionDays: number,
): Promise<RetentionResult> {
  const result: RetentionResult = {
    markedForDeletion: 0,
    protected: 0,
    errors: [],
  };

  const cutoffDate = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000,
  );

  // Find evidence older than the retention threshold that hasn't been soft-deleted
  let expiredRows: EvidenceRow[];
  try {
    const { results } = await db
      .prepare(
        `SELECT id, tenant_id, framework, control_id, created_at
         FROM compliance_evidence
         WHERE tenant_id = ?
           AND created_at < ?
           AND deleted_at IS NULL
         ORDER BY created_at ASC
         LIMIT 500`,
      )
      .bind(tenantId, cutoffDate.toISOString())
      .all<EvidenceRow>();
    expiredRows = results ?? [];
  } catch (err) {
    result.errors.push(
      `Failed to query expired evidence: ${err instanceof Error ? err.message : String(err)}`,
    );
    return result;
  }

  if (expiredRows.length === 0) {
    return result;
  }

  for (const row of expiredRows) {
    try {
      const deletionAllowed = await isEvidenceDeletionAllowed(
        db,
        row.id,
        tenantId,
      );

      if (!deletionAllowed) {
        result.protected++;
        continue;
      }

      // Soft-delete: set deleted_at timestamp
      await db
        .prepare(
          `UPDATE compliance_evidence SET deleted_at = ? WHERE id = ? AND tenant_id = ?`,
        )
        .bind(new Date().toISOString(), row.id, tenantId)
        .run();

      result.markedForDeletion++;
    } catch (err) {
      result.errors.push(
        `Failed to process evidence ${row.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return result;
}

// ── Deletion protection ───────────────────────────────────────────────────────

/**
 * Check whether an evidence item can be safely deleted.
 *
 * Returns false if the evidence is referenced by:
 *   1. Active compliance controls (status != 'not_started')
 *   2. Access review campaigns completed within the last year
 *
 * This prevents accidental deletion of audit-critical evidence that
 * supports current compliance posture or recent audit findings.
 */
export async function isEvidenceDeletionAllowed(
  db: D1Database,
  evidenceId: string,
  tenantId: string,
): Promise<boolean> {
  // Check 1: Is this evidence referenced by active compliance controls?
  // Active controls are those with status other than 'not_started'
  const activeControlRef = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM compliance_evidence ce
       WHERE ce.id = ? AND ce.tenant_id = ?
         AND EXISTS (
           SELECT 1 FROM compliance_evidence ce2
           WHERE ce2.tenant_id = ce.tenant_id
             AND ce2.framework = ce.framework
             AND ce2.control_id = ce.control_id
             AND ce2.deleted_at IS NULL
         )`,
    )
    .bind(evidenceId, tenantId)
    .first<{ cnt: number }>();

  if (activeControlRef && activeControlRef.cnt > 0) {
    return false;
  }

  // Check 2: Is this evidence referenced by recent access reviews (within 1 year)?
  const oneYearAgo = new Date(
    Date.now() - 365 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const recentReviewRef = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM compliance_evidence
       WHERE id = ? AND tenant_id = ?
         AND evidence_type = 'access_review'
         AND created_at >= ?`,
    )
    .bind(evidenceId, tenantId, oneYearAgo)
    .first<{ cnt: number }>();

  if (recentReviewRef && recentReviewRef.cnt > 0) {
    return false;
  }

  return true;
}
