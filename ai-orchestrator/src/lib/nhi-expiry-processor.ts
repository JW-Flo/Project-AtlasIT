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
 *   3. Flag credentials within 7 days as rotation_pending + create incidents
 *   4. Query for expired tokens still marked active
 *   5. Update status to 'expired', emit nhi.token.expired events (detrimental)
 *   6. Create incidents for expired tokens
 *   7. Write audit log entries
 */

import { classifyEvent } from "@atlasit/shared";

interface ExpiryProcessorDeps {
  sharedDb: D1Database;
  evidenceBucket?: R2Bucket;
}

interface ExpiryResult {
  expiringSoon: number;
  expired: number;
  rotationPending: number;
  incidentsCreated: number;
  errors: number;
}

const DEFAULT_GRACE_PERIOD_DAYS = 30;
const ROTATION_THRESHOLD_DAYS = 7;

async function loadGracePeriodDays(db: D1Database, tenantId: string): Promise<number> {
  try {
    const row = await db
      .prepare(
        "SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'nhi_rotation_config'",
      )
      .bind(tenantId)
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

async function createNhiIncident(
  db: D1Database,
  tenantId: string,
  credential: {
    id: string;
    display_name: string;
    credential_type: string;
    provider: string;
    owner_email: string | null;
    expires_at: string;
  },
  kind: "expiring" | "expired",
): Promise<boolean> {
  const incidentId = crypto.randomUUID().replace(/-/g, "");
  const daysUntilExpiry = Math.ceil(
    (new Date(credential.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );

  const severity = kind === "expired" ? "high" : daysUntilExpiry <= 3 ? "high" : "medium";
  const title =
    kind === "expired"
      ? `Expired NHI credential: ${credential.display_name} (${credential.provider})`
      : `NHI credential expiring in ${daysUntilExpiry}d: ${credential.display_name} (${credential.provider})`;
  const description =
    kind === "expired"
      ? `The ${credential.credential_type} credential "${credential.display_name}" from ${credential.provider} expired at ${credential.expires_at}. Immediate rotation is required.`
      : `The ${credential.credential_type} credential "${credential.display_name}" from ${credential.provider} expires at ${credential.expires_at} (${daysUntilExpiry} days). Schedule rotation to avoid service disruption.`;

  try {
    // Deduplicate: don't create if an open incident already exists for this credential
    const existing = await db
      .prepare(
        `SELECT id FROM incidents
         WHERE tenant_id = ? AND source = 'nhi_expiry' AND source_id = ? AND status IN ('open', 'investigating')
         LIMIT 1`,
      )
      .bind(tenantId, credential.id)
      .first();

    if (existing) return false;

    await db
      .prepare(
        `INSERT INTO incidents (id, tenant_id, title, severity, status, source, source_id, description, created_at)
         VALUES (?, ?, ?, ?, 'open', 'nhi_expiry', ?, ?, datetime('now'))`,
      )
      .bind(incidentId, tenantId, title, severity, credential.id, description)
      .run();

    return true;
  } catch {
    return false;
  }
}

export async function processExpiringNhiCredentials(
  deps: ExpiryProcessorDeps,
): Promise<ExpiryResult> {
  const { sharedDb } = deps;
  const now = new Date();
  // Use default grace period for the initial scan; per-tenant config is applied
  // in the auto-rotation event emission inside the per-credential loop
  const graceDate = new Date(now.getTime() + DEFAULT_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const rotationDate = new Date(now.getTime() + ROTATION_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);
  let expiringSoon = 0;
  let expired = 0;
  let rotationPending = 0;
  let incidentsCreated = 0;
  let errors = 0;

  // ── Phase 1: Find tokens expiring within grace period ──────────────────
  try {
    const { results: expiringRows } = await sharedDb
      .prepare(
        `SELECT nc.id, nc.tenant_id, nc.display_name, nc.credential_type, nc.provider,
                nc.external_id, nc.owner_email, nc.expires_at, nc.status
         FROM nhi_credentials nc
         WHERE nc.status IN ('active', 'rotation_pending')
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
        status: string;
      }>();

    for (const row of expiringRows ?? []) {
      try {
        const daysUntilExpiry = Math.ceil(
          (new Date(row.expires_at).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );

        // ── Flag as rotation_pending if within 7 days ────────────────────
        if (daysUntilExpiry <= ROTATION_THRESHOLD_DAYS && row.status === "active") {
          await sharedDb
            .prepare(
              "UPDATE nhi_credentials SET status = 'rotation_pending', updated_at = ? WHERE id = ? AND tenant_id = ?",
            )
            .bind(now.toISOString(), row.id, row.tenant_id)
            .run();

          await sharedDb
            .prepare(
              `INSERT INTO nhi_audit_log (id, tenant_id, credential_id, action, actor, details, created_at)
               VALUES (?, ?, ?, 'rotation_pending', 'system', ?, ?)`,
            )
            .bind(
              crypto.randomUUID(),
              row.tenant_id,
              row.id,
              JSON.stringify({
                expiresAt: row.expires_at,
                daysUntilExpiry,
                provider: row.provider,
                credentialType: row.credential_type,
              }),
              now.toISOString(),
            )
            .run();

          // Create incident for rotation-pending credential
          const created = await createNhiIncident(sharedDb, row.tenant_id, row, "expiring");
          if (created) incidentsCreated++;

          rotationPending++;
        }

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
            daysUntilExpiry,
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
         WHERE nc.status IN ('active', 'rotation_pending')
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

        // Create incident for expired credential
        const created = await createNhiIncident(sharedDb, row.tenant_id, row, "expired");
        if (created) incidentsCreated++;

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

  return { expiringSoon, expired, rotationPending, incidentsCreated, errors };
}
