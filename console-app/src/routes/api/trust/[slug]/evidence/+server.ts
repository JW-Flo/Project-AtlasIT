/**
 * Public Trust Center evidence provenance API — no auth required.
 * Returns per-control evidence items showing what operation generated
 * each piece of evidence, when, and whether it's still fresh.
 *
 * GET /api/trust/:slug/evidence?control=CC6.1&framework=SOC2
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const FRESHNESS_THRESHOLD_MS = 30 * 86_400_000; // 30 days

interface EvidenceItem {
  id: string;
  controlId: string;
  evidenceType: string;
  source: string;
  actor: string;
  subject: string | null;
  status: string | null;
  createdAt: string;
  isFresh: boolean;
  ageDescription: string;
}

function describeAge(createdAt: string): string {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ageMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export const GET: RequestHandler = async ({ params, url, platform }) => {
  const slug = params.slug;
  if (!slug) return json({ error: "slug is required" }, { status: 400 });

  const controlId = url.searchParams.get("control");
  const framework = url.searchParams.get("framework");

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Service unavailable" }, { status: 503 });

  // Resolve tenant by slug
  const tenant = await db
    .prepare(`SELECT id FROM tenants WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ id: string }>();

  if (!tenant) return json({ error: "Not found" }, { status: 404 });
  const tenantId = tenant.id;

  // Check if trust center is public
  const pubPref = await db
    .prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_public'`,
    )
    .bind(tenantId)
    .first<{ value: string }>();

  if (pubPref?.value !== "true") {
    return json({ error: "Not found" }, { status: 404 });
  }

  // Check per-control visibility (if configured)
  let controlVisibility: Record<string, string> = {};
  try {
    const visRow = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'trust_center_control_visibility'`,
      )
      .bind(tenantId)
      .first<{ value: string }>();
    if (visRow?.value) controlVisibility = JSON.parse(visRow.value);
  } catch {
    // no per-control visibility configured — all public by default
  }

  // If requesting a specific control, check its visibility
  if (controlId && controlVisibility[controlId] === "private") {
    return json({ error: "Not found" }, { status: 404 });
  }

  // Build query for evidence
  let query = `SELECT id, control_id, evidence_type, source, actor, subject, metadata, created_at
     FROM compliance_evidence
     WHERE tenant_id = ?`;
  const bindings: unknown[] = [tenantId];

  if (controlId) {
    query += ` AND control_id = ?`;
    bindings.push(controlId);
  }
  if (framework) {
    query += ` AND framework = ?`;
    bindings.push(framework);
  }

  query += ` ORDER BY created_at DESC LIMIT 100`;

  const { results: rows } = await db
    .prepare(query)
    .bind(...bindings)
    .all<{
      id: string;
      control_id: string;
      evidence_type: string;
      source: string;
      actor: string;
      subject: string | null;
      metadata: string | null;
      created_at: string;
    }>();

  const now = Date.now();
  const evidence: EvidenceItem[] = (rows ?? [])
    .filter((row) => {
      // Filter out controls marked as private
      const vis = controlVisibility[row.control_id];
      return vis !== "private";
    })
    .map((row) => {
      let status: string | null = null;
      try {
        if (row.metadata) {
          const meta = JSON.parse(row.metadata);
          if (meta.status) status = meta.status;
        }
      } catch {
        // ignore malformed metadata
      }

      const ageMs = now - new Date(row.created_at).getTime();

      return {
        id: row.id,
        controlId: row.control_id,
        evidenceType: row.evidence_type,
        source: row.source,
        actor: row.actor,
        subject: row.subject,
        status,
        createdAt: row.created_at,
        isFresh: ageMs <= FRESHNESS_THRESHOLD_MS,
        ageDescription: describeAge(row.created_at),
      };
    });

  return json({ evidence, total: evidence.length });
};
