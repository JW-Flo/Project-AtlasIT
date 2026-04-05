import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

/**
 * Attestation definitions — maps each attestable control to its CDT payload
 * field(s) and metadata. Used to validate POST requests and to build the
 * CDT payload during evaluation.
 */
const ATTESTABLE_CONTROLS: Record<
  string,
  { framework: string; key: string; description: string; cdtFields: string[] }
> = {
  // SOC2 governance controls
  "SOC2-CC1.2": {
    framework: "SOC2",
    key: "board_oversight_documented",
    description: "Board and management oversight documented",
    cdtFields: ["board_oversight_documented"],
  },
  "SOC2-CC1.3": {
    framework: "SOC2",
    key: "org_chart_published",
    description: "Organizational chart published and current",
    cdtFields: ["org_chart_published"],
  },
  "SOC2-CC3.2": {
    framework: "SOC2",
    key: "vendor_risk_reviewed",
    description: "Vendor/third-party risk assessment completed",
    cdtFields: ["vendor_risk_reviewed"],
  },
  "SOC2-CC9.1": {
    framework: "SOC2",
    key: "unmitigated_high_risks",
    description: "Risk register reviewed — unmitigated high risks count",
    cdtFields: ["unmitigated_high_risks"],
  },
  "SOC2-CC9.2": {
    framework: "SOC2",
    key: "bcr_plan",
    description: "Business continuity/disaster recovery plan and testing",
    cdtFields: ["bcr_plan_exists", "days_since_bcr_test"],
  },
  "SOC2-CC7.3": {
    framework: "SOC2",
    key: "incident_response_plan",
    description: "Incident response plan documented and tested",
    cdtFields: ["incident_response_plan_exists", "days_since_irt_test"],
  },
  "SOC2-CC7.5": {
    framework: "SOC2",
    key: "breach_disclosure_procedure",
    description: "Breach notification/disclosure procedure documented",
    cdtFields: ["breach_disclosure_procedure_exists"],
  },
  // GDPR legal basis controls
  "GDPR-Art.5(1)(a)": {
    framework: "GDPR",
    key: "data_processing_lawful",
    description: "Lawful basis for data processing documented",
    cdtFields: ["data_processing_lawful"],
  },
  "GDPR-Art.5(1)(b)": {
    framework: "GDPR",
    key: "purpose_limitation_enforced",
    description: "Purpose limitation controls in place",
    cdtFields: ["purpose_limitation_enforced"],
  },
  "GDPR-Art.5(1)(c)": {
    framework: "GDPR",
    key: "data_minimisation_enforced",
    description: "Data minimisation controls in place",
    cdtFields: ["data_minimisation_enforced"],
  },
  "GDPR-Art.5(1)(d)": {
    framework: "GDPR",
    key: "data_accuracy_controls",
    description: "Data accuracy and integrity controls in place",
    cdtFields: ["data_accuracy_controls"],
  },
  // HIPAA
  "HIPAA-164.312(a)(2)(i)": {
    framework: "HIPAA",
    key: "emergency_access_procedure",
    description: "Emergency access procedure for ePHI documented",
    cdtFields: ["emergency_access_procedure_exists"],
  },
};

