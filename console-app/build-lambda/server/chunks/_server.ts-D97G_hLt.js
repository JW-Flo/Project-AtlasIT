import { json } from '@sveltejs/kit';
import { b as buildDefaultControls, a as aggregateEvidenceForControls } from './framework-controls-w9ucJmdS.js';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  let frameworks = [];
  let frameworksConfigured = true;
  try {
    const row = await db.prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`).bind(user.tenantId).first();
    if (row?.value) {
      frameworks = JSON.parse(row.value);
    }
  } catch {
  }
  if (frameworks.length === 0) {
    frameworks = ["SOC2", "ISO27001", "NIST CSF"];
    frameworksConfigured = false;
  }
  let controls = null;
  try {
    const row = await db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`
    ).bind(user.tenantId).first();
    if (row?.value) {
      controls = JSON.parse(row.value);
    }
  } catch {
  }
  const defaults = buildDefaultControls(frameworks);
  if (!controls || controls.length < defaults.length) {
    const savedMap = new Map((controls || []).map((c) => [c.id, c]));
    controls = defaults.map((d) => {
      const saved = savedMap.get(d.id);
      if (saved) return { ...d, status: saved.status, notes: saved.notes };
      return d;
    });
    try {
      await db.prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'compliance_controls', ?)`
      ).bind(user.tenantId, JSON.stringify(controls)).run();
    } catch {
    }
  }
  const frameworkSet = new Set(frameworks);
  const scopedControls = controls.filter((c) => frameworkSet.has(c.framework));
  const rawCdtCounts = {};
  let totalEvidenceCount = 0;
  try {
    const { results: rows } = await db.prepare(
      `SELECT control_id, COUNT(*) as count
         FROM compliance_evidence
         WHERE tenant_id = ?
         GROUP BY control_id`
    ).bind(user.tenantId).all();
    for (const row of rows ?? []) {
      rawCdtCounts[row.control_id] = row.count;
      totalEvidenceCount += row.count;
    }
  } catch {
  }
  const evidenceCounts = aggregateEvidenceForControls(rawCdtCounts);
  const STATUS_RANK = {
    not_started: 0,
    in_progress: 1,
    implemented: 2,
    verified: 3
  };
  const RANK_STATUS = ["not_started", "in_progress", "implemented", "verified"];
  let promoted = false;
  for (const control of scopedControls) {
    const evCount = evidenceCounts[control.id] || 0;
    if (evCount === 0) continue;
    const currentRank = STATUS_RANK[control.status] ?? 0;
    const evidenceRank = evCount >= 3 ? 2 : 1;
    if (evidenceRank > currentRank) {
      control.status = RANK_STATUS[evidenceRank];
      promoted = true;
    }
  }
  if (promoted) {
    try {
      const allControls = controls.map((c) => {
        const updated = scopedControls.find((sc) => sc.id === c.id);
        return updated || c;
      });
      await db.prepare(
        `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'compliance_controls', ?)`
      ).bind(user.tenantId, JSON.stringify(allControls)).run();
    } catch {
    }
  }
  return json({ frameworks, controls: scopedControls, evidenceCounts, rawCdtCounts, totalEvidenceCount, frameworksConfigured });
};
const PATCH = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const { controls } = body;
  if (!controls || !Array.isArray(controls)) {
    return json({ error: "controls array required" }, { status: 400 });
  }
  const validStatuses = ["not_started", "in_progress", "implemented", "verified"];
  for (const c of controls) {
    if (!c.id || !c.framework || !c.name || !validStatuses.includes(c.status)) {
      return json({ error: `Invalid control: ${c.id}` }, { status: 400 });
    }
  }
  let existingControls = [];
  try {
    const row = await db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`
    ).bind(user.tenantId).first();
    if (row?.value) {
      existingControls = JSON.parse(row.value);
    }
  } catch {
  }
  const incomingIds = new Set(controls.map((c) => c.id));
  const preserved = existingControls.filter((c) => !incomingIds.has(c.id));
  const merged = [...preserved, ...controls];
  await db.prepare(
    `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, 'compliance_controls', ?)`
  ).bind(user.tenantId, JSON.stringify(merged)).run();
  return json({ success: true });
};

export { GET, PATCH };
//# sourceMappingURL=_server.ts-D97G_hLt.js.map
