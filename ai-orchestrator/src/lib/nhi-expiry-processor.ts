/**
 * NHI Token Expiry Processor
 *
 * Runs as a cron duty to detect expiring/expired NHI credentials and emit
 * lifecycle events for the evidence pipeline. Mirrors the access-review
 * auto-revoke pattern.
 *
 * Flow:
 *   1. Query nhi_credentials for tokens expiring within grace period
 *   2. Emit nhi.token.expiring events (neutral compliance evidence)
 *   3. Query for expired tokens still marked active
 *   4. Update status to 'expired', emit nhi.token.expired events (detrimental)
 *   5. Write audit log entries
 */

import { classifyEvent } from "@atlasit/shared";

interface ExpiryProcessorDeps {
  sharedDb: D1Database;
  evidenceBucket?: R2Bucket;
}

interface ExpiryResult {
  expiringSoon: number;
  expired: number;
  errors: number;
}

const DEFAULT_GRACE_PERIOD_DAYS = 30;

async function loadGracePeriodDays(db: D1Database): Promise<number> {
  try {
    const row = await db
      .prepare("SELECT value FROM tenant_preferences WHERE key = 'nhi_rotation_config' LIMIT 1")
      .first<{ value: string }>();
    if (row?.value) {
      const config = JSON.parse(row.value);
      if (typeof config.gracePeriodDays === "number" && config.gracePeriodDays > 0) {
        return config.gracePeriodDays;
      }
    }
  } catch {
    /* use default */
  }
  return DEFAULT_GRACE_PERIOD_DAYS;
}

