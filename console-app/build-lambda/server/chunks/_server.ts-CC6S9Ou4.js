import { json } from '@sveltejs/kit';
import { queryPg } from './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const POST = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { reportId, format, dateRange } = body;
  if (!reportId || !format) {
    return json({ error: "reportId and format are required" }, { status: 400 });
  }
  const days = parseInt(dateRange) || 30;
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - days);
  try {
    let reportData;
    switch (reportId) {
      case "compliance-summary":
        reportData = await generateComplianceSummary(tenantId, startDate);
        break;
      case "audit-log":
        reportData = await generateAuditLog(tenantId, startDate);
        break;
      case "evidence-package":
        reportData = await generateEvidencePackage(tenantId, startDate);
        break;
      case "access-review-summary":
        reportData = await generateAccessReviewSummary(tenantId, startDate);
        break;
      case "incident-report":
        reportData = await generateIncidentReport(tenantId, startDate);
        break;
      case "policy-compliance":
        reportData = await generatePolicyCompliance(tenantId, startDate);
        break;
      default:
        return json({ error: "Unknown report type" }, { status: 400 });
    }
    if (format === "csv") {
      const csv = convertToCSV(reportData);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${reportId}.csv"`
        }
      });
    }
    if (format === "json") {
      return json(reportData);
    }
    return json({ error: "PDF generation not yet implemented" }, { status: 501 });
  } catch (e) {
    console.error("Report generation error:", e);
    return json({ error: "Failed to generate report" }, { status: 500 });
  }
};
async function generateComplianceSummary(tenantId, startDate) {
  const scores = await queryPg(
    `SELECT framework, score, grade, evaluated_at
     FROM compliance_scores
     WHERE tenant_id = $1 AND evaluated_at >= $2
     ORDER BY framework, evaluated_at DESC`,
    [tenantId, startDate.toISOString()]
  );
  const latestScores = scores.reduce((acc, row) => {
    if (!acc[row.framework]) {
      acc[row.framework] = row;
    }
    return acc;
  }, {});
  return {
    reportType: "compliance-summary",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    period: { start: startDate.toISOString(), end: (/* @__PURE__ */ new Date()).toISOString() },
    frameworks: Object.values(latestScores)
  };
}
async function generateAuditLog(tenantId, startDate) {
  const logs = await queryPg(
    `SELECT id, action, resource_type, resource_id, actor_id, actor_type, details, created_at
     FROM audit_log
     WHERE tenant_id = $1 AND created_at >= $2
     ORDER BY created_at DESC
     LIMIT 10000`,
    [tenantId, startDate.toISOString()]
  );
  return {
    reportType: "audit-log",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    period: { start: startDate.toISOString(), end: (/* @__PURE__ */ new Date()).toISOString() },
    entries: logs
  };
}
async function generateEvidencePackage(tenantId, startDate) {
  const evidence = await queryPg(
    `SELECT id, framework, control_id, control_name, evidence_type, source, actor, created_at
     FROM compliance_evidence
     WHERE tenant_id = $1 AND created_at >= $2
     ORDER BY framework, control_id, created_at DESC`,
    [tenantId, startDate.toISOString()]
  );
  return {
    reportType: "evidence-package",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    period: { start: startDate.toISOString(), end: (/* @__PURE__ */ new Date()).toISOString() },
    evidenceCount: evidence.length,
    evidence
  };
}
async function generateAccessReviewSummary(tenantId, startDate) {
  const campaigns = await queryPg(
    `SELECT id, name, status, scope, created_at, completed_at
     FROM access_review_campaigns
     WHERE tenant_id = $1 AND created_at >= $2
     ORDER BY created_at DESC`,
    [tenantId, startDate.toISOString()]
  );
  const decisions = await queryPg(
    `SELECT campaign_id, decision, COUNT(*) as count
     FROM access_review_decisions
     WHERE tenant_id = $1 AND decided_at >= $2
     GROUP BY campaign_id, decision`,
    [tenantId, startDate.toISOString()]
  );
  return {
    reportType: "access-review-summary",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    period: { start: startDate.toISOString(), end: (/* @__PURE__ */ new Date()).toISOString() },
    campaigns,
    decisions
  };
}
async function generateIncidentReport(tenantId, startDate) {
  const incidents = await queryPg(
    `SELECT id, title, severity, status, source, created_at, resolved_at
     FROM incidents
     WHERE tenant_id = $1 AND created_at >= $2
     ORDER BY created_at DESC`,
    [tenantId, startDate.toISOString()]
  );
  return {
    reportType: "incident-report",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    period: { start: startDate.toISOString(), end: (/* @__PURE__ */ new Date()).toISOString() },
    incidents
  };
}
async function generatePolicyCompliance(tenantId, startDate) {
  const policies = await queryPg(
    `SELECT id, title, category, status, version, updated_at
     FROM policies
     WHERE tenant_id = $1
     ORDER BY category, title`,
    [tenantId]
  );
  return {
    reportType: "policy-compliance",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    period: { start: startDate.toISOString(), end: (/* @__PURE__ */ new Date()).toISOString() },
    policies
  };
}
function convertToCSV(data) {
  if (!data.entries && !data.evidence && !data.campaigns && !data.incidents && !data.policies) {
    return "No data available";
  }
  const items = data.entries || data.evidence || data.campaigns || data.incidents || data.policies || [];
  if (items.length === 0) return "No data available";
  const headers = Object.keys(items[0]);
  const rows = items.map(
    (item) => headers.map((h) => JSON.stringify(item[h] ?? "")).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export { POST };
//# sourceMappingURL=_server.ts-CC6S9Ou4.js.map