/** GET — list attestations for the tenant */
export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const framework = url.searchParams.get("framework");
  const status = url.searchParams.get("status") || "active";

  let query = `SELECT * FROM compliance_attestations WHERE tenant_id = ?`;
  const params: any[] = [user.tenantId];

  if (framework) {
    query += ` AND framework = ?`;
    params.push(framework);
  }
  if (status !== "all") {
    query += ` AND status = ?`;
    params.push(status);
  }
  query += ` ORDER BY updated_at DESC`;

  try {
    const { results } = await db
      .prepare(query)
      .bind(...params)
      .all();
    const attestations = (results ?? []).map((r: any) => ({
      id: r.id,
      framework: r.framework,
      controlId: r.control_id,
      attestationKey: r.attestation_key,
      status: r.status,
      attestedBy: r.attested_by,
      evidenceSummary: r.evidence_summary,
      metadata: r.metadata ? JSON.parse(r.metadata) : {},
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return json({
      attestations,
      availableControls: ATTESTABLE_CONTROLS,
      meta: { total: attestations.length },
    });
  } catch {
    return json({ attestations: [], availableControls: ATTESTABLE_CONTROLS, meta: { total: 0 } });
  }
};

/** POST — create or update an attestation */
export const POST: RequestHandler = async ({ locals, platform, request }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json();
  const { controlId, evidenceSummary, expiresAt, metadata } = body;

  if (!controlId || typeof controlId !== "string") {
    return json({ error: "controlId is required" }, { status: 400 });
  }

  const controlDef = ATTESTABLE_CONTROLS[controlId];
  if (!controlDef) {
    return json(
      {
        error: `Control ${controlId} is not attestable`,
        availableControls: Object.keys(ATTESTABLE_CONTROLS),
      },
      { status: 400 },
    );
  }

  if (
    !evidenceSummary ||
    typeof evidenceSummary !== "string" ||
    evidenceSummary.trim().length < 10
  ) {
    return json({ error: "evidenceSummary must be at least 10 characters" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Upsert attestation (one per tenant + control + key)
    await db
      .prepare(
        `INSERT INTO compliance_attestations
         (id, tenant_id, framework, control_id, attestation_key, status, attested_by, evidence_summary, metadata, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
         ON CONFLICT(tenant_id, control_id, attestation_key) DO UPDATE SET
           status = 'active',
           attested_by = excluded.attested_by,
           evidence_summary = excluded.evidence_summary,
           metadata = excluded.metadata,
           expires_at = excluded.expires_at,
           updated_at = excluded.updated_at`,
      )
      .bind(
        id,
        user.tenantId,
        controlDef.framework,
        controlId,
        controlDef.key,
        user.email || user.userId,
        evidenceSummary.trim(),
        JSON.stringify(metadata || {}),
        expiresAt || null,
        now,
        now,
      )
      .run();

    // Also write a compliance_evidence row so the evidence feed and scoring pick it up
    const evidenceId = `attestation-${user.tenantId}-${controlId}`.replace(/[^a-zA-Z0-9-_.]/g, "_");
    await db
      .prepare(
        `INSERT INTO compliance_evidence
         (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, 'attestation', 'manual', ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           metadata = excluded.metadata,
           actor = excluded.actor,
           subject = excluded.subject`,
      )
      .bind(
        evidenceId,
        user.tenantId,
        controlDef.framework,
        controlId,
        controlDef.description,
        `attestation:${controlDef.key}`,
        user.email || user.userId,
        evidenceSummary.trim(),
        JSON.stringify({
          impact: "positive",
          eventType: `attestation:${controlDef.key}`,
          reasoning: evidenceSummary.trim(),
          confidence: 0.85,
          attestationId: id,
          cdtFields: controlDef.cdtFields,
          decision: "pass",
        }),
        now,
      )
      .run();

    // Audit log
    try {
      await writeAudit(db, {
        tenantId: user.tenantId,
        actorUserId: user.userId,
        action: "compliance.attestation_created",
        resourceType: "compliance_attestation",
        resourceId: controlId,
        details: {
          framework: controlDef.framework,
          controlId,
          attestationKey: controlDef.key,
          evidenceSummary: evidenceSummary.trim().slice(0, 200),
        },
      });
    } catch {
      /* non-fatal */
    }

    return json({ id, status: "active", controlId, framework: controlDef.framework });
  } catch (err: any) {
    return json({ error: "Failed to save attestation", detail: err?.message }, { status: 500 });
  }
};

/** DELETE — revoke an attestation */
export const DELETE: RequestHandler = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const attestationId = url.searchParams.get("id");
  if (!attestationId) return json({ error: "id is required" }, { status: 400 });

  try {
    await db
      .prepare(
        `UPDATE compliance_attestations SET status = 'revoked', updated_at = datetime('now')
         WHERE id = ? AND tenant_id = ?`,
      )
      .bind(attestationId, user.tenantId)
      .run();

    return json({ success: true });
  } catch (err: any) {
    return json({ error: "Failed to revoke attestation", detail: err?.message }, { status: 500 });
  }
};