export async function processExpiringNhiCredentials(
  deps: ExpiryProcessorDeps,
): Promise<ExpiryResult> {
  const { sharedDb } = deps;
  const now = new Date();
  const gracePeriodDays = await loadGracePeriodDays(sharedDb);
  const graceDate = new Date(now.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
  let expiringSoon = 0;
  let expired = 0;
  let errors = 0;

  // ── Phase 1: Find tokens expiring within grace period ──────────────────
  try {
    const { results: expiringRows } = await sharedDb
      .prepare(
        `SELECT nc.id, nc.tenant_id, nc.display_name, nc.credential_type, nc.provider,
                nc.external_id, nc.owner_email, nc.expires_at
         FROM nhi_credentials nc
         WHERE nc.status = 'active'
           AND nc.expires_at IS NOT NULL
           AND nc.expires_at > ?
           AND nc.expires_at <= ?
         LIMIT 500`,
      )
      .bind(now.toISOString(), graceDate.toISOString())
      .all<{
        id: string;
        tenant_id: string;
        display_name: string;
        credential_type: string;
        provider: string;
        external_id: string;
        owner_email: string | null;
        expires_at: string;
      }>();

    for (const row of expiringRows ?? []) {
      try {
        // Classify and store evidence
        const classified = classifyEvent(
          row.tenant_id,
          "nhi.token.expiring",
          `adapter:${row.provider}`,
          "system",
          row.display_name,
          {
            credentialId: row.id,
            credentialType: row.credential_type,
            provider: row.provider,
            externalId: row.external_id,
            ownerEmail: row.owner_email,
            expiresAt: row.expires_at,
            daysUntilExpiry: Math.ceil(
              (new Date(row.expires_at).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            ),
          },
        );

        if (classified) {
          for (const ctrl of classified.controls) {
            await sharedDb
              .prepare(
                `INSERT OR IGNORE INTO compliance_evidence
                 (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              )
              .bind(
                crypto.randomUUID(),
                row.tenant_id,
                ctrl.framework,
                ctrl.controlId,
                ctrl.controlName,
                "nhi_expiry_warning",
                `nhi:${row.provider}`,
                `nhi:${row.id}:expiring`,
                "system",
                row.display_name,
                JSON.stringify({
                  credentialType: row.credential_type,
                  expiresAt: row.expires_at,
                  impact: ctrl.impact,
                  category: ctrl.category,
                }),
                now.toISOString(),
              )
              .run();
          }
        }

        // Emit auto-rotation event if enabled for this tenant
        try {
          const prefRow = await sharedDb
            .prepare(
              "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'nhi_rotation_config' LIMIT 1",
            )
            .bind(row.tenant_id)
            .first<{ value: string }>();

          if (prefRow) {
            const rotationConfig = JSON.parse(prefRow.value) as { enabled?: boolean };
            if (rotationConfig.enabled === true) {
              await sharedDb
                .prepare(
                  `INSERT INTO events (id, tenant_id, type, source, payload, status, created_at)
                   VALUES (?, ?, 'nhi.token.rotation_requested', ?, ?, 'pending', ?)`,
                )
                .bind(
                  crypto.randomUUID(),
                  row.tenant_id,
                  `nhi:${row.provider}`,
                  JSON.stringify({
                    credentialId: row.id,
                    credentialType: row.credential_type,
                    provider: row.provider,
                    externalId: row.external_id,
                    ownerEmail: row.owner_email,
                    expiresAt: row.expires_at,
                  }),
                  now.toISOString(),
                )
                .run();
            }
          }
        } catch {
          // Auto-rotation check is best-effort
        }

        expiringSoon++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "nhi.expiry.scan_expiring_failed",
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    errors++;
  }

  // ── Phase 2: Find and mark expired tokens ──────────────────────────────
  try {
    const { results: expiredRows } = await sharedDb
      .prepare(
        `SELECT nc.id, nc.tenant_id, nc.display_name, nc.credential_type, nc.provider,
                nc.external_id, nc.owner_email, nc.expires_at
         FROM nhi_credentials nc
         WHERE nc.status = 'active'
           AND nc.expires_at IS NOT NULL
           AND nc.expires_at <= ?
         LIMIT 500`,
      )
      .bind(now.toISOString())
      .all<{
        id: string;
        tenant_id: string;
        display_name: string;
        credential_type: string;
        provider: string;
        external_id: string;
        owner_email: string | null;
        expires_at: string;
      }>();

    for (const row of expiredRows ?? []) {
      try {
        // Update status to expired
        await sharedDb
          .prepare(
            "UPDATE nhi_credentials SET status = 'expired', updated_at = ? WHERE id = ? AND tenant_id = ?",
          )
          .bind(now.toISOString(), row.id, row.tenant_id)
          .run();

        // Audit log
        await sharedDb
          .prepare(
            `INSERT INTO nhi_audit_log (id, tenant_id, credential_id, action, actor, details, created_at)
             VALUES (?, ?, ?, 'expired', 'system', ?, ?)`,
          )
          .bind(
            crypto.randomUUID(),
            row.tenant_id,
            row.id,
            JSON.stringify({
              expiresAt: row.expires_at,
              provider: row.provider,
              credentialType: row.credential_type,
            }),
            now.toISOString(),
          )
          .run();

        // Classify and store detrimental evidence
        const classified = classifyEvent(
          row.tenant_id,
          "nhi.token.expired",
          `adapter:${row.provider}`,
          "system",
          row.display_name,
          {
            credentialId: row.id,
            credentialType: row.credential_type,
            provider: row.provider,
            externalId: row.external_id,
            ownerEmail: row.owner_email,
            expiresAt: row.expires_at,
          },
        );

        if (classified) {
          for (const ctrl of classified.controls) {
            await sharedDb
              .prepare(
                `INSERT OR IGNORE INTO compliance_evidence
                 (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              )
              .bind(
                crypto.randomUUID(),
                row.tenant_id,
                ctrl.framework,
                ctrl.controlId,
                ctrl.controlName,
                "nhi_token_expired",
                `nhi:${row.provider}`,
                `nhi:${row.id}:expired`,
                "system",
                row.display_name,
                JSON.stringify({
                  credentialType: row.credential_type,
                  expiresAt: row.expires_at,
                  impact: ctrl.impact,
                  category: ctrl.category,
                }),
                now.toISOString(),
              )
              .run();
          }
        }

        expired++;
      } catch {
        errors++;
      }
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "nhi.expiry.scan_expired_failed",
        error: err instanceof Error ? err.message : String(err),
      }),
    );
    errors++;
  }

  return { expiringSoon, expired, errors };
}
