import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";

/**
 * Attestation definitions — maps each attestable control to its CDT payload
 * field(s) and metadata. Used to validate POST requests and to build the
 * CDT payload during evaluation.
 */
interface AttestableControl {
  framework: string;
  key: string;
  description: string;
  cdtFields: string[];
  evidenceGuidance: {
    summary: string;
    recommendedDocuments: string[];
    acceptableFormats: string[];
    tips: string;
  };
}

const ATTESTABLE_CONTROLS: Record<string, AttestableControl> = {
  // SOC2 governance controls
  "SOC2-CC1.2": {
    framework: "SOC2",
    key: "board_oversight_documented",
    description: "Board and management oversight documented",
    cdtFields: ["board_oversight_documented"],
    evidenceGuidance: {
      summary:
        "Demonstrate that the board or senior leadership actively oversees the information security program.",
      recommendedDocuments: [
        "Board meeting minutes referencing security program review",
        "Management committee charter for information security",
        "Signed executive acknowledgment of security responsibilities",
        "Annual security program review presentation or report",
        "Board resolution approving the security/risk strategy",
      ],
      acceptableFormats: ["PDF", "DOCX", "signed scans", "meeting transcript exports"],
      tips: "Include the date, attendees, and specific agenda items related to security oversight. Quarterly or annual review cadence is typical.",
    },
  },
  "SOC2-CC1.3": {
    framework: "SOC2",
    key: "org_chart_published",
    description: "Organizational chart published and current",
    cdtFields: ["org_chart_published"],
    evidenceGuidance: {
      summary:
        "Show that an organizational chart exists, is current, and clearly defines reporting lines for security roles.",
      recommendedDocuments: [
        "Current organizational chart with security/IT reporting lines",
        "RACI matrix for security functions",
        "Job descriptions for CISO, Security Lead, or equivalent roles",
        "Internal wiki or HR system screenshot showing the published chart",
      ],
      acceptableFormats: ["PDF", "PNG/SVG diagram", "HR system export", "Visio/Lucidchart export"],
      tips: "Ensure the chart includes the person responsible for security (even if part-time) and shows the reporting path to executive leadership.",
    },
  },
  "SOC2-CC3.2": {
    framework: "SOC2",
    key: "vendor_risk_reviewed",
    description: "Vendor/third-party risk assessment completed",
    cdtFields: ["vendor_risk_reviewed"],
    evidenceGuidance: {
      summary:
        "Demonstrate that third-party vendors with access to sensitive data have been risk-assessed.",
      recommendedDocuments: [
        "Vendor risk assessment register or spreadsheet",
        "Third-party security questionnaire results (SIG, CAIQ, or custom)",
        "Vendor SOC 2 / ISO 27001 reports on file",
        "Vendor risk review meeting minutes or approval records",
        "Data processing agreements (DPAs) for critical vendors",
      ],
      acceptableFormats: ["PDF", "XLSX", "CSV export from GRC tool", "signed agreements"],
      tips: "Focus on vendors that process, store, or have access to customer data. Include the assessment date and risk rating for each vendor.",
    },
  },
  "SOC2-CC9.1": {
    framework: "SOC2",
    key: "unmitigated_high_risks",
    description: "Risk register reviewed — unmitigated high risks count",
    cdtFields: ["unmitigated_high_risks"],
    evidenceGuidance: {
      summary:
        "Provide the current risk register showing all identified risks, their ratings, and mitigation status.",
      recommendedDocuments: [
        "Risk register export showing risk ID, description, likelihood, impact, and status",
        "Risk review meeting minutes with sign-off",
        "Risk treatment plan for any high/critical items",
        "Exception approvals for accepted risks",
      ],
      acceptableFormats: ["PDF", "XLSX", "CSV export from GRC tool"],
      tips: "Enter the count of unmitigated high/critical risks in the numeric field. A count of 0 is ideal. Include evidence that the register was reviewed within the last quarter.",
    },
  },
  "SOC2-CC9.2": {
    framework: "SOC2",
    key: "bcr_plan",
    description: "Business continuity/disaster recovery plan and testing",
    cdtFields: ["bcr_plan_exists", "days_since_bcr_test"],
    evidenceGuidance: {
      summary:
        "Demonstrate that a BC/DR plan exists and has been tested within an acceptable timeframe.",
      recommendedDocuments: [
        "Business continuity plan (BCP) document with version date",
        "Disaster recovery plan (DRP) with RTOs and RPOs defined",
        "BC/DR test report or tabletop exercise summary",
        "Post-test lessons learned and remediation actions",
        "Executive sign-off on the BC/DR plan",
      ],
      acceptableFormats: ["PDF", "DOCX", "test result exports"],
      tips: "Enter the number of days since the last BC/DR test. Annual testing (≤365 days) is the minimum expectation; quarterly is better. Include test scope, participants, and outcomes.",
    },
  },
  "SOC2-CC7.3": {
    framework: "SOC2",
    key: "incident_response_plan",
    description: "Incident response plan documented and tested",
    cdtFields: ["incident_response_plan_exists", "days_since_irt_test"],
    evidenceGuidance: {
      summary:
        "Show that an incident response plan exists, is current, and has been tested via drill or tabletop exercise.",
      recommendedDocuments: [
        "Incident response plan (IRP) with roles, escalation paths, and playbooks",
        "Tabletop exercise report or IR drill after-action report",
        "Communication templates for breach notification",
        "On-call rotation schedule and escalation procedures",
        "Post-incident review (PIR) from a recent real or simulated incident",
      ],
      acceptableFormats: ["PDF", "DOCX", "wiki page export", "PagerDuty/Opsgenie config export"],
      tips: "Enter the number of days since the last IR test or drill. Include the scenario tested, participants, and any gaps identified. Annual testing is the minimum.",
    },
  },
  "SOC2-CC7.5": {
    framework: "SOC2",
    key: "breach_disclosure_procedure",
    description: "Breach notification/disclosure procedure documented",
    cdtFields: ["breach_disclosure_procedure_exists"],
    evidenceGuidance: {
      summary:
        "Demonstrate that a formal breach notification procedure exists covering regulatory and customer notification requirements.",
      recommendedDocuments: [
        "Breach notification policy or procedure document",
        "Notification timeline matrix (who to notify, within what timeframe, per regulation)",
        "Template notification letters (regulator, affected individuals, customers)",
        "Contact list for regulators (e.g., DPA, HHS for HIPAA, state AG offices)",
        "Evidence of employee training on breach reporting",
      ],
      acceptableFormats: ["PDF", "DOCX", "policy management system export"],
      tips: "Cover GDPR 72-hour requirement, state breach notification laws, and any contractual SLAs with customers. Include the internal escalation path from detection to disclosure.",
    },
  },
  // GDPR legal basis controls
  "GDPR-Art.5(1)(a)": {
    framework: "GDPR",
    key: "data_processing_lawful",
    description: "Lawful basis for data processing documented",
    cdtFields: ["data_processing_lawful"],
    evidenceGuidance: {
      summary:
        "Document the lawful basis (consent, contract, legitimate interest, etc.) for each category of personal data processing.",
      recommendedDocuments: [
        "Record of Processing Activities (ROPA / Article 30 register)",
        "Lawful basis assessment for each processing activity",
        "Consent management records and opt-in mechanism screenshots",
        "Legitimate interest assessments (LIAs) where applicable",
        "Data processing agreements (DPAs) with processors",
      ],
      acceptableFormats: ["PDF", "XLSX", "CSV", "OneTrust/Cookiebot export"],
      tips: "Map each processing activity to one of the six GDPR lawful bases. Include the date of the assessment and who approved it.",
    },
  },
  "GDPR-Art.5(1)(b)": {
    framework: "GDPR",
    key: "purpose_limitation_enforced",
    description: "Purpose limitation controls in place",
    cdtFields: ["purpose_limitation_enforced"],
    evidenceGuidance: {
      summary:
        "Show that personal data is collected for specified, explicit purposes and not further processed in an incompatible manner.",
      recommendedDocuments: [
        "Privacy notice(s) listing each processing purpose",
        "Data flow diagrams showing purpose-bound data paths",
        "Access control policies limiting data use to stated purposes",
        "Change management records for any new processing purposes",
        "DPIA (Data Protection Impact Assessment) for high-risk processing",
      ],
      acceptableFormats: ["PDF", "DOCX", "data flow diagrams (PNG/SVG)", "DPIA exports"],
      tips: "Demonstrate that new processing purposes go through a review process. Show that privacy notices are updated when purposes change.",
    },
  },
  "GDPR-Art.5(1)(c)": {
    framework: "GDPR",
    key: "data_minimisation_enforced",
    description: "Data minimisation controls in place",
    cdtFields: ["data_minimisation_enforced"],
    evidenceGuidance: {
      summary:
        "Demonstrate that only necessary personal data is collected and retained for each processing purpose.",
      recommendedDocuments: [
        "Data retention schedule with justification per data category",
        "Form/intake audit showing only required fields are collected",
        "Database schema review confirming no unnecessary PII columns",
        "Automated data purge/anonymization job evidence (logs, configs)",
        "Data minimisation review checklist for new features or forms",
      ],
      acceptableFormats: ["PDF", "XLSX", "screenshots", "cron job/scheduler configs"],
      tips: "Include evidence of periodic reviews. Show that retention periods are enforced and that data is deleted or anonymized when no longer needed.",
    },
  },
  "GDPR-Art.5(1)(d)": {
    framework: "GDPR",
    key: "data_accuracy_controls",
    description: "Data accuracy and integrity controls in place",
    cdtFields: ["data_accuracy_controls"],
    evidenceGuidance: {
      summary:
        "Show controls ensuring personal data is accurate, up-to-date, and correctable by data subjects.",
      recommendedDocuments: [
        "Self-service profile/account update feature documentation or screenshots",
        "Data quality validation rules (input validation, deduplication)",
        "Process for handling data correction requests (DSAR procedure)",
        "Periodic data quality audit results or reports",
        "Sync/reconciliation logs from authoritative sources (HR system, IdP)",
      ],
      acceptableFormats: ["PDF", "screenshots", "audit log exports", "DSAR process docs"],
      tips: "Demonstrate that users can update their own data and that correction requests are processed promptly. Show that data from authoritative sources is regularly synced.",
    },
  },
  // HIPAA
  "HIPAA-164.312(a)(2)(i)": {
    framework: "HIPAA",
    key: "emergency_access_procedure",
    description: "Emergency access procedure for ePHI documented",
    cdtFields: ["emergency_access_procedure_exists"],
    evidenceGuidance: {
      summary:
        "Document the procedure for obtaining emergency access to ePHI when normal access controls are unavailable.",
      recommendedDocuments: [
        "Emergency access (break-glass) procedure document",
        "Break-glass account inventory with access scope and audit requirements",
        "Emergency access request and approval workflow documentation",
        "Post-emergency access review procedure and sample audit log",
        "Training records showing staff awareness of emergency procedures",
      ],
      acceptableFormats: ["PDF", "DOCX", "runbook exports", "ticketing system screenshots"],
      tips: "Include the specific conditions that trigger emergency access, the approval chain (even if verbal with post-hoc documentation), and mandatory post-access audit review within 24-48 hours.",
    },
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
