/**
 * Compliance evidence package export — generates a JSON/CSV auditor bundle
 * per framework with content hash for tamper detection.
 *
 * GET /api/trust/:slug/export?framework=SOC2&format=json|csv
 *
 * Accepts optional ?token= for NDA-gated access.
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface ExportControl {
  controlId: string;
  controlName: string;
  status: string;
  evidenceCount: number;
  lastEvidenceAt: string | null;
  evidence: Array<{
    evidenceType: string;
    source: string;
    actor: string;
    status: string | null;
    createdAt: string;
  }>;
}

interface ExportPackage {
  tenant: string;
  framework: string;
  generatedAt: string;
  score: number;
  grade: string;
  controls: ExportControl[];
  contentHash: string;
}

function computeGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

async function sha256Hex(data: string): Promise<string> {
  const buffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function controlsToCsv(pkg: ExportPackage): string {
  const lines: string[] = [
    `# ${pkg.tenant} — ${pkg.framework} Compliance Report`,
    `# Generated: ${pkg.generatedAt}`,
    `# Score: ${pkg.score}% (${pkg.grade})`,
    `# Content Hash: ${pkg.contentHash}`,
    "",
    "Control ID,Control Name,Status,Evidence Count,Last Evidence,Evidence Type,Source,Actor,Evidence Status,Evidence Date",
  ];

  for (const ctrl of pkg.controls) {
    if (ctrl.evidence.length === 0) {
      lines.push(
        [
          csvEscape(ctrl.controlId),
          csvEscape(ctrl.controlName),
          ctrl.status,
          String(ctrl.evidenceCount),
          ctrl.lastEvidenceAt ?? "",
          "",
          "",
          "",
          "",
          "",
        ].join(","),
      );
    } else {
      for (const ev of ctrl.evidence) {
        lines.push(
          [
            csvEscape(ctrl.controlId),
            csvEscape(ctrl.controlName),
            ctrl.status,
            String(ctrl.evidenceCount),
            ctrl.lastEvidenceAt ?? "",
            ev.evidenceType,
            ev.source,
            ev.actor,
            ev.status ?? "",
            ev.createdAt,
          ].join(","),
        );
      }
    }
  }

  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const GET: RequestHandler = async ({ params, url, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });

  const framework = url.searchParams.get("framework");
  if (!framework) return json({ error: "framework query param required" }, { status: 400 });

  const format = url.searchParams.get("format") ?? "json";
  const accessToken = url.searchParams.get("token");

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  // Resolve tenant
  const tenant = await db
    .prepare(`SELECT id, name FROM tenants WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ id: string; name: string }>();
  if (!tenant) return json({ error: "Not found" }, { status: 404 });
  const tenantId = tenant.id;

  // Check trust center is public
  const pubPref = await db
    .prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`,
    )
    .bind(tenantId)
    .first<{ value: string }>();
  if (pubPref?.value !== "true") {
    return json({ error: "Not found" }, { status: 404 });
  }

  // If access token provided, validate it
  if (accessToken) {
    const tokenRow = await db
      .prepare(
        `SELECT id, expires_at FROM trust_access_requests
         WHERE tenant_id = ? AND access_token = ? AND status = 'approved' LIMIT 1`,
      )
      .bind(tenantId, accessToken)
      .first<{ id: string; expires_at: string }>();

    if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
      return json({ error: "Invalid or expired access token" }, { status: 403 });
    }
  }

  // Fetch score
  const scoreRow = await db
    .prepare(`SELECT score FROM compliance_scores WHERE tenant_id = ? AND framework = ? LIMIT 1`)
    .bind(tenantId, framework)
    .first<{ score: number }>();
  const score = scoreRow?.score ?? 0;

  // Fetch controls with evidence
  const { results: evidenceRows } = await db
    .prepare(
      `SELECT control_id, control_name, evidence_type, source, actor, metadata, created_at
       FROM compliance_evidence
       WHERE tenant_id = ? AND framework = ?
       ORDER BY control_id, created_at DESC`,
    )
    .bind(tenantId, framework)
    .all<{
      control_id: string;
      control_name: string | null;
      evidence_type: string;
      source: string;
      actor: string;
      metadata: string | null;
      created_at: string;
    }>();

  // Group evidence by control
  const controlMap = new Map<string, ExportControl>();
  const now = Date.now();
  const thresholdMs = 30 * 86_400_000;

  for (const row of evidenceRows ?? []) {
    if (!controlMap.has(row.control_id)) {
      controlMap.set(row.control_id, {
        controlId: row.control_id,
        controlName: row.control_name ?? row.control_id,
        status: "not_started",
        evidenceCount: 0,
        lastEvidenceAt: null,
        evidence: [],
      });
    }

    const ctrl = controlMap.get(row.control_id)!;
    ctrl.evidenceCount++;
    if (!ctrl.lastEvidenceAt || row.created_at > ctrl.lastEvidenceAt) {
      ctrl.lastEvidenceAt = row.created_at;
    }

    let evStatus: string | null = null;
    try {
      if (row.metadata) {
        const meta = JSON.parse(row.metadata);
        if (meta.status) evStatus = meta.status;
      }
    } catch {
      // ignore
    }

    ctrl.evidence.push({
      evidenceType: row.evidence_type,
      source: row.source,
      actor: row.actor,
      status: evStatus,
      createdAt: row.created_at,
    });
  }

  // Derive status for each control
  for (const ctrl of controlMap.values()) {
    if (ctrl.evidenceCount > 0 && ctrl.lastEvidenceAt) {
      const ageMs = now - new Date(ctrl.lastEvidenceAt).getTime();
      ctrl.status = ageMs <= thresholdMs ? "implemented" : "in_progress";
    }
  }

  const controls = Array.from(controlMap.values()).sort((a, b) =>
    a.controlId.localeCompare(b.controlId),
  );

  const generatedAt = new Date().toISOString();
  const canonicalData = JSON.stringify({
    tenant: tenant.name,
    framework,
    generatedAt,
    score,
    controls,
  });
  const contentHash = await sha256Hex(canonicalData);

  const pkg: ExportPackage = {
    tenant: tenant.name,
    framework,
    generatedAt,
    score,
    grade: computeGrade(score),
    controls,
    contentHash,
  };

  if (format === "csv") {
    const csv = controlsToCsv(pkg);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${slug}-${framework}-${generatedAt.slice(0, 10)}.csv"`,
      },
    });
  }

  return json(pkg);
};
