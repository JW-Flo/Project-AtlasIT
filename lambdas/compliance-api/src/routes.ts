/**
 * compliance-api Lambda routes
 *
 * Ported from compliance-worker/src/ (Cloudflare Worker).
 * Uses bootstrap() service container instead of Cloudflare env bindings.
 *
 * Key translations:
 *   env.ATLAS_SHARED_DB.prepare(...)  → pg pool (direct SQL)
 *   env.EVIDENCE_BUCKET.put(...)      → svc.evidenceRepo.put(...)
 *   env.EVIDENCE_BUCKET.get(...)      → svc.evidenceRepo.get(...)
 *   env.KV_CACHE.get/put(...)         → svc.cacheRepo.get/set(...)
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";
import { CONTROL_REGISTRY, listControls } from "./cdt/registry.js";
import type { CdtEvent } from "./cdt/models.js";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;

const svc = bootstrap();

let _pool: pg.Pool | null = null;
function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false },
    });
    // Eagerly connect on module init to avoid cold-start PG latency on first request
    _pool
      .connect()
      .then((c) => {
        c.release();
      })
      .catch(() => {});
  }
  return _pool;
}

// Trigger pool init at module load (Lambda reuses across warm invocations)
getPool();

// Best-effort event publisher — writes events row + enqueues SQS for orchestrator.
async function publishEvent(
  tenantId: string,
  type: string,
  source: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.query(
      `INSERT INTO events (id, tenant_id, type, source, payload, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
      [id, tenantId, type, source, JSON.stringify(payload)],
    );
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: id,
      stepIndex: 0,
      action: "process_event",
      payload: { eventId: id, type, source, data: payload },
    });
  } catch (err) {
    console.warn("[compliance-api] publishEvent failed", {
      type,
      source,
      error: (err as Error).message,
    });
  }
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
} as const;

const SNAPSHOT_TTL_SECONDS = 300;

// Evidence thresholds for compliance status determination
const MIN_EVIDENCE_FOR_VERIFIED = 3;
const MIN_EVIDENCE_FOR_IMPLEMENTED = 1;

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function fail(status: number, message: string, code = "ERROR"): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify({ status: "error", code, message, timestamp: new Date().toISOString() }),
  };
}

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Compute SHA-256 hex hash of canonical JSON content. */
function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Render a shields.io-style SVG badge: "[label] | [value]".
 * Sized + styled to match the de facto README-badge convention so it drops
 * into GitHub READMEs, marketing sites, and Slack unfurls with no fuss.
 */
function renderBadge(
  label: string,
  value: string,
  valueBg: string,
  style: "flat" | "for-the-badge",
): string {
  // Approximate char widths in Verdana 11px to size the pill correctly.
  // Real text measurement would need a font metrics table; this is close enough.
  const charWidth = 7;
  const padding = 12;
  const labelW = label.length * charWidth + padding;
  const valueW = value.length * charWidth + padding;
  const totalW = labelW + valueW;
  const h = style === "for-the-badge" ? 28 : 20;
  const fontSize = style === "for-the-badge" ? 10 : 11;
  const textTransform = style === "for-the-badge" ? 'letter-spacing="1.2" font-weight="bold"' : "";
  const displayLabel = style === "for-the-badge" ? label.toUpperCase() : label;
  const displayValue = style === "for-the-badge" ? value.toUpperCase() : value;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${h}" role="img" aria-label="${escapeXml(label)}: ${escapeXml(value)}">
  <title>${escapeXml(label)}: ${escapeXml(value)}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalW}" height="${h}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${h}" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="${h}" fill="${valueBg}"/>
    <rect width="${totalW}" height="${h}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="${fontSize}" ${textTransform}>
    <text x="${labelW / 2}" y="${h / 2 + fontSize / 3}" fill="#010101" fill-opacity=".3">${escapeXml(displayLabel)}</text>
    <text x="${labelW / 2}" y="${h / 2 + fontSize / 3 - 1}">${escapeXml(displayLabel)}</text>
    <text x="${labelW + valueW / 2}" y="${h / 2 + fontSize / 3}" fill="#010101" fill-opacity=".3">${escapeXml(displayValue)}</text>
    <text x="${labelW + valueW / 2}" y="${h / 2 + fontSize / 3 - 1}">${escapeXml(displayValue)}</text>
  </g>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Render the auditor-ready HTML bundle. Print-friendly CSS with page breaks
 * between sections. Black-and-white readable. Content-hash footer for tamper
 * evidence — auditors can re-fetch and recompute to verify integrity.
 */
interface AuditBundle {
  tenant: { id: string; name: string; slug: string; industry: string | null; size: string | null };
  framework: string;
  packName: string;
  score: number;
  controlsCount: number;
  passCount: number;
  failCount: number;
  unknownCount: number;
  lastEvaluatedAt: string | null;
  sinceDate: string;
  generatedAt: string;
  controls: Array<Record<string, unknown>>;
  evidence: Array<Record<string, unknown>>;
  attestations: Array<Record<string, unknown>>;
  policies: Array<Record<string, unknown>>;
  incidents: Array<Record<string, unknown>>;
  auditLog: Array<Record<string, unknown>>;
}

function renderAuditPackageHtml(b: AuditBundle, contentHash: string): string {
  const esc = (s: unknown): string =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  const date = (s: unknown): string => (s ? new Date(s as string).toLocaleString() : "—");
  const stateStyle = (s: unknown): string => {
    if (s === "pass") return "background:#dcfce7;color:#166534";
    if (s === "fail") return "background:#fee2e2;color:#991b1b";
    return "background:#f3f4f6;color:#4b5563";
  };

  const controlsByState = {
    pass: b.controls.filter((c) => c.state === "pass"),
    fail: b.controls.filter((c) => c.state === "fail"),
    unknown: b.controls.filter((c) => c.state === "unknown"),
  };
  const evidenceByControl = new Map<string, typeof b.evidence>();
  for (const e of b.evidence) {
    const k = String(e.controlId ?? "unmapped");
    if (!evidenceByControl.has(k)) evidenceByControl.set(k, []);
    evidenceByControl.get(k)!.push(e);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(b.tenant.name)} — ${esc(b.framework)} Audit Package</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #111; max-width: 1000px; margin: 2em auto; padding: 0 2em; line-height: 1.5; }
  h1 { font-size: 2em; margin: 0 0 0.2em; }
  h2 { font-size: 1.4em; margin: 1.6em 0 0.6em; border-bottom: 2px solid #111; padding-bottom: 0.2em; }
  h3 { font-size: 1.1em; margin: 1em 0 0.3em; }
  .meta { color: #555; font-size: 0.9em; }
  .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1em; margin: 1em 0 2em; }
  .kpi { padding: 1em; border: 1px solid #ccc; border-radius: 6px; }
  .kpi .num { font-size: 2em; font-weight: bold; margin: 0.2em 0; }
  .kpi .label { font-size: 0.75em; text-transform: uppercase; color: #666; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin: 0.8em 0; font-size: 0.85em; }
  th, td { text-align: left; padding: 0.4em 0.6em; border: 1px solid #ddd; vertical-align: top; }
  th { background: #f8f8f8; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.75em; font-weight: 600; text-transform: uppercase; }
  .score-big { font-size: 3em; font-weight: bold; }
  .section { page-break-inside: auto; }
  code { font-family: "Courier New", monospace; font-size: 0.9em; background: #f5f5f5; padding: 1px 4px; border-radius: 3px; }
  .rationale { color: #555; font-size: 0.8em; margin-top: 0.3em; font-style: italic; }
  .cover { min-height: 60vh; display: flex; flex-direction: column; justify-content: center; border-bottom: 3px solid #111; margin-bottom: 2em; page-break-after: always; }
  .footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #ddd; font-size: 0.75em; color: #666; }
  @media print {
    body { margin: 0; padding: 0.5in; max-width: none; font-size: 10pt; }
    h2 { page-break-before: auto; page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    .cover { page-break-after: always; }
    .no-print { display: none; }
  }
  .print-button { position: fixed; top: 1em; right: 1em; padding: 0.6em 1.2em; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 1em; cursor: pointer; }
</style>
</head>
<body>

<button class="print-button no-print" onclick="window.print()">🖨 Save as PDF</button>

<div class="cover">
  <div class="meta">AtlasIT Compliance Audit Package</div>
  <h1>${esc(b.tenant.name)}</h1>
  <div class="meta">
    ${esc(b.tenant.industry ?? "")}${b.tenant.size ? " · " + esc(b.tenant.size) + " employees" : ""}<br>
    Framework: <strong>${esc(b.packName)}</strong> (${esc(b.framework)})<br>
    Generated: ${date(b.generatedAt)}<br>
    Evidence window: since ${date(b.sinceDate)}
  </div>
  <div style="margin-top: 2em;">
    <div class="score-big">${b.score}%</div>
    <div class="meta">Continuous compliance score (pass / total controls)</div>
  </div>
  <p class="meta" style="margin-top: 2em; max-width: 700px;">
    All scores in this package are generated from live operational evidence by AtlasIT's
    CDT rule engine, not from self-attestation. Re-fetching this report with the same
    parameters at a later time may yield different scores as controls degrade or improve.
  </p>
</div>

<h2>Executive Summary</h2>
<div class="kpi-row">
  <div class="kpi"><div class="label">Overall Score</div><div class="num">${b.score}%</div></div>
  <div class="kpi"><div class="label">Passing</div><div class="num" style="color:#16a34a">${b.passCount}</div></div>
  <div class="kpi"><div class="label">Failing</div><div class="num" style="color:#dc2626">${b.failCount}</div></div>
  <div class="kpi"><div class="label">Unknown</div><div class="num" style="color:#6b7280">${b.unknownCount}</div></div>
</div>
<p class="meta">Last evaluated: ${date(b.lastEvaluatedAt)}</p>

<div class="section">
<h2>Control Status (${b.controls.length})</h2>
<table>
<thead><tr><th>Control ID</th><th>Title</th><th>State</th><th>Evidence</th><th>Last Evaluated</th></tr></thead>
<tbody>
${b.controls
  .map(
    (c) => `
  <tr>
    <td><code>${esc(c.controlId)}</code></td>
    <td>${esc(c.title)}
      ${Array.isArray(c.rationale) && (c.rationale as string[]).length > 0 ? `<div class="rationale">${esc((c.rationale as string[])[0])}</div>` : ""}
    </td>
    <td><span class="badge" style="${stateStyle(c.state)}">${esc(c.state)}</span></td>
    <td>${c.evidenceSampleSize ?? 0}</td>
    <td>${date(c.evaluatedAt)}</td>
  </tr>`,
  )
  .join("")}
</tbody></table>
</div>

<div class="section">
<h2>Attestations (${b.attestations.length})</h2>
${
  b.attestations.length === 0
    ? '<p class="meta">No attestations signed for this framework.</p>'
    : `
<table>
<thead><tr><th>Control</th><th>Key</th><th>Status</th><th>Signed By</th><th>Signed At</th><th>Statement</th></tr></thead>
<tbody>
${b.attestations
  .map(
    (a) => `
  <tr>
    <td><code>${esc(a.controlId)}</code></td>
    <td><code>${esc(a.attestationKey)}</code></td>
    <td><span class="badge" style="${a.status === "active" ? "background:#dcfce7;color:#166534" : "background:#fee2e2;color:#991b1b"}">${esc(a.status)}</span></td>
    <td>${esc(a.attestedByName ?? a.attestedByEmail)}</td>
    <td>${date(a.attestedAt)}</td>
    <td style="max-width:400px">${esc(a.statement)}
      ${a.revocationReason ? `<div class="rationale">Revoked: ${esc(a.revocationReason)}</div>` : ""}
    </td>
  </tr>`,
  )
  .join("")}
</tbody></table>`
}
</div>

<div class="section">
<h2>Policies (${b.policies.length})</h2>
${
  b.policies.length === 0
    ? '<p class="meta">No policies matching this framework.</p>'
    : `
<table>
<thead><tr><th>Name</th><th>Category</th><th>Version</th><th>Status</th><th>Published</th><th>Acks</th></tr></thead>
<tbody>
${b.policies
  .map(
    (p) => `
  <tr>
    <td>${esc(p.name)}</td>
    <td>${esc(p.category)}</td>
    <td>${esc(p.version)}</td>
    <td><span class="badge" style="background:#f3f4f6;color:#374151">${esc(p.status)}</span></td>
    <td>${date(p.publishedAt)}</td>
    <td>${p.ackCount ?? 0}</td>
  </tr>`,
  )
  .join("")}
</tbody></table>`
}
</div>

<div class="section">
<h2>Evidence Sample — ${b.evidence.length} records since ${date(b.sinceDate)}</h2>
${
  b.evidence.length === 0
    ? '<p class="meta">No evidence in window.</p>'
    : `
<table>
<thead><tr><th>Control</th><th>Source</th><th>Actor</th><th>Impact</th><th>Reasoning</th><th>Collected</th></tr></thead>
<tbody>
${b.evidence
  .slice(0, 150)
  .map((e) => {
    const md = (e.metadata ?? {}) as { impact?: string; reasoning?: string; eventType?: string };
    return `<tr>
    <td><code>${esc(e.controlId)}</code></td>
    <td>${esc(e.source)}</td>
    <td style="max-width:160px;word-break:break-all">${esc(e.actor)}</td>
    <td><span class="badge" style="${md.impact === "positive" ? "background:#dcfce7;color:#166534" : md.impact === "negative" ? "background:#fee2e2;color:#991b1b" : "background:#f3f4f6;color:#4b5563"}">${esc(md.impact ?? "—")}</span></td>
    <td style="max-width:400px">${esc(md.reasoning ?? md.eventType ?? "")}</td>
    <td>${date(e.createdAt)}</td>
  </tr>`;
  })
  .join("")}
${b.evidence.length > 150 ? `<tr><td colspan="6" style="text-align:center;color:#666;font-style:italic">… ${b.evidence.length - 150} more records truncated for print. Request JSON format for full set.</td></tr>` : ""}
</tbody></table>`
}
</div>

<div class="section">
<h2>Incidents (${b.incidents.length})</h2>
${
  b.incidents.length === 0
    ? '<p class="meta">No incidents in window.</p>'
    : `
<table>
<thead><tr><th>Title</th><th>Severity</th><th>Status</th><th>Opened</th><th>Resolved</th></tr></thead>
<tbody>
${b.incidents
  .map(
    (i) => `
  <tr>
    <td>${esc(i.title)}</td>
    <td><span class="badge" style="background:#fef3c7;color:#92400e">${esc(i.severity)}</span></td>
    <td>${esc(i.status)}</td>
    <td>${date(i.createdAt)}</td>
    <td>${date(i.resolvedAt)}</td>
  </tr>`,
  )
  .join("")}
</tbody></table>`
}
</div>

<div class="section">
<h2>Audit Trail — ${b.auditLog.length} recent entries</h2>
${
  b.auditLog.length === 0
    ? '<p class="meta">No audit entries in window.</p>'
    : `
<table>
<thead><tr><th>Action</th><th>Resource</th><th>Actor</th><th>When</th></tr></thead>
<tbody>
${b.auditLog
  .slice(0, 50)
  .map(
    (a) => `
  <tr>
    <td><code>${esc(a.action)}</code></td>
    <td>${esc(a.resourceType ?? "—")}</td>
    <td>${esc(a.actorId)}</td>
    <td>${date(a.createdAt)}</td>
  </tr>`,
  )
  .join("")}
${b.auditLog.length > 50 ? `<tr><td colspan="4" style="text-align:center;color:#666;font-style:italic">… ${b.auditLog.length - 50} more entries truncated for print.</td></tr>` : ""}
</tbody></table>`
}
</div>

<div class="footer">
  <p>
    <strong>Integrity.</strong> This report is signed with a SHA-256 content hash of the
    underlying JSON bundle. To verify, request the same URL with <code>?format=json</code>
    and recompute the hash.
  </p>
  <p><strong>Content hash:</strong> <code>${contentHash}</code></p>
  <p><strong>Tenant ID:</strong> <code>${esc(b.tenant.id)}</code> · <strong>Framework:</strong> <code>${esc(b.framework)}</code> · <strong>Generated:</strong> ${esc(b.generatedAt)}</p>
  <p>Produced by AtlasIT continuous compliance platform. Scores reflect operational evidence at generation time.</p>
</div>

</body>
</html>`;
}

function svgBadgeResponse(svg: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Short cache — scores refresh with each evaluation. 5 min is a fair tradeoff
      // between CDN efficiency and freshness for marketing-page embeds.
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
    body: svg,
  };
}

/**
 * Hybrid CDT evaluator.
 *
 * The 64 CDT rule functions were designed for structured events with explicit
 * boolean flags (e.g. `least_privilege_enforced === true`). Most real evidence
 * records carry a different but meaningful shape produced by the evidence
 * classifier: `{ impact: 'positive'|'neutral'|'negative', eventType, reasoning }`.
 *
 * Strategy:
 *   1. Run the strict CDT rule. A `pass` is always respected (strongest signal).
 *   2. When the rule returns `fail` or `unknown`, fall back to the evidence
 *      pipeline's own classification: impact='positive' → pass,
 *      impact='negative' → fail, otherwise keep the rule's original decision.
 *
 * This lets both structured CDT-native events AND the existing classifier
 * output contribute to scoring without discarding either source of truth.
 */
type Decision = {
  decision: "pass" | "fail" | "unknown";
  rationale: string[];
  references: string[];
};

function evaluateEvidence(
  rule: { fn: (ev: CdtEvent) => Decision } | undefined,
  controlId: string,
  cdtEv: CdtEvent,
): Decision {
  const ruleDecision: Decision = rule
    ? rule.fn(cdtEv)
    : {
        decision: "unknown",
        rationale: ["No rule implementation registered"],
        references: [controlId],
      };

  if (ruleDecision.decision === "pass") return ruleDecision;

  const md = cdtEv.payload as { impact?: string; eventType?: string; reasoning?: string };
  const impact = md?.impact;
  const eventType = md?.eventType ?? cdtEv.type;
  const reasoning = md?.reasoning;

  if (impact === "positive") {
    return {
      decision: "pass",
      rationale: [`Classifier: ${eventType}${reasoning ? ` — ${reasoning}` : ""}`],
      references: [controlId],
    };
  }
  if (impact === "negative") {
    return {
      decision: "fail",
      rationale: [
        `Classifier flagged ${eventType} as negative${reasoning ? ` — ${reasoning}` : ""}`,
      ],
      references: [controlId],
    };
  }
  return ruleDecision;
}

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath;
  const method = event.requestContext.http.method.toUpperCase();
  const qs = event.queryStringParameters ?? {};
  const requestId = event.requestContext.requestId;

  // ── CORS preflight (no auth, handle before everything) ──────────────────
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": event.headers?.origin ?? "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, content-type, x-api-key, x-correlation-id, x-internal-api-key, x-request-id, x-tenant-id",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "7200",
      },
      body: "",
    };
  }

  // ── Health (no auth) ──────────────────────────────────────────────────────
  if (path === "/health" && method === "GET") {
    return ok({
      status: "healthy",
      service: "compliance-api",
      timestamp: new Date().toISOString(),
      requestId,
    });
  }

  // ── Public trust center badge (SVG) — embeds anywhere, no auth, no JS ─────
  // GET /api/v1/trust/:slug/badge.svg — shields.io-style SVG showing the score.
  // Query params: ?framework=SOC2|ISO27001|NIST_CSF|HIPAA|GDPR  → per-framework score
  //               ?style=flat|for-the-badge                     → visual style
  {
    const bm = path.match(/^\/api\/v1\/trust\/([a-z0-9-]+)\/badge\.svg$/);
    if (bm && method === "GET") {
      const slug = bm[1];
      const frameworkParam = qs.framework ?? null;
      const style = qs.style === "for-the-badge" ? "for-the-badge" : "flat";
      const pool = getPool();
      try {
        const tRow = await pool.query(
          `SELECT id, config FROM tenants WHERE slug = $1 OR id = $1 LIMIT 1`,
          [slug],
        );
        if (tRow.rows.length === 0) {
          return svgBadgeResponse(renderBadge("compliance", "not found", "#9e9e9e", style));
        }
        const cfg = (tRow.rows[0].config ?? {}) as Record<string, unknown>;
        if (!cfg.trust_center_public) {
          return svgBadgeResponse(renderBadge("compliance", "private", "#9e9e9e", style));
        }
        const tenantId = tRow.rows[0].id as string;

        let label = "compliance";
        let score = 0;
        let totalControls = 0;
        let totalPass = 0;
        if (frameworkParam) {
          const fr = await pool.query(
            `SELECT p.controls_count::int as "controlCount", tcp.pass_count as "passCount"
             FROM compliance_packs p
             INNER JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id
             WHERE tcp.tenant_id = $1 AND p.framework_id = $2
             LIMIT 1`,
            [tenantId, frameworkParam],
          );
          if (fr.rows.length === 0) {
            return svgBadgeResponse(
              renderBadge(String(frameworkParam).toLowerCase(), "n/a", "#9e9e9e", style),
            );
          }
          totalControls = fr.rows[0].controlCount ?? 0;
          totalPass = fr.rows[0].passCount ?? 0;
          label = String(frameworkParam).toLowerCase().replace("_", " ");
        } else {
          const aggregate = await pool.query(
            `SELECT SUM(p.controls_count::int) as total, SUM(tcp.pass_count) as pass
             FROM compliance_packs p
             INNER JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id
             WHERE tcp.tenant_id = $1`,
            [tenantId],
          );
          totalControls = parseInt(aggregate.rows[0]?.total ?? "0", 10);
          totalPass = parseInt(aggregate.rows[0]?.pass ?? "0", 10);
        }
        score = totalControls > 0 ? Math.round((totalPass * 100) / totalControls) : 0;
        const color = score >= 80 ? "#4c1" : score >= 50 ? "#dfb317" : "#e05d44";
        return svgBadgeResponse(renderBadge(label, `${score}%`, color, style));
      } catch (e) {
        console.error("[compliance-api] trust.badge.error", { error: (e as Error).message, slug });
        return svgBadgeResponse(renderBadge("compliance", "error", "#9e9e9e", style));
      }
    }
  }

  // ── Public trust center PDF export (Phase 9.1) — no auth required ─────────
  // GET /api/v1/trust/:slug/export.pdf?framework=SOC2 — auditor-ready bundle.
  // Same opt-in gate as /trust/:slug. Content includes framework summary +
  // optional per-control detail. SHA-256 content hash rendered in footer for
  // tamper detection.
  {
    const pm = path.match(/^\/api\/v1\/trust\/([a-z0-9-]+)\/export\.pdf$/);
    if (pm && method === "GET") {
      const slug = pm[1];
      const frameworkParam = qs.framework ?? null;
      const includeControls = qs.details === "true" || qs.details === "1";
      const pool = getPool();
      try {
        const tRow = await pool.query(
          `SELECT id, name, slug, config FROM tenants WHERE slug = $1 OR id = $1 LIMIT 1`,
          [slug],
        );
        if (tRow.rows.length === 0) return fail(404, "Trust center not found", "NOT_FOUND");
        const tenant = tRow.rows[0];
        const cfg = (tenant.config ?? {}) as Record<string, unknown>;
        if (!cfg.trust_center_public)
          return fail(404, "Trust center not published", "NOT_PUBLISHED");

        const tenantId = tenant.id as string;
        const frameworkFilter = frameworkParam ? " AND p.framework_id = $2" : "";
        const frameworkParams = frameworkParam ? [tenantId, frameworkParam] : [tenantId];

        const packsRow = await pool.query(
          `SELECT p.id as "packId", p.name as "label", p.framework_id as "framework",
                  p.controls_count::int as "controlCount",
                  COALESCE(tcp.pass_count, 0) as "passCount",
                  COALESCE(tcp.fail_count, 0) as "failCount",
                  COALESCE(tcp.unknown_count, 0) as "unknownCount",
                  tcp.last_evaluated_at as "lastEvaluatedAt"
           FROM compliance_packs p
           INNER JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id
           WHERE tcp.tenant_id = $1${frameworkFilter}
           ORDER BY p.framework_id`,
          frameworkParams,
        );

        if (packsRow.rows.length === 0) {
          return fail(404, "No compliance data for this framework", "NOT_FOUND");
        }

        const frameworks = packsRow.rows.map((r) => ({
          label: r.label as string,
          framework: r.framework as string,
          controlCount: Number(r.controlCount ?? 0),
          passCount: Number(r.passCount ?? 0),
          failCount: Number(r.failCount ?? 0),
          unknownCount: Number(r.unknownCount ?? 0),
          score:
            Number(r.controlCount ?? 0) > 0
              ? Math.round((Number(r.passCount ?? 0) * 100) / Number(r.controlCount ?? 0))
              : 0,
          lastEvaluatedAt: (r.lastEvaluatedAt as Date | null)?.toISOString() ?? null,
        }));

        const totals = frameworks.reduce(
          (acc, f) => ({
            controls: acc.controls + f.controlCount,
            pass: acc.pass + f.passCount,
            fail: acc.fail + f.failCount,
            unknown: acc.unknown + f.unknownCount,
          }),
          { controls: 0, pass: 0, fail: 0, unknown: 0 },
        );
        const overallScore =
          totals.controls > 0 ? Math.round((totals.pass * 100) / totals.controls) : 0;

        let controls: Array<{
          framework: string;
          controlId: string;
          title: string;
          state: "pass" | "fail" | "unknown";
          evidenceCount: number;
          evaluatedAt: string | null;
        }> = [];
        if (includeControls) {
          const packIds = packsRow.rows.map((r) => r.packId as string);
          const ctrlRows = await pool.query(
            `SELECT p.framework_id as "framework", tcs.control_id as "controlId",
                    pc.title, tcs.state, tcs.evidence_sample_size as "evidenceCount",
                    tcs.evaluated_at as "evaluatedAt"
             FROM tenant_control_state tcs
             INNER JOIN compliance_packs p ON tcs.pack_id = p.id
             LEFT JOIN compliance_pack_controls pc
               ON pc.pack_id = tcs.pack_id AND pc.control_ref = tcs.control_id
             WHERE tcs.tenant_id = $1 AND tcs.pack_id = ANY($2::text[])
             ORDER BY p.framework_id, tcs.control_id
             LIMIT 2000`,
            [tenantId, packIds],
          );
          controls = ctrlRows.rows.map((r) => ({
            framework: r.framework as string,
            controlId: r.controlId as string,
            title: (r.title as string) ?? r.controlId,
            state: r.state as "pass" | "fail" | "unknown",
            evidenceCount: Number(r.evidenceCount ?? 0),
            evaluatedAt: (r.evaluatedAt as Date | null)?.toISOString() ?? null,
          }));
        }

        const { renderTrustPdf } = await import("./pdf.js");
        const pdfBytes = await renderTrustPdf({
          tenantName: tenant.name as string,
          tenantSlug: tenant.slug as string,
          generatedAt: new Date().toISOString(),
          overallScore,
          totals,
          frameworks,
          controls: includeControls ? controls : undefined,
        });

        const fname = frameworkParam
          ? `${tenant.slug}-${String(frameworkParam).toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`
          : `${tenant.slug}-compliance-${new Date().toISOString().slice(0, 10)}.pdf`;

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fname}"`,
            "Cache-Control": "private, max-age=0, no-cache",
          },
          body: pdfBytes.toString("base64"),
          isBase64Encoded: true,
        };
      } catch (e) {
        console.error("[compliance-api] trust.pdf.error", {
          error: (e as Error).message,
          stack: (e as Error).stack,
          slug,
        });
        return fail(500, "Failed to generate PDF", "INTERNAL_ERROR");
      }
    }
  }

  // ── Public trust center (Phase 9) — no auth required ───────────────────────
  // GET /api/v1/trust/:slug — returns a safe, aggregated view of a tenant's
  // compliance posture. Tenant must opt in via tenants.config.trust_center_public = true.
  {
    const m = path.match(/^\/api\/v1\/trust\/([a-z0-9-]+)$/);
    if (m && method === "GET") {
      const slug = m[1];
      const pool = getPool();
      try {
        const tRow = await pool.query(
          `SELECT id, name, slug, industry, size, config FROM tenants WHERE slug = $1 OR id = $1 LIMIT 1`,
          [slug],
        );
        if (tRow.rows.length === 0) return fail(404, "Trust center not found", "NOT_FOUND");
        const tenant = tRow.rows[0];
        const cfg = (tenant.config ?? {}) as Record<string, unknown>;
        const publicFlag = Boolean(cfg.trust_center_public);
        if (!publicFlag) return fail(404, "Trust center not published", "NOT_PUBLISHED");

        const [packs, integrations, recentEvidence, latestSnapshot, activeAttestations] =
          await Promise.all([
            pool.query(
              `SELECT p.id, p.name as "label", p.framework_id as "framework",
                    p.controls_count::int as "controlCount",
                    tcp.pass_count as "passCount", tcp.fail_count as "failCount",
                    tcp.unknown_count as "unknownCount", tcp.last_evaluated_at as "lastEvaluatedAt"
             FROM compliance_packs p
             INNER JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id
             WHERE tcp.tenant_id = $1
             ORDER BY p.name`,
              [tenant.id],
            ),
            pool.query(
              `SELECT COUNT(*) as cnt FROM integrations WHERE tenant_id = $1 AND status = 'active'`,
              [tenant.id],
            ),
            pool.query(
              `SELECT COUNT(*) as cnt FROM compliance_evidence
             WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
              [tenant.id],
            ),
            pool.query(
              `SELECT snapshot_at FROM compliance_score_snapshots
             WHERE tenant_id = $1 ORDER BY snapshot_at DESC LIMIT 1`,
              [tenant.id],
            ),
            pool.query(
              `SELECT COUNT(*) as cnt FROM attestations WHERE tenant_id = $1 AND status = 'active'`,
              [tenant.id],
            ),
          ]);

        const installed = packs.rows;
        let totalControls = 0;
        let totalPass = 0;
        let totalFail = 0;
        let totalUnknown = 0;
        for (const p of installed) {
          totalControls += p.controlCount ?? 0;
          totalPass += p.passCount ?? 0;
          totalFail += p.failCount ?? 0;
          totalUnknown += p.unknownCount ?? 0;
        }
        const overallScore = totalControls > 0 ? Math.round((totalPass * 100) / totalControls) : 0;

        return ok({
          status: "success",
          data: {
            tenant: {
              name: tenant.name,
              slug: tenant.slug,
              industry: tenant.industry ?? null,
              size: tenant.size ?? null,
            },
            overallScore,
            totals: {
              controls: totalControls,
              pass: totalPass,
              fail: totalFail,
              unknown: totalUnknown,
            },
            frameworks: installed.map((p) => ({
              label: p.label,
              framework: p.framework,
              controlCount: p.controlCount,
              score:
                (p.controlCount ?? 0) > 0
                  ? Math.round(((p.passCount ?? 0) * 100) / p.controlCount)
                  : 0,
              lastEvaluatedAt: p.lastEvaluatedAt,
            })),
            stats: {
              connectedApps: parseInt(integrations.rows[0]?.cnt ?? "0", 10),
              evidenceLast30Days: parseInt(recentEvidence.rows[0]?.cnt ?? "0", 10),
              lastSnapshotAt: latestSnapshot.rows[0]?.snapshot_at ?? null,
              signedAttestations: parseInt(activeAttestations.rows[0]?.cnt ?? "0", 10),
            },
            commitment:
              "Scores are generated continuously from live operational evidence, not self-attestation.",
          },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[compliance-api] trust.public.error", {
          error: (e as Error).message,
          slug,
        });
        return fail(500, "Trust center unavailable", "INTERNAL_ERROR");
      }
    }
  }

  // ── Internal: evaluate all installed packs across all tenants (cron-driven) ──
  // Requires x-internal-api-key. No Bearer token check.
  if (path === "/internal/compliance-packs/evaluate-all" && method === "POST") {
    const providedKey =
      event.headers?.["x-internal-api-key"] ?? event.headers?.["X-Internal-Api-Key"];
    const expectedKey = process.env.INTERNAL_API_KEY;
    if (!expectedKey || providedKey !== expectedKey) {
      return fail(401, "Internal key required", "UNAUTHORIZED");
    }
    const startedAt = Date.now();
    const pool = getPool();
    try {
      const installs = await pool.query(
        `SELECT tenant_id, pack_id FROM tenant_compliance_packs ORDER BY tenant_id, pack_id`,
      );
      const norm = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
      const results: Array<Record<string, unknown>> = [];

      for (const row of installs.rows) {
        const tId = row.tenant_id as string;
        const pId = row.pack_id as string;
        try {
          const ctrls = await pool.query(
            `SELECT control_id FROM compliance_pack_controls WHERE pack_id = $1`,
            [pId],
          );
          const ev = await pool.query(
            `SELECT control_id, source, actor, metadata, created_at
             FROM compliance_evidence
             WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days' AND control_id IS NOT NULL`,
            [tId],
          );
          const byControl = new Map<string, Array<Record<string, unknown>>>();
          for (const e of ev.rows) {
            const k = norm(e.control_id as string);
            if (!byControl.has(k)) byControl.set(k, []);
            byControl.get(k)!.push(e);
          }
          let pass = 0;
          let fail_ = 0;
          let unknown = 0;
          const at = new Date().toISOString();
          for (const c of ctrls.rows) {
            const controlId = c.control_id as string;
            const rule = CONTROL_REGISTRY[controlId];
            const regKey = norm(controlId);
            let evs = byControl.get(regKey) ?? [];
            if (evs.length === 0) {
              for (const [k, v] of byControl)
                if (regKey.endsWith(k) && k.length >= 3) {
                  evs = v;
                  break;
                }
            }
            let state: "pass" | "fail" | "unknown" = "unknown";
            let rationale: string[] = ["No evidence in last 30 days"];
            if (evs.length > 0) {
              let anyPass = false;
              const fails: string[] = [];
              for (const r of evs) {
                const cdtEv: CdtEvent = {
                  type: (r.source as string) ?? "evidence",
                  tenant: tId,
                  occurred_at:
                    (r.created_at as Date)?.toISOString?.() ?? String(r.created_at ?? at),
                  payload: (r.metadata ?? {}) as Record<string, unknown>,
                  trace_id: (r.actor as string) ?? "",
                };
                const dec = evaluateEvidence(rule, controlId, cdtEv);
                if (dec.decision === "pass") {
                  anyPass = true;
                  rationale = dec.rationale;
                  break;
                }
                if (dec.decision === "fail") fails.push(...dec.rationale);
              }
              state = anyPass ? "pass" : fails.length > 0 ? "fail" : "unknown";
              if (!anyPass && fails.length > 0) rationale = Array.from(new Set(fails)).slice(0, 5);
            }
            if (state === "pass") pass++;
            else if (state === "fail") fail_++;
            else unknown++;
            await pool.query(
              `INSERT INTO tenant_control_state (tenant_id, pack_id, control_id, state, rationale, evaluated_at, evidence_sample_size)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (tenant_id, pack_id, control_id) DO UPDATE SET
                 state = EXCLUDED.state, rationale = EXCLUDED.rationale,
                 evaluated_at = EXCLUDED.evaluated_at, evidence_sample_size = EXCLUDED.evidence_sample_size`,
              [tId, pId, controlId, state, rationale, at, evs.length],
            );
          }
          // Capture previous counts so we can detect meaningful score changes.
          const prevRow = await pool.query(
            `SELECT pass_count as "passCount", fail_count as "failCount", unknown_count as "unknownCount"
             FROM tenant_compliance_packs WHERE tenant_id = $1 AND pack_id = $2`,
            [tId, pId],
          );
          const prev = prevRow.rows[0] ?? { passCount: 0, failCount: 0, unknownCount: 0 };

          await pool.query(
            `UPDATE tenant_compliance_packs SET last_evaluated_at = $3, pass_count = $4, fail_count = $5, unknown_count = $6
             WHERE tenant_id = $1 AND pack_id = $2`,
            [tId, pId, at, pass, fail_, unknown],
          );
          const totalCtrls = ctrls.rows.length;
          const snapPct =
            totalCtrls > 0 ? Math.round(((pass * 100.0) / totalCtrls) * 100) / 100 : 0;
          await pool.query(
            `INSERT INTO compliance_score_snapshots (tenant_id, pack_id, pass_count, fail_count, unknown_count, total_controls, score_pct, snapshot_at, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [tId, pId, pass, fail_, unknown, totalCtrls, snapPct, at, "cron"],
          );

          // Only publish compliance.score_evaluated if the score actually moved
          // (keeps SQS volume low; idempotent downstream).
          const changed =
            Number(prev.passCount ?? 0) !== pass ||
            Number(prev.failCount ?? 0) !== fail_ ||
            Number(prev.unknownCount ?? 0) !== unknown;
          if (changed) {
            const prevPct =
              totalCtrls > 0
                ? Math.round(((Number(prev.passCount ?? 0) * 100) / totalCtrls) * 100) / 100
                : 0;
            await publishEvent(tId, "compliance.score_evaluated", "compliance-api", {
              packId: pId,
              pass,
              fail: fail_,
              unknown,
              totalControls: totalCtrls,
              scorePct: snapPct,
              previousScorePct: prevPct,
              deltaPct: Math.round((snapPct - prevPct) * 100) / 100,
            });
          }

          results.push({
            tenantId: tId,
            packId: pId,
            pass,
            fail: fail_,
            unknown,
            controlCount: ctrls.rows.length,
            scoreChanged: changed,
          });
        } catch (e) {
          results.push({ tenantId: tId, packId: pId, error: (e as Error).message });
        }
      }
      return ok({
        status: "success",
        data: { installs: installs.rows.length, results, durationMs: Date.now() - startedAt },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] evaluate-all.error", { error: (e as Error).message });
      return fail(500, "Batch evaluation failed", "INTERNAL_ERROR");
    }
  }

  // All remaining routes require authentication
  let auth: Awaited<ReturnType<typeof extractAuth>>;
  try {
    auth = await extractAuth(event, svc.authRepo);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.status, e.message, "UNAUTHORIZED");
    return fail(401, "Authentication required", "UNAUTHORIZED");
  }

  const { tenantId } = auth;
  const pool = getPool();

  // ── Compliance summary ────────────────────────────────────────────────────

  // GET /api/v1/compliance/summary — per-framework control passing rates + evidence counts
  if (path === "/api/v1/compliance/summary" && method === "GET") {
    try {
      const rows = await pool.query(
        `SELECT framework,
                COUNT(DISTINCT control_id) as controls_total,
                COUNT(DISTINCT control_id) FILTER (WHERE cnt >= 3) as controls_passing,
                SUM(cnt) as evidence_count
         FROM (
           SELECT framework, control_id, COUNT(*) as cnt
           FROM compliance_evidence
           WHERE tenant_id = $1 AND framework IS NOT NULL
           GROUP BY framework, control_id
         ) t
         GROUP BY framework ORDER BY framework`,
        [tenantId],
      );
      const frameworks = rows.rows.map((r: Record<string, string>) => ({
        framework: r.framework,
        controlsTotal: parseInt(r.controls_total, 10),
        controlsPassing: parseInt(r.controls_passing, 10),
        evidenceCount: parseInt(r.evidence_count, 10),
        score:
          parseInt(r.controls_total, 10) > 0
            ? Math.round((parseInt(r.controls_passing, 10) * 100) / parseInt(r.controls_total, 10))
            : 0,
      }));
      const totalRow = await pool.query(
        `SELECT COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = $1`,
        [tenantId],
      );
      return ok({
        status: "success",
        data: {
          frameworks,
          totalEvidence: parseInt(totalRow.rows[0]?.cnt ?? "0", 10),
          lastUpdated: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] summary.error", { error: (e as Error).message });
      return fail(500, "Failed to build compliance summary", "INTERNAL_ERROR");
    }
  }

  // ── Compliance Packs (CDT-backed) ─────────────────────────────────────────

  // GET /api/v1/compliance-packs — list all available packs with control counts
  if (path === "/api/v1/compliance-packs" && method === "GET") {
    try {
      const packs = await pool.query(
        `SELECT p.id, p.name as "label", p.framework_id as "framework",
                p.controls_count::int as "controlCount",
                p.description, p.version, p.status,
                tcp.installed_at as "installedAt",
                tcp.last_evaluated_at as "lastEvaluatedAt",
                tcp.pass_count as "passCount",
                tcp.fail_count as "failCount",
                tcp.unknown_count as "unknownCount"
         FROM compliance_packs p
         LEFT JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id AND tcp.tenant_id = $1
         ORDER BY p.name`,
        [tenantId],
      );
      return ok({
        status: "success",
        data: { items: packs.rows, total: packs.rows.length },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] packs.list.error", { error: (e as Error).message });
      return fail(500, "Failed to list packs", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/compliance-packs/installed — packs installed for this tenant
  if (path === "/api/v1/compliance-packs/installed" && method === "GET") {
    try {
      const rows = await pool.query(
        `SELECT p.id, p.name as "label", p.framework_id as "framework",
                p.controls_count::int as "controlCount",
                tcp.installed_at as "installedAt",
                tcp.last_evaluated_at as "lastEvaluatedAt",
                tcp.pass_count as "passCount",
                tcp.fail_count as "failCount",
                tcp.unknown_count as "unknownCount"
         FROM tenant_compliance_packs tcp
         INNER JOIN compliance_packs p ON p.id = tcp.pack_id
         WHERE tcp.tenant_id = $1
         ORDER BY tcp.installed_at DESC`,
        [tenantId],
      );
      return ok({
        status: "success",
        data: { items: rows.rows, total: rows.rows.length },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] packs.installed.error", { error: (e as Error).message });
      return fail(500, "Failed to list installed packs", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/compliance-packs/history?packId=...&days=30 — score history for one pack
  // NOTE: must be registered BEFORE /:id route to avoid matching "history" as a pack id
  if (path === "/api/v1/compliance-packs/history" && method === "GET") {
    const packId = qs.packId as string | undefined;
    const days = Math.min(Math.max(parseInt(qs.days ?? "30", 10) || 30, 1), 365);
    if (!packId) return fail(400, "packId query parameter is required", "INVALID_PARAMS");
    try {
      const rows = await pool.query(
        `SELECT pass_count as "passCount", fail_count as "failCount", unknown_count as "unknownCount",
                total_controls as "totalControls", score_pct as "score",
                snapshot_at as "snapshotAt", source
         FROM compliance_score_snapshots
         WHERE tenant_id = $1 AND pack_id = $2
           AND snapshot_at > NOW() - make_interval(days => $3)
         ORDER BY snapshot_at ASC
         LIMIT 200`,
        [tenantId, packId, days],
      );
      return ok({
        status: "success",
        data: {
          packId,
          days,
          series: rows.rows.map((r) => ({
            snapshotAt: (r.snapshotAt as Date)?.toISOString?.() ?? String(r.snapshotAt),
            passCount: Number(r.passCount),
            failCount: Number(r.failCount),
            unknownCount: Number(r.unknownCount),
            totalControls: Number(r.totalControls),
            score: parseFloat(r.score),
            source: r.source as string,
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] history.error", { error: (e as Error).message, packId });
      return fail(500, "Failed to fetch history", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/compliance-packs/history/aggregate?days=30 — avg score trend across all packs
  // NOTE: must be registered BEFORE /:id route to avoid matching "history" as a pack id
  if (path === "/api/v1/compliance-packs/history/aggregate" && method === "GET") {
    const days = Math.min(Math.max(parseInt(qs.days ?? "30", 10) || 30, 1), 365);
    try {
      const rows = await pool.query(
        `WITH daily AS (
           SELECT date_trunc('day', snapshot_at) AS day,
                  AVG(score_pct) AS avg_score,
                  COUNT(*) AS snap_count
           FROM compliance_score_snapshots
           WHERE tenant_id = $1
             AND snapshot_at > NOW() - make_interval(days => $2)
           GROUP BY day
           ORDER BY day ASC
         )
         SELECT day, avg_score, snap_count FROM daily`,
        [tenantId, days],
      );
      return ok({
        status: "success",
        data: {
          days,
          series: rows.rows.map((r) => ({
            day: (r.day as Date)?.toISOString?.().slice(0, 10) ?? String(r.day),
            avgScore: parseFloat(parseFloat(r.avg_score).toFixed(2)),
            snapshotCount: Number(r.snap_count),
          })),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] history.aggregate.error", { error: (e as Error).message });
      return fail(500, "Failed to fetch aggregate history", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/compliance-packs/:id — pack detail + control list + current state
  {
    const m = path.match(/^\/api\/v1\/compliance-packs\/([A-Za-z0-9_-]+)$/);
    if (m && method === "GET") {
      const packId = m[1];
      try {
        const packRow = await pool.query(
          `SELECT id, name as "label", framework_id as "framework",
                  controls_count::int as "controlCount",
                  description, version, status
           FROM compliance_packs WHERE id = $1`,
          [packId],
        );
        if (packRow.rows.length === 0) return fail(404, "Pack not found", "NOT_FOUND");

        const controls = await pool.query(
          `SELECT c.control_id as "controlId", c.title, c.rule_fn as "ruleFn",
                  COALESCE(s.state, 'unknown') as state,
                  s.rationale,
                  s.evaluated_at as "evaluatedAt",
                  s.evidence_sample_size as "evidenceSampleSize"
           FROM compliance_pack_controls c
           LEFT JOIN tenant_control_state s
             ON s.pack_id = c.pack_id AND s.control_id = c.control_id AND s.tenant_id = $1
           WHERE c.pack_id = $2
           ORDER BY c.control_id`,
          [tenantId, packId],
        );

        const installed = await pool.query(
          `SELECT installed_at as "installedAt", last_evaluated_at as "lastEvaluatedAt",
                  pass_count as "passCount", fail_count as "failCount", unknown_count as "unknownCount"
           FROM tenant_compliance_packs WHERE tenant_id = $1 AND pack_id = $2`,
          [tenantId, packId],
        );

        return ok({
          status: "success",
          data: {
            pack: packRow.rows[0],
            installation: installed.rows[0] ?? null,
            controls: controls.rows,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[compliance-api] packs.detail.error", {
          error: (e as Error).message,
          packId,
        });
        return fail(500, "Failed to load pack detail", "INTERNAL_ERROR");
      }
    }
  }

  // POST /api/v1/compliance-packs/:id/install — install pack for tenant
  {
    const m = path.match(/^\/api\/v1\/compliance-packs\/([A-Za-z0-9_-]+)\/install$/);
    if (m && method === "POST") {
      const packId = m[1];
      try {
        const exists = await pool.query(`SELECT id FROM compliance_packs WHERE id = $1`, [packId]);
        if (exists.rows.length === 0) return fail(404, "Pack not found", "NOT_FOUND");
        await pool.query(
          `INSERT INTO tenant_compliance_packs (tenant_id, pack_id) VALUES ($1, $2)
           ON CONFLICT (tenant_id, pack_id) DO NOTHING`,
          [tenantId, packId],
        );
        if (svc.auditRepo) {
          await svc.auditRepo
            .log({
              tenantId,
              actor: auth.userId,
              action: "compliance_pack.install",
              target: packId,
            })
            .catch(() => {});
        }
        return ok({
          status: "success",
          data: { packId, installed: true },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[compliance-api] packs.install.error", {
          error: (e as Error).message,
          packId,
        });
        return fail(500, "Failed to install pack", "INTERNAL_ERROR");
      }
    }
  }

  // DELETE /api/v1/compliance-packs/:id/install — uninstall pack
  {
    const m = path.match(/^\/api\/v1\/compliance-packs\/([A-Za-z0-9_-]+)\/install$/);
    if (m && method === "DELETE") {
      const packId = m[1];
      try {
        await pool.query(
          `DELETE FROM tenant_compliance_packs WHERE tenant_id = $1 AND pack_id = $2`,
          [tenantId, packId],
        );
        await pool.query(`DELETE FROM tenant_control_state WHERE tenant_id = $1 AND pack_id = $2`, [
          tenantId,
          packId,
        ]);
        return ok({
          status: "success",
          data: { packId, uninstalled: true },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        return fail(500, "Failed to uninstall pack", "INTERNAL_ERROR");
      }
    }
  }

  // POST /api/v1/compliance-packs/:id/evaluate — run CDT rules against recent evidence
  {
    const m = path.match(/^\/api\/v1\/compliance-packs\/([A-Za-z0-9_-]+)\/evaluate$/);
    if (m && method === "POST") {
      const packId = m[1];
      const startedAt = Date.now();
      try {
        const installed = await pool.query(
          `SELECT 1 FROM tenant_compliance_packs WHERE tenant_id = $1 AND pack_id = $2`,
          [tenantId, packId],
        );
        if (installed.rows.length === 0) return fail(400, "Pack is not installed", "NOT_INSTALLED");

        const controlsRow = await pool.query(
          `SELECT control_id as "controlId", rule_fn as "ruleFn"
           FROM compliance_pack_controls WHERE pack_id = $1`,
          [packId],
        );
        const controls = controlsRow.rows as Array<{ controlId: string; ruleFn: string }>;

        // Pull recent evidence for this tenant (last 30 days) grouped by normalized control key
        const evidenceRows = await pool.query(
          `SELECT control_id as "controlId", framework, source, actor, metadata, created_at as "createdAt"
           FROM compliance_evidence
           WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '30 days' AND control_id IS NOT NULL`,
          [tenantId],
        );

        // Normalize keys to handle mismatch between registry ("SOC2-CC6.1") and evidence ("CC6.1"):
        // strip non-alphanumerics and uppercase. Registry "SOC2-CC6.1" → "SOC2CC61"; evidence "CC6.1" → "CC61".
        // Match if registry key ends with evidence key (post-strip).
        const norm = (s: string) => s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        const byControl = new Map<string, Array<Record<string, unknown>>>();
        for (const row of evidenceRows.rows) {
          const cid = row.controlId as string | null;
          if (!cid) continue;
          const key = norm(cid);
          if (!byControl.has(key)) byControl.set(key, []);
          byControl.get(key)!.push(row);
        }

        function lookupEvidence(regControlId: string): Array<Record<string, unknown>> {
          const regKey = norm(regControlId);
          // Direct match
          if (byControl.has(regKey)) return byControl.get(regKey)!;
          // Strip framework prefix — try suffix match (evidence often omits the prefix)
          for (const [evKey, rows] of byControl) {
            if (regKey.endsWith(evKey) && evKey.length >= 3) return rows;
          }
          return [];
        }

        let passCount = 0;
        let failCount = 0;
        let unknownCount = 0;
        const evaluatedAt = new Date().toISOString();

        // Evaluate each control: pass if ANY evidence event passes, fail if ALL fail, unknown if no evidence
        for (const { controlId } of controls) {
          const rule = CONTROL_REGISTRY[controlId];
          const ev = lookupEvidence(controlId);
          let state: "pass" | "fail" | "unknown" = "unknown";
          let rationale: string[] = ["No evidence in the last 30 days"];

          if (ev.length > 0) {
            let anyPass = false;
            const fails: string[] = [];
            for (const row of ev) {
              const metadata = (row.metadata ?? {}) as Record<string, unknown>;
              const cdtEv: CdtEvent = {
                type: (row.source as string) ?? "evidence",
                tenant: tenantId,
                occurred_at:
                  (row.createdAt as Date)?.toISOString?.() ?? String(row.createdAt ?? evaluatedAt),
                payload: metadata,
                trace_id: (row.actor as string) ?? "",
              };
              const dec = evaluateEvidence(rule, controlId, cdtEv);
              if (dec.decision === "pass") {
                anyPass = true;
                rationale = dec.rationale;
                break;
              }
              if (dec.decision === "fail") fails.push(...dec.rationale);
            }
            state = anyPass ? "pass" : fails.length > 0 ? "fail" : "unknown";
            if (!anyPass && fails.length > 0) rationale = Array.from(new Set(fails)).slice(0, 5);
          }

          if (state === "pass") passCount++;
          else if (state === "fail") failCount++;
          else unknownCount++;

          await pool.query(
            `INSERT INTO tenant_control_state (tenant_id, pack_id, control_id, state, rationale, evaluated_at, evidence_sample_size)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (tenant_id, pack_id, control_id) DO UPDATE SET
               state = EXCLUDED.state,
               rationale = EXCLUDED.rationale,
               evaluated_at = EXCLUDED.evaluated_at,
               evidence_sample_size = EXCLUDED.evidence_sample_size`,
            [tenantId, packId, controlId, state, rationale, evaluatedAt, ev.length],
          );
        }

        await pool.query(
          `UPDATE tenant_compliance_packs
           SET last_evaluated_at = $3, pass_count = $4, fail_count = $5, unknown_count = $6
           WHERE tenant_id = $1 AND pack_id = $2`,
          [tenantId, packId, evaluatedAt, passCount, failCount, unknownCount],
        );

        const totalControls = controls.length;
        const scorePct =
          totalControls > 0 ? Math.round(((passCount * 100.0) / totalControls) * 100) / 100 : 0;
        await pool.query(
          `INSERT INTO compliance_score_snapshots (tenant_id, pack_id, pass_count, fail_count, unknown_count, total_controls, score_pct, snapshot_at, source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            tenantId,
            packId,
            passCount,
            failCount,
            unknownCount,
            totalControls,
            scorePct,
            evaluatedAt,
            "manual",
          ],
        );

        return ok({
          status: "success",
          data: {
            packId,
            evaluatedAt,
            controlCount: controls.length,
            passCount,
            failCount,
            unknownCount,
            score: controls.length > 0 ? Math.round((passCount * 100) / controls.length) : 0,
            durationMs: Date.now() - startedAt,
          },
          timestamp: evaluatedAt,
        });
      } catch (e) {
        console.error("[compliance-api] packs.evaluate.error", {
          error: (e as Error).message,
          packId,
        });
        return fail(500, "Evaluation failed", "INTERNAL_ERROR");
      }
    }
  }

  // GET /api/v1/compliance-packs/registry/controls — introspect loaded CDT rules (debug/admin)
  if (path === "/api/v1/compliance-packs/registry/controls" && method === "GET") {
    return ok({
      status: "success",
      data: { items: listControls(), total: Object.keys(CONTROL_REGISTRY).length },
      timestamp: new Date().toISOString(),
    });
  }

  // ── Evidence routes ────────────────────────────────────────────────────────

  // GET /api/v1/evidence — list evidence for tenant
  if (path === "/api/v1/evidence" && method === "GET") {
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "50", 10) || 50, 1), 200);
    const cursor = qs.cursor ?? null;

    try {
      const conditions = [`tenant_id = $1`];
      const bindings: unknown[] = [tenantId];
      if (cursor) {
        conditions.push(`created_at < $${bindings.length + 1}`);
        bindings.push(cursor);
      }
      const where = conditions.join(" AND ");
      const rows = await pool.query(
        `SELECT id, tenant_id as "tenantId", framework, control_id as "controlId",
                control_name as "controlName", evidence_type as "evidenceType",
                source, source_id as "sourceId", actor, subject, metadata, created_at as "createdAt"
         FROM compliance_evidence WHERE ${where}
         ORDER BY created_at DESC LIMIT $${bindings.length + 1}`,
        [...bindings, limit + 1],
      );
      const items = rows.rows.slice(0, limit);
      const hasNext = rows.rows.length > limit;
      const nextCursor = hasNext ? (items[items.length - 1]?.["createdAt"] ?? null) : null;

      const countRow = await pool.query(
        `SELECT COUNT(*) as cnt FROM compliance_evidence WHERE tenant_id = $1`,
        [tenantId],
      );

      return ok({
        status: "success",
        data: {
          items,
          nextCursor,
          count: items.length,
          total: parseInt(countRow.rows[0]?.cnt ?? "0", 10),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] evidence.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to list evidence", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/evidence — ingest evidence
  if (path === "/api/v1/evidence" && method === "POST") {
    const b = parseBody(event) as {
      pack?: string;
      subject?: string;
      content?: unknown;
      framework?: string;
      controlId?: string;
      controlName?: string;
      source?: string;
    };
    if (!b.content) return fail(400, "content is required", "VALIDATION_FAILED");

    const canonical = JSON.stringify(b.content);
    const hash = sha256(canonical);
    const key = `evidence/${tenantId}/${hash}`;

    try {
      // Store in S3 evidence bucket
      await svc.evidenceRepo.put(key, canonical, "application/json");

      // Record in PostgreSQL. ON CONFLICT DO NOTHING implements
      // idempotent ingest: re-submitting the same content hash is a no-op,
      // which is the desired behaviour for evidence deduplication.
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO compliance_evidence
           (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
         ON CONFLICT DO NOTHING`,
        [
          id,
          tenantId,
          b.framework ?? null,
          b.controlId ?? null,
          b.controlName ?? null,
          "manual",
          b.source ?? "api",
          hash,
          auth.userId,
          b.subject ?? null,
          JSON.stringify({ pack: b.pack, hash }),
        ],
      );

      await svc.auditRepo.log({
        tenantId,
        actorId: auth.userId,
        actorType: "user",
        action: "evidence.ingested",
        resourceType: "evidence",
        resourceId: hash,
        correlationId: requestId,
      });

      return ok(
        { status: "success", data: { id, hash, key }, timestamp: new Date().toISOString() },
        201,
      );
    } catch (e) {
      console.error("[compliance-api] evidence.ingest.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to ingest evidence", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/evidence/:hash — retrieve evidence object
  const evidenceHashMatch = path.match(/^\/api\/v1\/evidence\/([^/]+)$/);
  if (evidenceHashMatch && method === "GET") {
    const [, hash] = evidenceHashMatch;
    const key = `evidence/${tenantId}/${hash}`;
    try {
      const content = await svc.evidenceRepo.get(key);
      if (!content) return fail(404, "Evidence not found", "NOT_FOUND");
      return ok({
        status: "success",
        data: { hash, content: JSON.parse(content) },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] evidence.get.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to retrieve evidence", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/evidence/:hash/verify — verify evidence integrity
  const evidenceVerifyMatch = path.match(/^\/api\/v1\/evidence\/([^/]+)\/verify$/);
  if (evidenceVerifyMatch && method === "GET") {
    const [, hash] = evidenceVerifyMatch;
    const key = `evidence/${tenantId}/${hash}`;
    try {
      const content = await svc.evidenceRepo.get(key);
      if (!content) return fail(404, "Evidence not found", "NOT_FOUND");
      const actualHash = sha256(content);
      const verified = actualHash === hash;
      return ok({
        status: "success",
        data: { hash, verified, actualHash },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] evidence.verify.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to verify evidence", "INTERNAL_ERROR");
    }
  }

  // ── Compliance snapshot ─────────────────────────────────────────────────────

  // GET /api/compliance/snapshot — get compliance snapshot (tenant-scoped)
  if (path === "/api/compliance/snapshot" && (method === "GET" || method === "HEAD")) {
    const cacheKey = `snapshot:${tenantId}`;
    try {
      const cached = await svc.cacheRepo.get<unknown>(cacheKey);
      if (cached) {
        return ok({
          status: "success",
          data: cached,
          cached: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Build snapshot from PostgreSQL
      const snapshot = await buildComplianceSnapshot(tenantId, pool);
      await svc.cacheRepo.set(cacheKey, snapshot, SNAPSHOT_TTL_SECONDS);

      return ok({
        status: "success",
        data: snapshot,
        cached: false,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] snapshot.error", {
        requestId,
        tenantId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to build compliance snapshot", "INTERNAL_ERROR");
    }
  }

  // ── Policy routes ──────────────────────────────────────────────────────────

  // GET /api/v1/policies/templates — list policy templates
  if (path === "/api/v1/policies/templates" && method === "GET") {
    try {
      const rows = await pool.query(
        `SELECT id, key, name, description, framework, category, created_at as "createdAt"
         FROM policy_templates WHERE tenant_id = $1 ORDER BY framework, name`,
        [tenantId],
      );
      return ok({ status: "success", data: rows.rows, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error("[compliance-api] policy.templates.error", {
        requestId,
        error: (e as Error).message,
      });
      // Return empty list if table doesn't exist yet
      return ok({ status: "success", data: [], timestamp: new Date().toISOString() });
    }
  }

  // POST /api/v1/policies/generate — generate policy document
  if (path === "/api/v1/policies/generate" && method === "POST") {
    const b = parseBody(event) as {
      templateKey?: string;
      context?: Record<string, unknown>;
      framework?: string;
    };
    if (!b.templateKey) return fail(400, "templateKey is required", "VALIDATION_FAILED");

    try {
      const template = await pool.query(`SELECT * FROM policy_templates WHERE key = $1`, [
        b.templateKey,
      ]);
      if (template.rows.length === 0) return fail(404, "Template not found", "NOT_FOUND");

      const id = crypto.randomUUID();
      const content = JSON.stringify({
        templateKey: b.templateKey,
        framework: b.framework ?? template.rows[0].framework,
        context: b.context ?? {},
        generatedAt: new Date().toISOString(),
        tenantId,
      });
      const hash = sha256(content);
      const key = `policies/${tenantId}/${hash}`;

      await svc.evidenceRepo.put(key, content, "application/json");
      await pool.query(
        `INSERT INTO generated_policies (id, tenant_id, template_key, hash, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [id, tenantId, b.templateKey, hash],
      );

      return ok(
        {
          status: "success",
          data: { id, hash, key, templateKey: b.templateKey },
          timestamp: new Date().toISOString(),
        },
        201,
      );
    } catch (e) {
      console.error("[compliance-api] policy.generate.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to generate policy", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/policy/evaluate — evaluate a single policy
  if (path === "/api/v1/policy/evaluate" && method === "POST") {
    const b = parseBody(event) as { hash?: string; controlIds?: string[] };
    if (!b.hash) return fail(400, "hash is required", "VALIDATION_FAILED");

    try {
      const key = `policies/${tenantId}/${b.hash}`;
      const content = await svc.evidenceRepo.get(key);
      if (!content) return fail(404, "Policy not found", "NOT_FOUND");

      // Run basic evaluation: check evidence for linked controls
      const controlIds = b.controlIds ?? [];
      const evaluations: Array<{ controlId: string; status: string }> = [];
      for (const controlId of controlIds) {
        const row = await pool.query(
          `SELECT COUNT(*) as cnt FROM compliance_evidence
           WHERE tenant_id = $1 AND control_id = $2`,
          [tenantId, controlId],
        );
        const hasEvidence = parseInt(row.rows[0]?.cnt ?? "0", 10) > 0;
        evaluations.push({ controlId, status: hasEvidence ? "implemented" : "not_started" });
      }

      return ok({
        status: "success",
        data: { hash: b.hash, evaluations },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] policy.evaluate.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to evaluate policy", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/policies/coverage — compliance coverage summary
  if (path === "/api/v1/policies/coverage" && method === "GET") {
    const framework = qs.framework ?? undefined;
    try {
      const conditions = ["tenant_id = $1"];
      const vals: unknown[] = [tenantId];
      if (framework) {
        conditions.push(`framework = $${vals.length + 1}`);
        vals.push(framework);
      }
      const where = conditions.join(" AND ");

      const rows = await pool.query(
        `SELECT control_id as "controlId", framework, COUNT(*) as evidence_count
         FROM compliance_evidence WHERE ${where}
         GROUP BY control_id, framework ORDER BY framework, control_id`,
        vals,
      );

      return ok({
        status: "success",
        data: {
          framework: framework ?? "all",
          controls: rows.rows,
          total: rows.rows.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] policy.coverage.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to compute coverage", "INTERNAL_ERROR");
    }
  }

  // ── CDT evaluation ─────────────────────────────────────────────────────────

  // GET /api/v1/cdt/evaluate — CDT (Compliance Decision Tree) evaluation
  if (path === "/api/v1/cdt/evaluate" && method === "GET") {
    const framework = qs.framework ?? undefined;
    try {
      const conditions = ["tenant_id = $1"];
      const vals: unknown[] = [tenantId];
      if (framework) {
        conditions.push(`framework = $${vals.length + 1}`);
        vals.push(framework);
      }
      const where = conditions.join(" AND ");

      const evidenceRows = await pool.query(
        `SELECT control_id as "controlId", framework, source, created_at as "createdAt"
         FROM compliance_evidence WHERE ${where}
         ORDER BY framework, control_id, created_at DESC`,
        vals,
      );

      // Group by control_id and compute status
      const controlMap = new Map<
        string,
        {
          controlId: string;
          framework?: string;
          evidenceCount: number;
          latestAt?: string;
          status: string;
        }
      >();
      for (const row of evidenceRows.rows) {
        const key = `${row.framework ?? "unknown"}:${row.controlId}`;
        if (!controlMap.has(key)) {
          controlMap.set(key, {
            controlId: row.controlId,
            framework: row.framework,
            evidenceCount: 0,
            status: "not_started",
          });
        }
        const entry = controlMap.get(key)!;
        entry.evidenceCount++;
        entry.latestAt = entry.latestAt ?? row.createdAt;
        entry.status =
          entry.evidenceCount >= 3
            ? "verified"
            : entry.evidenceCount >= 1
              ? "implemented"
              : "not_started";
      }

      const evaluations = Array.from(controlMap.values());
      const totalScore =
        evaluations.length === 0
          ? 0
          : evaluations.reduce((sum, e) => {
              const weights: Record<string, number> = {
                not_started: 0,
                in_progress: 0.25,
                implemented: 0.75,
                verified: 1.0,
              };
              return sum + (weights[e.status] ?? 0);
            }, 0) / evaluations.length;

      return ok({
        status: "success",
        data: { framework: framework ?? "all", evaluations, score: Math.round(totalScore * 100) },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] cdt.evaluate.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "CDT evaluation failed", "INTERNAL_ERROR");
    }
  }

  // ── Workflow automation routes ──────────────────────────────────────────────

  // POST /api/v1/workflows/execute — execute a workflow
  if (path === "/api/v1/workflows/execute" && method === "POST") {
    const b = parseBody(event) as {
      workflowType?: string;
      subjectRef?: string;
      idempotencyKey?: string;
    };
    if (!b.workflowType) return fail(400, "workflowType is required", "VALIDATION_FAILED");

    const validTypes = ["joiner", "mover", "leaver"];
    if (!validTypes.includes(b.workflowType)) {
      return fail(
        400,
        `workflowType must be one of: ${validTypes.join(", ")}`,
        "VALIDATION_FAILED",
      );
    }

    if (b.idempotencyKey) {
      const existing = await pool.query(
        `SELECT id, status FROM workflow_executions WHERE idempotency_key = $1 AND tenant_id = $2`,
        [b.idempotencyKey, tenantId],
      );
      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        return ok({
          status: "success",
          data: { id: row.id, status: row.status, idempotentHit: true },
          timestamp: new Date().toISOString(),
        });
      }
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO workflow_executions (id, tenant_id, workflow_type, subject_ref, status, idempotency_key, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, NOW())`,
      [id, tenantId, b.workflowType, b.subjectRef ?? null, b.idempotencyKey ?? null],
    );

    // Enqueue via SQS for async execution
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: id,
      stepIndex: 0,
      action: b.workflowType,
      payload: { subjectRef: b.subjectRef },
    });

    return ok(
      {
        status: "success",
        data: { id, status: "pending", idempotentHit: false },
        timestamp: new Date().toISOString(),
      },
      202,
    );
  }

  // GET /api/v1/workflows/executions/:id — get workflow execution
  const workflowExecMatch = path.match(/^\/api\/v1\/workflows\/executions\/([^/]+)$/);
  if (workflowExecMatch && method === "GET") {
    const [, executionId] = workflowExecMatch;
    const row = await pool.query(
      `SELECT id, tenant_id as "tenantId", workflow_type as "workflowType",
              subject_ref as "subjectRef", status, created_at as "createdAt",
              completed_at as "completedAt"
       FROM workflow_executions WHERE id = $1 AND tenant_id = $2`,
      [executionId, tenantId],
    );
    if (row.rows.length === 0) return fail(404, "Execution not found", "NOT_FOUND");
    return ok({ status: "success", data: row.rows[0], timestamp: new Date().toISOString() });
  }

  // ── Evidence routes (continued) ─────────────────────────────────────────────

  // POST /api/v1/evidence/collect — pull evidence from connected adapters
  if (path === "/api/v1/evidence/collect" && method === "POST") {
    // Get configured adapter URLs from env
    let adapterUrls: Record<string, string>;
    try {
      adapterUrls = JSON.parse(process.env.ADAPTER_URLS ?? "{}") as Record<string, string>;
    } catch (parseErr) {
      return fail(
        500,
        `Invalid ADAPTER_URLS configuration: ${(parseErr as Error).message}`,
        "CONFIG_ERROR",
      );
    }
    if (Object.keys(adapterUrls).length === 0) {
      return ok({
        status: "success",
        data: { collected: 0, adapters: [], items: [] },
        timestamp: new Date().toISOString(),
      });
    }

    // Skip adapter calls if API key is not configured
    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (!internalApiKey) {
      console.warn(
        "[compliance-api] INTERNAL_API_KEY not configured, skipping adapter evidence collection",
      );
      return ok({
        status: "success",
        data: { collected: 0, adapters: [], items: [], warning: "INTERNAL_API_KEY not configured" },
        timestamp: new Date().toISOString(),
      });
    }

    const allItems: Array<{
      adapter: string;
      type: string;
      status: string;
      controlRefs: string[];
      details: Record<string, unknown>;
    }> = [];
    const adaptersCollected: string[] = [];

    // Fetch evidence from each adapter
    const adapterErrors: Array<{ adapter: string; error: string }> = [];
    for (const [slug, adapterUrl] of Object.entries(adapterUrls)) {
      try {
        const res = await fetch(`${adapterUrl}/api/evidence`, {
          method: "GET",
          headers: {
            "X-Tenant-ID": tenantId,
            "X-API-Key": internalApiKey,
          },
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            items?: Array<{
              type: string;
              status: string;
              controlRefs?: string[];
              details?: Record<string, unknown>;
            }>;
          };
          if (data.items?.length) {
            adaptersCollected.push(slug);
            for (const item of data.items) {
              allItems.push({
                adapter: slug,
                type: item.type,
                status: item.status,
                controlRefs: item.controlRefs ?? [],
                details: item.details ?? {},
              });
              // Store each item as compliance_evidence per control ref
              for (const controlRef of item.controlRefs ?? []) {
                const { framework, controlId } = parseControlRef(controlRef);
                try {
                  await pool.query(
                    `INSERT INTO compliance_evidence
                       (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
                     SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
                     WHERE NOT EXISTS (
                       SELECT 1
                       FROM compliance_evidence
                       WHERE tenant_id = $2
                         AND framework = $3
                         AND control_id = $4
                         AND source_id = $8
                     )`,
                    [
                      crypto.randomUUID(),
                      tenantId,
                      framework,
                      controlId,
                      controlRef,
                      "adapter_pull",
                      `adapter:${slug}`,
                      `${slug}:${item.type}:${framework}:${controlId}`,
                      "system",
                      `${slug} ${item.type}`,
                      JSON.stringify({
                        impact:
                          item.status === "pass"
                            ? "positive"
                            : item.status === "fail"
                              ? "detrimental"
                              : "neutral",
                        confidence: item.status === "unknown" ? 0.3 : 0.8,
                        details: item.details,
                      }),
                    ],
                  );
                } catch (dbErr) {
                  console.error(`[compliance-api] evidence.collect.db.error`, {
                    requestId,
                    adapter: slug,
                    controlRef,
                    error: (dbErr as Error).message,
                  });
                }
              }
            }
          }
        } else {
          const errMsg = `HTTP ${res.status}`;
          console.error(`[compliance-api] evidence.collect.adapter.error`, {
            requestId,
            adapter: slug,
            error: errMsg,
          });
          adapterErrors.push({ adapter: slug, error: errMsg });
        }
      } catch (fetchErr) {
        const errMsg = (fetchErr as Error).message;
        console.error(`[compliance-api] evidence.collect.adapter.error`, {
          requestId,
          adapter: slug,
          error: errMsg,
        });
        adapterErrors.push({ adapter: slug, error: errMsg });
      }
    }

    return ok({
      status: "success",
      data: {
        collected: allItems.length,
        adapters: adaptersCollected,
        items: allItems,
        ...(adapterErrors.length > 0 ? { errors: adapterErrors } : {}),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/evidence/search — search evidence
  if (path === "/api/evidence/search" && method === "GET") {
    const framework = qs.framework ?? undefined;
    const controlId = qs.controlId ?? undefined;
    const source = qs.source ?? undefined;
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 200);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;

    const conditions = ["tenant_id = $1"];
    const vals: unknown[] = [tenantId];

    if (framework) {
      conditions.push(`framework = $${vals.length + 1}`);
      vals.push(framework);
    }
    if (controlId) {
      conditions.push(`control_id = $${vals.length + 1}`);
      vals.push(controlId);
    }
    if (source) {
      conditions.push(`source = $${vals.length + 1}`);
      vals.push(source);
    }

    const where = conditions.join(" AND ");
    const rows = await pool.query(
      `SELECT id, tenant_id as "tenantId", framework, control_id as "controlId",
              control_name as "controlName", evidence_type as "evidenceType",
              source, source_id as "sourceId", actor, subject, metadata, created_at as "createdAt"
       FROM compliance_evidence WHERE ${where}
       ORDER BY created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
      [...vals, limit, offset],
    );

    const countRow = await pool.query(
      `SELECT COUNT(*) as cnt FROM compliance_evidence WHERE ${where}`,
      vals,
    );

    return ok({
      status: "success",
      data: {
        items: rows.rows,
        total: parseInt(countRow.rows[0]?.cnt ?? "0", 10),
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/policies/evaluate-all — bulk evaluate all policies
  if (path === "/api/v1/policies/evaluate-all" && method === "POST") {
    // Evaluate all controls based on evidence
    const evidenceRows = await pool.query(
      `SELECT control_id as "controlId", framework, COUNT(*) as evidence_count
       FROM compliance_evidence WHERE tenant_id = $1
       GROUP BY control_id, framework`,
      [tenantId],
    );

    const evaluations: Array<{
      controlId: string;
      framework: string;
      status: string;
      evidenceCount: number;
    }> = [];
    for (const row of evidenceRows.rows) {
      const evidenceCount = parseInt(row.evidence_count, 10);
      let status = "not_started";
      if (evidenceCount >= MIN_EVIDENCE_FOR_VERIFIED) status = "verified";
      else if (evidenceCount >= MIN_EVIDENCE_FOR_IMPLEMENTED) status = "implemented";
      evaluations.push({
        controlId: row.controlId,
        framework: row.framework ?? "unknown",
        status,
        evidenceCount,
      });
    }

    const totalScore =
      evaluations.length === 0
        ? 0
        : evaluations.reduce((sum, e) => {
            const weights: Record<string, number> = {
              not_started: 0,
              in_progress: 0.25,
              implemented: 0.75,
              verified: 1.0,
            };
            return sum + (weights[e.status] ?? 0);
          }, 0) / evaluations.length;

    return ok({
      status: "success",
      data: {
        evaluated: evaluations.length,
        evaluations,
        score: Math.round(totalScore * 100),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // GET /api/v1/policies/coverage/:framework — compliance coverage for a specific framework
  const coverageFrameworkMatch = path.match(/^\/api\/v1\/policies\/coverage\/([^/]+)$/);
  if (coverageFrameworkMatch && method === "GET") {
    let framework: string;
    try {
      framework = decodeURIComponent(coverageFrameworkMatch[1]).trim();
    } catch {
      return fail(400, "Invalid framework", "VALIDATION_FAILED");
    }

    const rows = await pool.query(
      `SELECT control_id as "controlId", framework, COUNT(*) as evidence_count
       FROM compliance_evidence WHERE tenant_id = $1 AND framework = $2
       GROUP BY control_id, framework ORDER BY control_id`,
      [tenantId, framework],
    );

    return ok({
      status: "success",
      data: {
        framework,
        controls: rows.rows,
        total: rows.rows.length,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // ── Legacy evidence routes (pre-v1 paths) ─────────────────────────────────

  // POST /api/evidence/ingest — legacy evidence ingestion path
  if (path === "/api/evidence/ingest" && method === "POST") {
    const b = parseBody(event) as {
      payload?: unknown;
      pack?: string;
      subject?: string;
    };
    if (!b.payload) return fail(400, "payload is required", "VALIDATION_FAILED");

    const canonical = JSON.stringify(b.payload);
    const hash = sha256(canonical);
    const key = `evidence/${tenantId}/${hash}`;

    try {
      await svc.evidenceRepo.put(key, canonical, "application/json");

      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO compliance_evidence
           (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
         ON CONFLICT DO NOTHING`,
        [
          id,
          tenantId,
          null,
          null,
          null,
          "manual",
          b.pack ?? "api",
          hash,
          auth.userId,
          b.subject ?? null,
          JSON.stringify({ pack: b.pack, hash }),
        ],
      );

      await svc.auditRepo.log({
        tenantId,
        actorId: auth.userId,
        actorType: "user",
        action: "evidence.ingested",
        resourceType: "evidence",
        resourceId: hash,
        correlationId: requestId,
      });

      return ok(
        { status: "success", data: { id, hash, key }, timestamp: new Date().toISOString() },
        201,
      );
    } catch (e) {
      console.error("[compliance-api] evidence.legacy-ingest.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to ingest evidence", "INTERNAL_ERROR");
    }
  }

  // GET /api/evidence/* — legacy evidence retrieval (dynamic paths)
  // Matches /api/evidence/{hash} and /api/evidence/{hash}/verify
  if (path.startsWith("/api/evidence/") && method === "GET") {
    const segments = path.split("/").filter(Boolean); // [api, evidence, {hash}, ?verify]
    const hash = segments[2];
    if (!hash) return fail(400, "Missing evidence hash", "VALIDATION_FAILED");

    const isVerify = segments[3] === "verify" || qs.verify === "1";
    const key = `evidence/${tenantId}/${hash}`;

    try {
      const content = await svc.evidenceRepo.get(key);
      if (!content) return fail(404, "Evidence not found", "NOT_FOUND");

      if (isVerify) {
        const actualHash = sha256(content);
        const verified = actualHash === hash;
        return ok({
          status: "success",
          data: { hash, verified, actualHash },
          timestamp: new Date().toISOString(),
        });
      }

      return ok({
        status: "success",
        data: { hash, content: JSON.parse(content) },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] evidence.legacy-get.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to retrieve evidence", "INTERNAL_ERROR");
    }
  }

  // ── Activity log ────────────────────────────────────────────────────────────

  // GET /api/v1/activity — activity log (uses activity_stream table in PostgreSQL schema)
  if (path === "/api/v1/activity" && method === "GET") {
    const type = qs.type ?? undefined;
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "25", 10) || 25, 1), 100);
    const cursorRaw = qs.cursor ? parseInt(qs.cursor, 10) : null;

    if (qs.cursor && (isNaN(cursorRaw as number) || (cursorRaw as number) <= 0)) {
      return fail(400, "Invalid cursor", "VALIDATION_FAILED");
    }

    try {
      const conditions = [`tenant_id = $1`];
      const vals: unknown[] = [tenantId];

      if (type) {
        conditions.push(`event_type = $${vals.length + 1}`);
        vals.push(type);
      }
      if (cursorRaw) {
        conditions.push(`id < $${vals.length + 1}`);
        vals.push(cursorRaw);
      }

      const where = conditions.join(" AND ");
      const rows = await pool.query(
        `SELECT id, tenant_id as "tenantId", event_type as "type", severity, title, detail as "message",
                entity_type as "ref", actor, created_at as "createdAt"
         FROM activity_stream WHERE ${where}
         ORDER BY id DESC LIMIT $${vals.length + 1}`,
        [...vals, limit + 1],
      );

      const hasNext = rows.rows.length > limit;
      const items = rows.rows.slice(0, limit);
      const nextCursor = hasNext ? (items[items.length - 1]?.id ?? null) : null;

      return ok({
        status: "success",
        data: { items, nextCursor },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] activity.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to load activity", "INTERNAL_ERROR");
    }
  }

  // ── Incidents ───────────────────────────────────────────────────────────────

  // GET /api/v1/incidents — list incidents (uses incidents table in PostgreSQL schema)
  if (path === "/api/v1/incidents" && method === "GET") {
    const status = qs.status ?? undefined;
    const severity = qs.severity ?? undefined;
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "20", 10) || 20, 1), 50);
    const cursorRaw = qs.cursor ? parseInt(qs.cursor, 10) : null;

    try {
      const conditions = [`tenant_id = $1`];
      const vals: unknown[] = [tenantId];

      if (status) {
        conditions.push(`status = $${vals.length + 1}`);
        vals.push(status);
      }
      if (severity) {
        conditions.push(`severity = $${vals.length + 1}`);
        vals.push(severity);
      }
      if (cursorRaw) {
        conditions.push(`id < $${vals.length + 1}`);
        vals.push(cursorRaw);
      }

      const where = conditions.join(" AND ");
      const rows = await pool.query(
        `SELECT id, tenant_id as "tenantId", title, severity, status, source,
                created_at as "createdAt", resolved_at as "resolvedAt"
         FROM incidents WHERE ${where}
         ORDER BY created_at DESC LIMIT $${vals.length + 1}`,
        [...vals, limit + 1],
      );

      const hasNext = rows.rows.length > limit;
      const items = rows.rows.slice(0, limit);
      const nextCursor = hasNext ? (items[items.length - 1]?.id ?? null) : null;

      return ok({
        status: "success",
        data: { items, nextCursor },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] incidents.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to list incidents", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/incidents — create incident
  if (path === "/api/v1/incidents" && method === "POST") {
    const b = parseBody(event) as { title?: string; severity?: string; source?: string };
    const title = typeof b.title === "string" ? b.title.trim() : "";
    const severity = typeof b.severity === "string" ? b.severity.trim().toLowerCase() : "";

    if (!title) return fail(400, "title is required", "VALIDATION_FAILED");
    const validSeverities = new Set(["critical", "high", "medium", "low"]);
    if (!severity || !validSeverities.has(severity)) {
      return fail(400, "severity must be one of: critical, high, medium, low", "VALIDATION_FAILED");
    }

    try {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO incidents (id, tenant_id, title, severity, status, source, created_at)
         VALUES ($1, $2, $3, $4, 'open', $5, NOW())`,
        [id, tenantId, title, severity, b.source ?? null],
      );

      const incident = await pool.query(
        `SELECT id, tenant_id as "tenantId", title, severity, status, source,
                created_at as "createdAt", resolved_at as "resolvedAt"
         FROM incidents WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );

      await svc.auditRepo.log({
        tenantId,
        actorId: auth.userId,
        actorType: "user",
        action: "incident.created",
        resourceType: "incident",
        resourceId: id,
        correlationId: requestId,
      });

      return ok(
        {
          status: "success",
          data: { incident: incident.rows[0] },
          timestamp: new Date().toISOString(),
        },
        201,
      );
    } catch (e) {
      console.error("[compliance-api] incidents.create.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to create incident", "INTERNAL_ERROR");
    }
  }

  // ── Access Requests ─────────────────────────────────────────────────────────

  // GET /api/v1/access-requests — list access requests
  if (path === "/api/v1/access-requests" && method === "GET") {
    const status = qs.status ?? undefined;
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "20", 10) || 20, 1), 100);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;

    try {
      const conditions = ["tenant_id = $1"];
      const vals: unknown[] = [tenantId];
      if (status) {
        conditions.push(`status = $${vals.length + 1}`);
        vals.push(status);
      }
      const where = conditions.join(" AND ");

      const rows = await pool.query(
        `SELECT id, tenant_id as "tenantId", requester_id as "requesterId",
                requester_email as "requesterEmail", resource_type as "resourceType",
                resource_id as "resourceId", resource_name as "resourceName",
                justification, status, decided_by as "decidedBy",
                decided_at as "decidedAt", expires_at as "expiresAt",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM access_requests WHERE ${where}
         ORDER BY created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
        [...vals, limit, offset],
      );

      const countRow = await pool.query(
        `SELECT COUNT(*) as cnt FROM access_requests WHERE ${where}`,
        vals,
      );

      return ok({
        status: "success",
        data: {
          items: rows.rows,
          total: parseInt(countRow.rows[0]?.cnt ?? "0", 10),
          limit,
          offset,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] access-requests.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to list access requests", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/access-requests — create access request
  if (path === "/api/v1/access-requests" && method === "POST") {
    const b = parseBody(event) as {
      resourceType?: string;
      resourceId?: string;
      resourceName?: string;
      justification?: string;
      expiresAt?: string;
    };

    if (!b.resourceType || !b.resourceId) {
      return fail(400, "resourceType and resourceId are required", "VALIDATION_FAILED");
    }
    const validTypes = ["app", "group", "role"];
    if (!validTypes.includes(b.resourceType)) {
      return fail(
        400,
        `resourceType must be one of: ${validTypes.join(", ")}`,
        "VALIDATION_FAILED",
      );
    }

    try {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO access_requests
           (id, tenant_id, requester_id, requester_email, resource_type, resource_id,
            resource_name, justification, status, expires_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW(), NOW())`,
        [
          id,
          tenantId,
          auth.userId,
          auth.email ?? null,
          b.resourceType,
          b.resourceId,
          b.resourceName ?? null,
          b.justification ?? null,
          b.expiresAt ?? null,
        ],
      );

      await svc.auditRepo.log({
        tenantId,
        actorId: auth.userId,
        actorType: "user",
        action: "access_request.created",
        resourceType: "access_request",
        resourceId: id,
        correlationId: requestId,
      });

      const created = await pool.query(
        `SELECT id, tenant_id as "tenantId", requester_id as "requesterId",
                resource_type as "resourceType", resource_id as "resourceId",
                resource_name as "resourceName", justification, status,
                created_at as "createdAt"
         FROM access_requests WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId],
      );

      return ok(
        {
          status: "success",
          data: created.rows[0],
          timestamp: new Date().toISOString(),
        },
        201,
      );
    } catch (e) {
      console.error("[compliance-api] access-requests.create.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to create access request", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/access-requests/:id/approve or /deny — update access request status
  const accessRequestUpdateMatch = path.match(
    /^\/api\/v1\/access-requests\/([^/]+)\/(approve|deny)$/,
  );
  if (accessRequestUpdateMatch && method === "POST") {
    const [, arId, action] = accessRequestUpdateMatch;
    const newStatus = action === "approve" ? "approved" : "denied";

    try {
      const existing = await pool.query(
        "SELECT id, status FROM access_requests WHERE id = $1 AND tenant_id = $2",
        [arId, tenantId],
      );
      if (existing.rows.length === 0) return fail(404, "Access request not found", "NOT_FOUND");
      if (existing.rows[0].status !== "pending") {
        return fail(409, `Request already ${existing.rows[0].status}`, "CONFLICT");
      }

      await pool.query(
        `UPDATE access_requests
         SET status = $1, decided_by = $2, decided_at = NOW(), updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4`,
        [newStatus, auth.userId, arId, tenantId],
      );

      await svc.auditRepo.log({
        tenantId,
        actorId: auth.userId,
        actorType: "user",
        action: `access_request.${action}d`,
        resourceType: "access_request",
        resourceId: arId,
        correlationId: requestId,
      });

      return ok({
        status: "success",
        data: { id: arId, status: newStatus, decidedBy: auth.userId },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] access-requests.update.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to update access request", "INTERNAL_ERROR");
    }
  }

  // ── Access Reviews (placeholder — schema not yet in PG) ────────────────────

  // GET /api/v1/access-reviews — placeholder, returns empty list until schema is added
  if (path === "/api/v1/access-reviews" && method === "GET") {
    return ok({
      status: "success",
      data: { items: [], total: 0 },
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/access-reviews — placeholder
  if (path === "/api/v1/access-reviews" && method === "POST") {
    return ok(
      {
        status: "success",
        data: { id: "placeholder", status: "created" },
        timestamp: new Date().toISOString(),
      },
      201,
    );
  }

  // ── Notifications ───────────────────────────────────────────────────────────

  // GET /api/v1/notifications — list notifications for current user
  if (path === "/api/v1/notifications" && method === "GET") {
    const unreadOnly = qs.unread === "true";
    const limit = Math.min(Math.max(parseInt(qs.limit ?? "20", 10) || 20, 1), 100);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;

    try {
      const conditions = ["tenant_id = $1", "user_id = $2"];
      const vals: unknown[] = [tenantId, auth.userId];
      if (unreadOnly) {
        conditions.push("read_at IS NULL");
      }
      const where = conditions.join(" AND ");

      const rows = await pool.query(
        `SELECT id, tenant_id as "tenantId", user_id as "userId", type, channel,
                title, body, severity, source_type as "sourceType",
                source_id as "sourceId", source_label as "sourceLabel",
                read_at as "readAt", action_url as "actionUrl", metadata,
                created_at as "createdAt"
         FROM notifications WHERE ${where}
         ORDER BY created_at DESC LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
        [...vals, limit, offset],
      );

      const unreadCount = await pool.query(
        `SELECT COUNT(*) as cnt FROM notifications
         WHERE tenant_id = $1 AND user_id = $2 AND read_at IS NULL`,
        [tenantId, auth.userId],
      );

      return ok({
        status: "success",
        data: {
          items: rows.rows,
          unreadCount: parseInt(unreadCount.rows[0]?.cnt ?? "0", 10),
          limit,
          offset,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] notifications.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to list notifications", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/notifications/read — mark specific notifications as read
  if (path === "/api/v1/notifications/read" && method === "POST") {
    const b = parseBody(event) as { ids?: string[] };
    if (!b.ids?.length) return fail(400, "ids array is required", "VALIDATION_FAILED");

    try {
      const result = await pool.query(
        `UPDATE notifications SET read_at = NOW()
         WHERE id = ANY($1::uuid[]) AND tenant_id = $2 AND user_id = $3 AND read_at IS NULL`,
        [b.ids, tenantId, auth.userId],
      );

      return ok({
        status: "success",
        data: { marked: result.rowCount ?? 0 },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] notifications.read.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to mark notifications as read", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/notifications/read-all — mark all notifications as read
  if (path === "/api/v1/notifications/read-all" && method === "POST") {
    try {
      const result = await pool.query(
        `UPDATE notifications SET read_at = NOW()
         WHERE tenant_id = $1 AND user_id = $2 AND read_at IS NULL`,
        [tenantId, auth.userId],
      );

      return ok({
        status: "success",
        data: { marked: result.rowCount ?? 0 },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] notifications.read-all.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to mark all notifications as read", "INTERNAL_ERROR");
    }
  }

  // ── Admin ───────────────────────────────────────────────────────────────────

  // POST /api/v1/admin/retention/policies/purge — purge stale generated policies
  if (path === "/api/v1/admin/retention/policies/purge" && method === "POST") {
    const b = parseBody(event) as { dryRun?: boolean };
    const dryRun = b.dryRun !== false; // default true — must explicitly pass false to delete
    const retentionDays = parseInt(process.env.RETENTION_DAYS_POLICIES ?? "90", 10) || 90;
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000).toISOString();

    try {
      const candidates = await pool.query(
        `SELECT id, hash, template_key, created_at as "createdAt"
         FROM generated_policies WHERE tenant_id = $1 AND created_at < $2`,
        [tenantId, cutoff],
      );

      let deleted = 0;
      if (!dryRun && candidates.rows.length > 0) {
        const hashes = candidates.rows.map((r) => r.hash as string);
        await pool.query(
          `DELETE FROM generated_policies WHERE tenant_id = $1 AND hash = ANY($2::text[])`,
          [tenantId, hashes],
        );
        deleted = hashes.length;
      }

      console.info("[compliance-api] policies.retention.purge", {
        requestId,
        tenantId,
        dryRun,
        retentionDays,
        cutoff,
        candidates: candidates.rows.length,
        deleted,
      });

      return ok({
        status: "success",
        data: {
          dryRun,
          retentionDays,
          cutoff,
          candidates: candidates.rows.length,
          deleted: dryRun ? 0 : deleted,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] policies.retention.purge.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to run retention purge", "INTERNAL_ERROR");
    }
  }

  // ── JML Demo ────────────────────────────────────────────────────────────────

  // GET /api/v1/workflows/demo/jml — demo JML workflow documentation
  if (path === "/api/v1/workflows/demo/jml" && method === "GET") {
    return ok({
      status: "success",
      data: {
        demo: true,
        workflowTypes: ["joiner", "mover", "leaver"],
        exampleExecute: {
          endpoint: "/api/v1/workflows/execute",
          method: "POST",
          payload: {
            workflowType: "joiner",
            subjectRef: "user:alice@example.com",
            idempotencyKey: "<optional-unique-id>",
          },
        },
        note: "POST to /api/v1/workflows/execute with a valid workflowType (joiner|mover|leaver) and subjectRef to run a JML workflow. This endpoint is a documentation/demo helper and performs no execution itself.",
      },
      timestamp: new Date().toISOString(),
    });
  }

  // ── Workflow executions (list) ───────────────────────────────────────────────

  // GET /api/v1/workflows/executions/* — list or retrieve workflow executions
  // Handles: /api/v1/workflows/executions (list) and /api/v1/workflows/executions/:id (get by ID)
  // Note: the single-item GET /api/v1/workflows/executions/:id is already handled above;
  // this block handles additional sub-path variants.
  const workflowExecListMatch = path.match(/^\/api\/v1\/workflows\/executions(?:\/([^/]+))?$/);
  if (workflowExecListMatch && method === "GET") {
    const executionId = workflowExecListMatch[1];

    if (executionId) {
      // Already handled above by workflowExecMatch — this is a fallback for safety
      const row = await pool.query(
        `SELECT id, tenant_id as "tenantId", workflow_type as "workflowType",
                subject_ref as "subjectRef", status, created_at as "createdAt",
                completed_at as "completedAt"
         FROM workflow_executions WHERE id = $1 AND tenant_id = $2`,
        [executionId, tenantId],
      );
      if (row.rows.length === 0) return fail(404, "Execution not found", "NOT_FOUND");
      return ok({ status: "success", data: row.rows[0], timestamp: new Date().toISOString() });
    }

    // List executions for tenant
    const statusFilter = qs.status ?? undefined;
    const limitVal = Math.min(Math.max(parseInt(qs.limit ?? "20", 10) || 20, 1), 100);
    const cursorVal = qs.cursor ?? null;

    const conditions = [`tenant_id = $1`];
    const vals: unknown[] = [tenantId];
    if (statusFilter) {
      conditions.push(`status = $${vals.length + 1}`);
      vals.push(statusFilter);
    }
    if (cursorVal) {
      conditions.push(`created_at < $${vals.length + 1}`);
      vals.push(cursorVal);
    }

    const where = conditions.join(" AND ");
    try {
      const rows = await pool.query(
        `SELECT id, tenant_id as "tenantId", workflow_type as "workflowType",
                subject_ref as "subjectRef", status, created_at as "createdAt",
                completed_at as "completedAt"
         FROM workflow_executions WHERE ${where}
         ORDER BY created_at DESC LIMIT $${vals.length + 1}`,
        [...vals, limitVal + 1],
      );

      const hasNext = rows.rows.length > limitVal;
      const items = rows.rows.slice(0, limitVal);
      const nextCursor = hasNext ? (items[items.length - 1]?.["createdAt"] ?? null) : null;

      return ok({
        status: "success",
        data: { items, nextCursor, total: items.length },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] workflows.executions.list.error", {
        requestId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to list workflow executions", "INTERNAL_ERROR");
    }
  }

  // ── Policy CRUD + acknowledgement routes ────────────────────────────────────

  // GET /api/v1/policies — list policies for tenant
  if (path === "/api/v1/policies" && method === "GET") {
    const status = qs.status ?? undefined;
    const category = qs.category ?? undefined;
    const limit = Math.min(parseInt(qs.limit ?? "50", 10) || 50, 200);
    const offset = parseInt(qs.offset ?? "0", 10) || 0;

    const conditions = ["tenant_id = $1"];
    const vals: unknown[] = [tenantId];

    if (status) {
      conditions.push(`status = $${vals.length + 1}`);
      vals.push(status);
    }
    if (category) {
      conditions.push(`category = $${vals.length + 1}`);
      vals.push(category);
    }

    const where = conditions.join(" AND ");
    try {
      const rows = await pool.query(
        `SELECT p.id, p.tenant_id as "tenantId", p.name, p.category, p.version, p.status,
                p.framework_refs as "frameworkRefs", p.created_by as "createdBy",
                p.created_at as "createdAt", p.updated_at as "updatedAt",
                p.published_at as "publishedAt",
                COUNT(a.id)::int as "ackCount"
         FROM policies p
         LEFT JOIN policy_acknowledgements a ON a.policy_id = p.id AND a.tenant_id = p.tenant_id
         WHERE ${where}
         GROUP BY p.id
         ORDER BY p.updated_at DESC
         LIMIT $${vals.length + 1} OFFSET $${vals.length + 2}`,
        [...vals, limit, offset],
      );
      const countRow = await pool.query(
        `SELECT COUNT(*) as cnt FROM policies WHERE ${where}`,
        vals,
      );
      return ok({
        status: "success",
        data: {
          items: rows.rows,
          total: parseInt(countRow.rows[0]?.cnt ?? "0", 10),
          limit,
          offset,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] policies.list.error", {
        requestId,
        tenantId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to list policies", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/policies — create policy (admin only)
  if (path === "/api/v1/policies" && method === "POST") {
    if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
    const b = parseBody(event) as {
      name?: string;
      category?: string;
      version?: string;
      content?: string;
      frameworkRefs?: string[];
    };
    if (!b.name?.trim()) return fail(400, "name is required", "VALIDATION_FAILED");
    if (!b.category?.trim()) return fail(400, "category is required", "VALIDATION_FAILED");
    if (!b.content?.trim()) return fail(400, "content is required", "VALIDATION_FAILED");

    const VALID_CATEGORIES = [
      "access-control",
      "incident-response",
      "data-protection",
      "vendor",
      "acceptable-use",
      "byod",
      "retention",
      "other",
    ];
    if (!VALID_CATEGORIES.includes(b.category)) {
      return fail(
        400,
        `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
        "VALIDATION_FAILED",
      );
    }

    try {
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO policies (id, tenant_id, name, category, version, content, status, framework_refs, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, NOW(), NOW())`,
        [
          id,
          tenantId,
          b.name.trim(),
          b.category,
          b.version?.trim() ?? "1.0",
          b.content.trim(),
          b.frameworkRefs ?? [],
          auth.email ?? auth.userId,
        ],
      );
      const row = await pool.query(
        `SELECT id, tenant_id as "tenantId", name, category, version, status,
                framework_refs as "frameworkRefs", created_by as "createdBy",
                created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
         FROM policies WHERE id = $1`,
        [id],
      );
      return ok({ status: "success", data: row.rows[0], timestamp: new Date().toISOString() }, 201);
    } catch (e) {
      console.error("[compliance-api] policies.create.error", {
        requestId,
        tenantId,
        error: (e as Error).message,
      });
      return fail(500, "Failed to create policy", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/policies/:id — fetch single policy + ack count
  {
    const m = path.match(/^\/api\/v1\/policies\/([^/]+)$/);
    if (m && method === "GET") {
      const policyId = m[1];
      try {
        const row = await pool.query(
          `SELECT p.id, p.tenant_id as "tenantId", p.name, p.category, p.version, p.content,
                  p.status, p.framework_refs as "frameworkRefs", p.created_by as "createdBy",
                  p.created_at as "createdAt", p.updated_at as "updatedAt",
                  p.published_at as "publishedAt",
                  COUNT(a.id)::int as "ackCount"
           FROM policies p
           LEFT JOIN policy_acknowledgements a ON a.policy_id = p.id AND a.tenant_id = p.tenant_id
           WHERE p.id = $1 AND p.tenant_id = $2
           GROUP BY p.id`,
          [policyId, tenantId],
        );
        if (row.rows.length === 0) return fail(404, "Policy not found", "NOT_FOUND");
        return ok({ status: "success", data: row.rows[0], timestamp: new Date().toISOString() });
      } catch (e) {
        console.error("[compliance-api] policies.get.error", {
          requestId,
          tenantId,
          error: (e as Error).message,
        });
        return fail(500, "Failed to get policy", "INTERNAL_ERROR");
      }
    }
  }

  // PATCH /api/v1/policies/:id — update policy (admin only)
  {
    const m = path.match(/^\/api\/v1\/policies\/([^/]+)$/);
    if (m && method === "PATCH") {
      if (auth.role !== "admin") return fail(403, "Admin role required", "FORBIDDEN");
      const policyId = m[1];
      const b = parseBody(event) as {
        name?: string;
        category?: string;
        version?: string;
        content?: string;
        status?: string;
        frameworkRefs?: string[];
      };

      try {
        const existing = await pool.query(
          `SELECT id, status FROM policies WHERE id = $1 AND tenant_id = $2`,
          [policyId, tenantId],
        );
        if (existing.rows.length === 0) return fail(404, "Policy not found", "NOT_FOUND");

        const VALID_STATUSES = ["draft", "published", "archived"];
        if (b.status && !VALID_STATUSES.includes(b.status)) {
          return fail(
            400,
            `status must be one of: ${VALID_STATUSES.join(", ")}`,
            "VALIDATION_FAILED",
          );
        }

        const sets: string[] = ["updated_at = NOW()"];
        const vals: unknown[] = [];

        if (b.name !== undefined) {
          vals.push(b.name.trim());
          sets.push(`name = $${vals.length}`);
        }
        if (b.category !== undefined) {
          vals.push(b.category);
          sets.push(`category = $${vals.length}`);
        }
        if (b.version !== undefined) {
          vals.push(b.version.trim());
          sets.push(`version = $${vals.length}`);
        }
        if (b.content !== undefined) {
          vals.push(b.content.trim());
          sets.push(`content = $${vals.length}`);
        }
        if (b.frameworkRefs !== undefined) {
          vals.push(b.frameworkRefs);
          sets.push(`framework_refs = $${vals.length}`);
        }
        if (b.status !== undefined) {
          vals.push(b.status);
          sets.push(`status = $${vals.length}`);
          if (b.status === "published" && existing.rows[0].status !== "published") {
            sets.push("published_at = NOW()");
          }
        }

        vals.push(policyId, tenantId);
        await pool.query(
          `UPDATE policies SET ${sets.join(", ")} WHERE id = $${vals.length - 1} AND tenant_id = $${vals.length}`,
          vals,
        );

        const updated = await pool.query(
          `SELECT id, tenant_id as "tenantId", name, category, version, content, status,
                  framework_refs as "frameworkRefs", created_by as "createdBy",
                  created_at as "createdAt", updated_at as "updatedAt", published_at as "publishedAt"
           FROM policies WHERE id = $1`,
          [policyId],
        );
        return ok({
          status: "success",
          data: updated.rows[0],
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[compliance-api] policies.update.error", {
          requestId,
          tenantId,
          error: (e as Error).message,
        });
        return fail(500, "Failed to update policy", "INTERNAL_ERROR");
      }
    }
  }

  // POST /api/v1/policies/:id/acknowledge — current user acknowledges current version
  {
    const m = path.match(/^\/api\/v1\/policies\/([^/]+)\/acknowledge$/);
    if (m && method === "POST") {
      const policyId = m[1];
      try {
        const policyRow = await pool.query(
          `SELECT id, name, version, status FROM policies WHERE id = $1 AND tenant_id = $2`,
          [policyId, tenantId],
        );
        if (policyRow.rows.length === 0) return fail(404, "Policy not found", "NOT_FOUND");

        const policy = policyRow.rows[0] as {
          id: string;
          name: string;
          version: string;
          status: string;
        };
        if (policy.status !== "published") {
          return fail(400, "Only published policies can be acknowledged", "VALIDATION_FAILED");
        }

        const ackId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO policy_acknowledgements (id, tenant_id, policy_id, user_id, user_email, acknowledged_at, policy_version)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6)
           ON CONFLICT (tenant_id, policy_id, user_id, policy_version) DO NOTHING`,
          [ackId, tenantId, policyId, auth.userId, auth.email ?? null, policy.version],
        );

        // Emit compliance evidence for CDT scoring
        const evidenceId = crypto.randomUUID();
        const evidenceMeta = {
          impact: "positive",
          eventType: "policy.acknowledged",
          reasoning: `User ${auth.email ?? auth.userId} acknowledged policy "${policy.name}" v${policy.version}`,
        };
        await pool.query(
          `INSERT INTO compliance_evidence
             (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
           ON CONFLICT DO NOTHING`,
          [
            evidenceId,
            tenantId,
            "SOC2",
            "CC1.1",
            "Policies and Procedures",
            "manual",
            "policy",
            policyId,
            auth.email ?? auth.userId,
            policy.name,
            JSON.stringify(evidenceMeta),
          ],
        );

        return ok(
          {
            status: "success",
            data: { acknowledged: true, policyId, version: policy.version },
            timestamp: new Date().toISOString(),
          },
          201,
        );
      } catch (e) {
        console.error("[compliance-api] policies.acknowledge.error", {
          requestId,
          tenantId,
          error: (e as Error).message,
        });
        return fail(500, "Failed to record acknowledgement", "INTERNAL_ERROR");
      }
    }
  }

  // GET /api/v1/policies/:id/acknowledgements — list who has acknowledged
  {
    const m = path.match(/^\/api\/v1\/policies\/([^/]+)\/acknowledgements$/);
    if (m && method === "GET") {
      const policyId = m[1];
      try {
        const exists = await pool.query(
          `SELECT id FROM policies WHERE id = $1 AND tenant_id = $2`,
          [policyId, tenantId],
        );
        if (exists.rows.length === 0) return fail(404, "Policy not found", "NOT_FOUND");

        const rows = await pool.query(
          `SELECT id, user_id as "userId", user_email as "userEmail",
                  acknowledged_at as "acknowledgedAt", policy_version as "policyVersion"
           FROM policy_acknowledgements
           WHERE policy_id = $1 AND tenant_id = $2
           ORDER BY acknowledged_at DESC`,
          [policyId, tenantId],
        );
        return ok({
          status: "success",
          data: { items: rows.rows, total: rows.rows.length },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[compliance-api] policies.acks.list.error", {
          requestId,
          tenantId,
          error: (e as Error).message,
        });
        return fail(500, "Failed to list acknowledgements", "INTERNAL_ERROR");
      }
    }
  }

  // ── Audit Package Export ──────────────────────────────────────────────────
  // GET /api/v1/audit-package/:framework — admin-gated, returns a print-ready
  // HTML bundle auditors can save as PDF via the browser (Ctrl+P → Save as PDF).
  // Covers score, per-control state, evidence sample, attestations, policies,
  // incidents, and audit-log entries for a single framework.
  {
    const m = path.match(/^\/api\/v1\/audit-package\/([A-Za-z0-9_-]+)$/);
    if (m && method === "GET") {
      if (auth.role !== "admin" && auth.role !== "owner") {
        return fail(403, "Admin role required", "FORBIDDEN");
      }
      const framework = m[1];
      const sinceParam = qs.since ?? null;
      const format = qs.format === "json" ? "json" : "html";

      try {
        const tenantRow = await pool.query(
          `SELECT id, name, slug, industry, size FROM tenants WHERE id = $1`,
          [auth.tenantId],
        );
        if (tenantRow.rows.length === 0) return fail(404, "Tenant not found", "NOT_FOUND");
        const tenant = tenantRow.rows[0];

        const packRow = await pool.query(
          `SELECT p.id, p.name, p.framework_id, p.controls_count::int as "controlsCount",
                  tcp.pass_count as "passCount", tcp.fail_count as "failCount",
                  tcp.unknown_count as "unknownCount", tcp.last_evaluated_at as "lastEvaluatedAt"
           FROM compliance_packs p
           INNER JOIN tenant_compliance_packs tcp ON tcp.pack_id = p.id
           WHERE tcp.tenant_id = $1 AND p.framework_id = $2`,
          [auth.tenantId, framework],
        );
        if (packRow.rows.length === 0) {
          return fail(404, `No installed pack for framework ${framework}`, "NOT_INSTALLED");
        }
        const pack = packRow.rows[0];
        const sinceDate = sinceParam ?? new Date(Date.now() - 90 * 86400000).toISOString();

        const [controls, evidence, attestations, policies, incidents, auditEntries] =
          await Promise.all([
            pool.query(
              `SELECT c.control_id as "controlId", c.title,
                    COALESCE(s.state, 'unknown') as state,
                    s.rationale, s.evaluated_at as "evaluatedAt",
                    s.evidence_sample_size as "evidenceSampleSize"
             FROM compliance_pack_controls c
             LEFT JOIN tenant_control_state s
               ON s.pack_id = c.pack_id AND s.control_id = c.control_id AND s.tenant_id = $1
             WHERE c.pack_id = $2 ORDER BY c.control_id`,
              [auth.tenantId, pack.id],
            ),
            pool.query(
              `SELECT id, control_id as "controlId", source, actor, metadata, created_at as "createdAt"
             FROM compliance_evidence
             WHERE tenant_id = $1 AND framework = $2 AND created_at > $3::timestamptz
             ORDER BY created_at DESC LIMIT 500`,
              [auth.tenantId, framework, sinceDate],
            ),
            pool.query(
              `SELECT id, control_id as "controlId", attestation_key as "attestationKey",
                    status, statement, attested_by_name as "attestedByName",
                    attested_by_email as "attestedByEmail", attested_at as "attestedAt",
                    revoked_at as "revokedAt", revocation_reason as "revocationReason"
             FROM attestations WHERE tenant_id = $1 AND framework = $2
             ORDER BY attested_at DESC`,
              [auth.tenantId, framework],
            ),
            pool.query(
              `SELECT p.id, p.name, p.category, p.version, p.status, p.published_at as "publishedAt",
                    (SELECT COUNT(*) FROM policy_acknowledgements a WHERE a.policy_id = p.id) as "ackCount"
             FROM policies p
             WHERE p.tenant_id = $1 AND ($2 = ANY(p.framework_refs) OR p.framework_refs = '{}')
             ORDER BY p.updated_at DESC`,
              [auth.tenantId, framework],
            ),
            pool.query(
              `SELECT id, title, severity, status, created_at as "createdAt", resolved_at as "resolvedAt"
             FROM incidents WHERE tenant_id = $1 AND created_at > $2::timestamptz
             ORDER BY created_at DESC LIMIT 50`,
              [auth.tenantId, sinceDate],
            ),
            pool.query(
              `SELECT action, resource_type as "resourceType", actor_id as "actorId",
                    created_at as "createdAt"
             FROM audit_log WHERE tenant_id = $1 AND created_at > $2::timestamptz
             ORDER BY created_at DESC LIMIT 100`,
              [auth.tenantId, sinceDate],
            ),
          ]);

        const score =
          pack.controlsCount > 0 ? Math.round((pack.passCount * 100) / pack.controlsCount) : 0;
        const now = new Date().toISOString();

        const bundle = {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            industry: tenant.industry,
            size: tenant.size,
          },
          framework,
          packName: pack.name,
          score,
          controlsCount: pack.controlsCount,
          passCount: pack.passCount,
          failCount: pack.failCount,
          unknownCount: pack.unknownCount,
          lastEvaluatedAt: pack.lastEvaluatedAt,
          sinceDate,
          generatedAt: now,
          controls: controls.rows,
          evidence: evidence.rows,
          attestations: attestations.rows,
          policies: policies.rows,
          incidents: incidents.rows,
          auditLog: auditEntries.rows,
        };
        const contentHash = crypto
          .createHash("sha256")
          .update(JSON.stringify(bundle))
          .digest("hex");

        if (format === "json") {
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition": `attachment; filename="atlasit-audit-${framework}-${now.slice(0, 10)}.json"`,
            },
            body: JSON.stringify({ ...bundle, contentHash }),
          };
        }
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
          body: renderAuditPackageHtml(bundle, contentHash),
        };
      } catch (e) {
        console.error("[compliance-api] audit-package.error", {
          error: (e as Error).message,
          framework,
        });
        return fail(500, "Failed to generate audit package", "INTERNAL_ERROR");
      }
    }
  }

  // ── Attestations ──────────────────────────────────────────────────────────

  // GET /api/v1/attestations — list tenant's attestations
  if (path === "/api/v1/attestations" && method === "GET") {
    const frameworkFilter = qs.framework ?? null;
    const statusFilter = qs.status ?? null;
    try {
      const conditions = [`tenant_id = $1`];
      const bindings: unknown[] = [auth.tenantId];
      if (frameworkFilter) {
        conditions.push(`framework = $${bindings.length + 1}`);
        bindings.push(frameworkFilter);
      }
      if (statusFilter) {
        conditions.push(`status = $${bindings.length + 1}`);
        bindings.push(statusFilter);
      }
      const rows = await pool.query(
        `SELECT id, framework, control_id as "controlId", attestation_key as "attestationKey",
                status, statement, attested_by_id as "attestedById",
                attested_by_email as "attestedByEmail", attested_by_name as "attestedByName",
                attested_at as "attestedAt", valid_until as "validUntil",
                evidence_ref_ids as "evidenceRefIds",
                revoked_at as "revokedAt", revoked_by as "revokedBy",
                revocation_reason as "revocationReason", created_at as "createdAt"
         FROM attestations
         WHERE ${conditions.join(" AND ")}
         ORDER BY attested_at DESC
         LIMIT 200`,
        bindings,
      );
      const frameworkCounts = await pool.query(
        `SELECT framework, status, COUNT(*) as cnt
         FROM attestations WHERE tenant_id = $1
         GROUP BY framework, status ORDER BY framework`,
        [auth.tenantId],
      );
      return ok({
        status: "success",
        data: {
          items: rows.rows,
          total: rows.rows.length,
          facets: { byFramework: frameworkCounts.rows },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[compliance-api] attestations.list.error", { error: (e as Error).message });
      return fail(500, "Failed to list attestations", "INTERNAL_ERROR");
    }
  }

  // POST /api/v1/attestations — create a new attestation (admin/owner only)
  if (path === "/api/v1/attestations" && method === "POST") {
    if (auth.role !== "admin" && auth.role !== "owner") {
      return fail(403, "Admin role required to create attestations", "FORBIDDEN");
    }
    const body = parseBody(event) as {
      framework?: string;
      controlId?: string;
      attestationKey?: string;
      statement?: string;
      validUntil?: string;
      evidenceRefIds?: string[];
    };
    if (!body.framework || !body.controlId || !body.attestationKey || !body.statement) {
      return fail(
        400,
        "framework, controlId, attestationKey, statement required",
        "VALIDATION_FAILED",
      );
    }
    try {
      const id = crypto.randomUUID();
      const userRow = await pool.query(
        `SELECT email, display_name FROM users WHERE id = $1 AND tenant_id = $2`,
        [auth.userId, auth.tenantId],
      );
      const email = userRow.rows[0]?.email ?? null;
      const name = userRow.rows[0]?.display_name ?? email ?? auth.userId;

      await pool.query(
        `INSERT INTO attestations
           (id, tenant_id, framework, control_id, attestation_key, status, statement,
            attested_by_id, attested_by_email, attested_by_name, attested_at, valid_until,
            evidence_ref_ids, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9, NOW(), $10, $11, NOW(), NOW())`,
        [
          id,
          auth.tenantId,
          body.framework,
          body.controlId,
          body.attestationKey,
          body.statement,
          auth.userId,
          email,
          name,
          body.validUntil ?? null,
          body.evidenceRefIds ?? [],
        ],
      );

      // Emit positive compliance evidence — attestation is strong proof the control is working.
      const evId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO compliance_evidence
           (id, tenant_id, framework, control_id, evidence_type, source, source_id, actor, metadata, created_at)
         VALUES ($1, $2, $3, $4, 'attestation', 'attestation', $5, $6, $7::jsonb, NOW())`,
        [
          evId,
          auth.tenantId,
          body.framework,
          body.controlId,
          id,
          email ?? auth.userId,
          JSON.stringify({
            impact: "positive",
            eventType: "attestation.signed",
            reasoning: `${name} attested: ${body.statement.slice(0, 200)}`,
            confidence: 1,
            auditAction: "attestation.signed",
            attestationKey: body.attestationKey,
          }),
        ],
      );
      return ok(
        { status: "success", data: { id, evidenceId: evId }, timestamp: new Date().toISOString() },
        201,
      );
    } catch (e) {
      const err = (e as Error).message;
      console.error("[compliance-api] attestations.create.error", { error: err });
      // Uniqueness violation → clearer 409
      if (err.includes("idx_attestations_key_unique")) {
        return fail(
          409,
          "An active attestation with that key already exists — revoke the existing one first",
          "CONFLICT",
        );
      }
      return fail(500, "Failed to create attestation", "INTERNAL_ERROR");
    }
  }

  // GET /api/v1/attestations/:id — detail
  {
    const m = path.match(/^\/api\/v1\/attestations\/([0-9a-f-]{36})$/);
    if (m && method === "GET") {
      const id = m[1];
      const rows = await pool.query(
        `SELECT id, framework, control_id as "controlId", attestation_key as "attestationKey",
                status, statement, attested_by_id as "attestedById",
                attested_by_email as "attestedByEmail", attested_by_name as "attestedByName",
                attested_at as "attestedAt", valid_until as "validUntil",
                evidence_ref_ids as "evidenceRefIds",
                revoked_at as "revokedAt", revoked_by as "revokedBy",
                revocation_reason as "revocationReason"
         FROM attestations WHERE id = $1 AND tenant_id = $2`,
        [id, auth.tenantId],
      );
      if (rows.rows.length === 0) return fail(404, "Attestation not found", "NOT_FOUND");
      return ok({ status: "success", data: rows.rows[0], timestamp: new Date().toISOString() });
    }
  }

  // POST /api/v1/attestations/:id/revoke — revoke (admin/owner only)
  {
    const m = path.match(/^\/api\/v1\/attestations\/([0-9a-f-]{36})\/revoke$/);
    if (m && method === "POST") {
      if (auth.role !== "admin" && auth.role !== "owner") {
        return fail(403, "Admin role required", "FORBIDDEN");
      }
      const id = m[1];
      const body = parseBody(event) as { reason?: string };
      try {
        const attRow = await pool.query(
          `SELECT framework, control_id, statement FROM attestations WHERE id = $1 AND tenant_id = $2 AND status = 'active'`,
          [id, auth.tenantId],
        );
        if (attRow.rows.length === 0) return fail(404, "Active attestation not found", "NOT_FOUND");
        const a = attRow.rows[0];

        await pool.query(
          `UPDATE attestations
           SET status = 'revoked', revoked_at = NOW(), revoked_by = $2,
               revocation_reason = $3, updated_at = NOW()
           WHERE id = $1 AND tenant_id = $4`,
          [id, auth.userId, body.reason ?? null, auth.tenantId],
        );

        // Emit negative compliance evidence — revoked attestation weakens the control.
        const evId = crypto.randomUUID();
        await pool.query(
          `INSERT INTO compliance_evidence
             (id, tenant_id, framework, control_id, evidence_type, source, source_id, actor, metadata, created_at)
           VALUES ($1, $2, $3, $4, 'attestation', 'attestation', $5, $6, $7::jsonb, NOW())`,
          [
            evId,
            auth.tenantId,
            a.framework,
            a.control_id,
            id,
            auth.userId,
            JSON.stringify({
              impact: "negative",
              eventType: "attestation.revoked",
              reasoning: `Attestation revoked${body.reason ? ": " + body.reason : ""}`,
              confidence: 1,
              auditAction: "attestation.revoked",
            }),
          ],
        );
        return ok({
          status: "success",
          data: { id, revoked: true },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error("[compliance-api] attestations.revoke.error", {
          error: (e as Error).message,
        });
        return fail(500, "Failed to revoke attestation", "INTERNAL_ERROR");
      }
    }
  }

  // GET /api/v1/compliance-intelligence/anomalies — detect score drops from snapshots.
  // An anomaly is any pack where the latest score dropped >=10 points vs the
  // previous snapshot, or where fail_count jumped >=5.
  if (path === "/api/v1/compliance-intelligence/anomalies" && method === "GET") {
    const sinceDays = Math.min(parseInt(qs.days ?? "30", 10) || 30, 180);
    const since = new Date(Date.now() - sinceDays * 86400 * 1000).toISOString();

    const rows = await pool.query(
      `WITH ranked AS (
         SELECT
           pack_id,
           score_pct,
           fail_count,
           pass_count,
           unknown_count,
           snapshot_at,
           LAG(score_pct) OVER (PARTITION BY pack_id ORDER BY snapshot_at) AS prev_score,
           LAG(fail_count) OVER (PARTITION BY pack_id ORDER BY snapshot_at) AS prev_fail
         FROM compliance_score_snapshots
         WHERE tenant_id = $1 AND snapshot_at >= $2
       )
       SELECT pack_id as "packId",
              score_pct as "scorePct",
              prev_score as "prevScore",
              fail_count as "failCount",
              prev_fail as "prevFail",
              snapshot_at as "snapshotAt",
              CASE
                WHEN prev_score IS NOT NULL AND (prev_score - score_pct) >= 10 THEN 'score_drop'
                WHEN prev_fail IS NOT NULL AND (fail_count - prev_fail) >= 5 THEN 'fail_spike'
                ELSE NULL
              END as severity
       FROM ranked
       WHERE (prev_score IS NOT NULL AND (prev_score - score_pct) >= 10)
          OR (prev_fail IS NOT NULL AND (fail_count - prev_fail) >= 5)
       ORDER BY snapshot_at DESC LIMIT 100`,
      [tenantId, since],
    );

    return ok({
      status: "success",
      anomalies: rows.rows,
      windowDays: sinceDays,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Questionnaire AI (Phase 9 — kill the security questionnaire) ──────
  // POST /api/v1/trust/questionnaire/parse — split raw text into structured questions
  if (path === "/api/v1/trust/questionnaire/parse" && method === "POST") {
    const b = parseBody(event) as { text?: string; name?: string; sourceFormat?: string };
    if (!b.text || typeof b.text !== "string") {
      return fail(400, "text is required", "VALIDATION_FAILED");
    }
    const { parseQuestionnaireText, mapQuestionsToControls } = await import("./questionnaire.js");
    const questions = parseQuestionnaireText(b.text);
    const mappings = mapQuestionsToControls(questions);
    // Persist questionnaire shell (so subsequent generate calls can ref it)
    let questionnaireId: string | null = null;
    if (b.name) {
      const ins = await pool.query(
        `INSERT INTO questionnaires (tenant_id, name, source_format, question_count, created_by_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [tenantId, b.name, b.sourceFormat ?? "custom", questions.length, auth.userId],
      );
      questionnaireId = ins.rows[0].id as string;
    }
    return ok({
      status: "success",
      questionnaireId,
      questionCount: questions.length,
      mappings,
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/trust/questionnaire/generate — produce AI responses for given mappings
  if (path === "/api/v1/trust/questionnaire/generate" && method === "POST") {
    const b = parseBody(event) as {
      questionnaireId?: string;
      mappings?: Array<{
        questionIndex: number;
        questionText: string;
        section: string | null;
        mappedControls: string[];
        confidence: number;
      }>;
    };
    if (!b.mappings || !Array.isArray(b.mappings)) {
      return fail(400, "mappings array required", "VALIDATION_FAILED");
    }
    const { buildEvidenceSummaries, buildLearningContext, generateResponses } =
      await import("./questionnaire.js");
    const [evidenceSummaries, priorAnswers] = await Promise.all([
      buildEvidenceSummaries(pool, tenantId),
      buildLearningContext(pool, tenantId),
    ]);
    const responses = await generateResponses(
      b.mappings,
      evidenceSummaries,
      process.env.GROQ_API_KEY,
      priorAnswers,
    );
    // Persist drafts so feedback can update them later
    for (const r of responses) {
      await pool.query(
        `INSERT INTO questionnaire_responses
           (tenant_id, questionnaire_id, question_index, question_text,
            mapped_controls, confidence, response_text, evidence_refs)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId,
          b.questionnaireId ?? null,
          r.questionIndex,
          r.questionText,
          r.mappedControls.join(","),
          r.mappedControls.length > 0 ? Math.min(1, r.mappedControls.length * 0.3) : 0,
          r.response,
          r.evidenceRefs.join(","),
        ],
      );
    }
    return ok({
      status: "success",
      responses,
      groqEnabled: Boolean(process.env.GROQ_API_KEY),
      timestamp: new Date().toISOString(),
    });
  }

  // POST /api/v1/trust/questionnaire/feedback — record acceptance / edit / rejection
  if (path === "/api/v1/trust/questionnaire/feedback" && method === "POST") {
    const b = parseBody(event) as {
      responseId?: string;
      feedback?: "accepted" | "edited" | "rejected";
      editedText?: string;
    };
    if (!b.responseId || !b.feedback) {
      return fail(400, "responseId and feedback required", "VALIDATION_FAILED");
    }
    if (!["accepted", "edited", "rejected"].includes(b.feedback)) {
      return fail(400, "feedback must be accepted | edited | rejected", "VALIDATION_FAILED");
    }
    const result = await pool.query(
      `UPDATE questionnaire_responses
       SET feedback = $1, edited_text = $2, feedback_at = NOW()
       WHERE id = $3 AND tenant_id = $4`,
      [b.feedback, b.editedText ?? null, b.responseId, tenantId],
    );
    if (result.rowCount === 0) {
      return fail(404, "Response not found for tenant", "NOT_FOUND");
    }
    return ok({ status: "success", responseId: b.responseId, feedback: b.feedback });
  }

  // GET /api/v1/trust/questionnaire/list — list this tenant's questionnaires
  if (path === "/api/v1/trust/questionnaire/list" && method === "GET") {
    const result = await pool.query(
      `SELECT id, name, source_format as "sourceFormat", question_count as "questionCount",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM questionnaires WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [tenantId],
    );
    return ok({ status: "success", questionnaires: result.rows });
  }

  // -------------------------------------------------------------------------
  // NDA / Trust Access Request workflow
  // -------------------------------------------------------------------------

  // POST /api/v1/trust/:slug/access-request — public (no auth required)
  // Visitor submits an NDA / access request from the public trust page.
  const accessRequestMatch = path.match(/^\/api\/v1\/trust\/([^/]+)\/access-request$/);
  if (accessRequestMatch && method === "POST") {
    const slug = decodeURIComponent(accessRequestMatch[1]);
    const b = parseBody(event) as {
      name?: string;
      email?: string;
      company?: string;
      reason?: string;
    };
    if (!b.name?.trim() || !b.email?.trim() || !b.company?.trim()) {
      return fail(400, "name, email, and company are required", "VALIDATION_FAILED");
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())) {
      return fail(400, "Invalid email address", "VALIDATION_FAILED");
    }
    // Look up tenant by slug (trust center must be published)
    const tenantRow = await pool.query<{ id: string; name: string }>(
      `SELECT t.id, t.name FROM tenants t
       WHERE t.slug = $1 AND (t.config->>'trust_center_public')::boolean = true
       LIMIT 1`,
      [slug],
    );
    if (tenantRow.rows.length === 0) {
      return fail(404, "Trust center not found", "NOT_FOUND");
    }
    const targetTenantId = tenantRow.rows[0].id;
    const tenantName = tenantRow.rows[0].name;

    // Prevent duplicate pending requests from the same email
    const existing = await pool.query(
      `SELECT id FROM trust_access_requests
       WHERE tenant_id = $1 AND requester_email = $2 AND status = 'pending'
       LIMIT 1`,
      [targetTenantId, b.email.trim().toLowerCase()],
    );
    if (existing.rows.length > 0) {
      return ok({ status: "pending", message: "Your request is already under review." });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO trust_access_requests
         (id, tenant_id, requester_name, requester_email, requester_company, reason)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        targetTenantId,
        b.name.trim(),
        b.email.trim().toLowerCase(),
        b.company.trim(),
        b.reason?.trim() ?? null,
      ],
    );

    // Publish internal event so tenant admin sees a notification
    await publishEvent(targetTenantId, "trust.access_request.created", "trust-center", {
      requestId: id,
      requesterName: b.name.trim(),
      requesterEmail: b.email.trim().toLowerCase(),
      requesterCompany: b.company.trim(),
      tenantName,
    });

    return ok({ status: "submitted", requestId: id });
  }

  // GET /api/v1/trust/access-requests — admin: list requests for this tenant
  if (path === "/api/v1/trust/access-requests" && method === "GET") {
    const auth = await extractAuth(event, svc.authRepo);
    const tenantId = auth.tenantId;
    const statusFilter = (event.queryStringParameters?.status as string | undefined) ?? "pending";
    const validStatuses = ["pending", "approved", "denied", "all"];
    if (!validStatuses.includes(statusFilter)) {
      return fail(400, "status must be pending | approved | denied | all", "VALIDATION_FAILED");
    }
    const result = await pool.query<{
      id: string;
      requester_name: string;
      requester_email: string;
      requester_company: string;
      reason: string | null;
      status: string;
      reviewed_by: string | null;
      reviewed_at: string | null;
      review_note: string | null;
      expires_at: string | null;
      created_at: string;
    }>(
      statusFilter === "all"
        ? `SELECT id, requester_name, requester_email, requester_company, reason,
                  status, reviewed_by, reviewed_at, review_note, expires_at, created_at
           FROM trust_access_requests
           WHERE tenant_id = $1
           ORDER BY created_at DESC
           LIMIT 200`
        : `SELECT id, requester_name, requester_email, requester_company, reason,
                  status, reviewed_by, reviewed_at, review_note, expires_at, created_at
           FROM trust_access_requests
           WHERE tenant_id = $1 AND status = $2
           ORDER BY created_at DESC
           LIMIT 200`,
      statusFilter === "all" ? [tenantId] : [tenantId, statusFilter],
    );
    return ok({ status: "success", requests: result.rows });
  }

  // POST /api/v1/trust/access-requests/:id/approve — admin: approve + issue signed URL
  const approveMatch = path.match(/^\/api\/v1\/trust\/access-requests\/([^/]+)\/approve$/);
  if (approveMatch && method === "POST") {
    const auth = await extractAuth(event, svc.authRepo);
    const tenantId = auth.tenantId;
    const requestId = approveMatch[1];
    const b = parseBody(event) as { note?: string; ttlDays?: number };

    const row = await pool.query<{
      id: string;
      requester_email: string;
      requester_name: string;
      requester_company: string;
    }>(
      `SELECT id, requester_email, requester_name, requester_company
       FROM trust_access_requests
       WHERE id = $1 AND tenant_id = $2 AND status = 'pending'
       LIMIT 1`,
      [requestId, tenantId],
    );
    if (row.rows.length === 0) {
      return fail(404, "Access request not found or already reviewed", "NOT_FOUND");
    }

    const ttlDays = Math.min(Math.max(Number(b.ttlDays ?? 7), 1), 90);
    const expiresAt = new Date(Date.now() + ttlDays * 86400 * 1000);

    // Generate HMAC-signed access token: "<requestId>.<expiresMs>.<sig>"
    const webhookSecret = process.env.WEBHOOK_SECRET ?? "dev-secret";
    const payload = `${requestId}.${expiresAt.getTime()}`;
    const sig = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex")
      .slice(0, 32);
    const accessToken = `${payload}.${sig}`;

    await pool.query(
      `UPDATE trust_access_requests
       SET status = 'approved',
           access_token = $1,
           expires_at = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           review_note = $4,
           updated_at = NOW()
       WHERE id = $5 AND tenant_id = $6`,
      [
        accessToken,
        expiresAt.toISOString(),
        auth.userId ?? "admin",
        b.note?.trim() ?? null,
        requestId,
        tenantId,
      ],
    );

    // Publish event for Slack/email notification
    await publishEvent(tenantId, "trust.access_request.approved", "trust-center", {
      requestId,
      requesterEmail: row.rows[0].requester_email,
      requesterName: row.rows[0].requester_name,
      accessToken,
      expiresAt: expiresAt.toISOString(),
    });

    return ok({
      status: "approved",
      requestId,
      accessToken,
      expiresAt: expiresAt.toISOString(),
    });
  }

  // POST /api/v1/trust/access-requests/:id/deny — admin: deny request
  const denyMatch = path.match(/^\/api\/v1\/trust\/access-requests\/([^/]+)\/deny$/);
  if (denyMatch && method === "POST") {
    const auth = await extractAuth(event, svc.authRepo);
    const tenantId = auth.tenantId;
    const requestId = denyMatch[1];
    const b = parseBody(event) as { note?: string };

    const result = await pool.query(
      `UPDATE trust_access_requests
       SET status = 'denied',
           reviewed_by = $1,
           reviewed_at = NOW(),
           review_note = $2,
           updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4 AND status = 'pending'`,
      [auth.userId ?? "admin", b.note?.trim() ?? null, requestId, tenantId],
    );
    if (result.rowCount === 0) {
      return fail(404, "Access request not found or already reviewed", "NOT_FOUND");
    }

    await publishEvent(tenantId, "trust.access_request.denied", "trust-center", {
      requestId,
    });

    return ok({ status: "denied", requestId });
  }

  // GET /api/v1/trust/:slug/export.pdf?token=<accessToken> — signed access verification
  // The PDF export route already exists earlier in this file. This block validates the token
  // and enriches the query so the handler can check it. Token format: "<id>.<expiresMs>.<sig>"
  const pdfTokenMatch = path.match(/^\/api\/v1\/trust\/([^/]+)\/export\.pdf$/);
  if (pdfTokenMatch && method === "GET") {
    const tokenParam = event.queryStringParameters?.token;
    if (tokenParam) {
      // Validate token signature and expiry before letting the PDF handler run
      const parts = tokenParam.split(".");
      if (parts.length === 3) {
        const [reqId, expMs, sigProvided] = parts;
        const expiresMs = Number(expMs);
        if (!isNaN(expiresMs) && Date.now() < expiresMs) {
          const webhookSecret = process.env.WEBHOOK_SECRET ?? "dev-secret";
          const expectedSig = crypto
            .createHmac("sha256", webhookSecret)
            .update(`${reqId}.${expiresMs}`)
            .digest("hex")
            .slice(0, 32);
          if (
            crypto.timingSafeEqual(Buffer.from(sigProvided, "hex"), Buffer.from(expectedSig, "hex"))
          ) {
            // Token valid — fall through to the existing PDF export handler below by NOT returning here.
            // We mark the request in the DB as accessed (best-effort, non-blocking).
            pool
              .query(`UPDATE trust_access_requests SET updated_at = NOW() WHERE id = $1`, [reqId])
              .catch(() => {});
          } else {
            return fail(401, "Access token signature invalid", "INVALID_TOKEN");
          }
        } else {
          return fail(401, "Access token expired", "TOKEN_EXPIRED");
        }
      } else {
        return fail(401, "Malformed access token", "INVALID_TOKEN");
      }
    }
    // No token — fall through to the existing PDF route handler (it runs unauthenticated for public trust pages)
  }

  return fail(404, "Not Found", "NOT_FOUND");
}

/** Parse control reference like "SOC2-CC6.1" into framework and controlId */
function parseControlRef(ref: string): { framework: string; controlId: string } {
  // Handle multi-segment prefixes like ISO-27001, NIST-CSF
  const multiSegmentPrefixes = ["ISO-27001", "NIST-CSF", "NIST-800-53"];
  for (const prefix of multiSegmentPrefixes) {
    if (ref.startsWith(prefix + "-")) {
      return { framework: prefix, controlId: ref.slice(prefix.length + 1) };
    }
  }
  // Default: split on first hyphen
  const idx = ref.indexOf("-");
  if (idx === -1) return { framework: "unknown", controlId: ref };
  return { framework: ref.slice(0, idx), controlId: ref.slice(idx + 1) };
}

/** Build a compliance snapshot for the tenant from PostgreSQL. */
async function buildComplianceSnapshot(
  tenantId: string,
  pool: pg.Pool,
): Promise<Record<string, unknown>> {
  const rows = await pool.query(
    `SELECT framework, control_id as "controlId", COUNT(*) as evidence_count
     FROM compliance_evidence WHERE tenant_id = $1
     GROUP BY framework, control_id`,
    [tenantId],
  );

  const frameworkMap: Record<string, { controls: number; withEvidence: number; score: number }> =
    {};

  for (const row of rows.rows) {
    const fw = row.framework ?? "unknown";
    if (!frameworkMap[fw]) frameworkMap[fw] = { controls: 0, withEvidence: 0, score: 0 };
    frameworkMap[fw].controls++;
    if (parseInt(row.evidence_count, 10) > 0) frameworkMap[fw].withEvidence++;
  }

  for (const fw of Object.keys(frameworkMap)) {
    const { controls, withEvidence } = frameworkMap[fw];
    frameworkMap[fw].score = controls > 0 ? Math.round((withEvidence / controls) * 100) : 0;
  }

  const overallControls = rows.rows.length;
  const overallWithEvidence = rows.rows.filter((r) => parseInt(r.evidence_count, 10) > 0).length;

  return {
    tenantId,
    generatedAt: new Date().toISOString(),
    overallScore:
      overallControls > 0 ? Math.round((overallWithEvidence / overallControls) * 100) : 0,
    frameworks: frameworkMap,
  };
}
