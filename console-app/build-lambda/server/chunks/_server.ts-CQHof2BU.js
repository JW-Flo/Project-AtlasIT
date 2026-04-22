import { json } from '@sveltejs/kit';
import { g as getWorkerBase, s as safeProxyFetch } from './_proxy-helpers-Bn_aZrFz.js';

const STATUS_WEIGHTS = {
  not_started: 0,
  in_progress: 0.25,
  implemented: 0.75,
  verified: 1
};
function computeGrade(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}
async function fetchEvidenceGroundedScores(platform, tenantId, frameworks) {
  const base = getWorkerBase(platform);
  const allScores = [];
  const results = await Promise.all(
    frameworks.map(async (fw) => {
      const url = `${base}/api/v1/cdt/evaluate?framework=${encodeURIComponent(fw)}`;
      const result = await safeProxyFetch(platform, url, {
        headers: {
          "x-tenant-id": tenantId,
          "Content-Type": "application/json"
        }
      });
      if (!result.ok) return null;
      try {
        const data = await result.response.json();
        if (data.scores && data.scores.length > 0) {
          return data.scores.map((s) => ({
            framework: s.framework,
            score: s.score,
            grade: s.grade,
            controlsTotal: s.controlsTotal,
            controlsImplemented: s.controlsImplemented + s.controlsVerified,
            controlsVerified: s.controlsVerified
          }));
        } else if (data.controls && data.controls.length > 0) {
          const controls = data.controls;
          const total = controls.length;
          const weightSum = controls.reduce((sum, c) => sum + (STATUS_WEIGHTS[c.status] ?? 0), 0);
          const score = total > 0 ? Math.round(weightSum / total * 100 * 100) / 100 : 0;
          const implemented = controls.filter(
            (c) => c.status === "implemented" || c.status === "verified"
          ).length;
          const verified = controls.filter((c) => c.status === "verified").length;
          return [{
            framework: fw,
            score,
            grade: computeGrade(score),
            controlsTotal: total,
            controlsImplemented: implemented,
            controlsVerified: verified
          }];
        }
      } catch {
      }
      return null;
    })
  );
  for (const batch of results) {
    if (batch) allScores.push(...batch);
  }
  return allScores.length > 0 ? allScores : null;
}
async function persistScores(db, tenantId, scores) {
  const upsertStmts = [];
  const historyStmts = [];
  for (const fw of scores) {
    upsertStmts.push(
      db.prepare(
        `INSERT INTO compliance_scores (id, tenant_id, framework, score, grade, controls_total, controls_implemented, controls_verified, calculated_at)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(tenant_id, framework) DO UPDATE SET
             score = excluded.score,
             grade = excluded.grade,
             controls_total = excluded.controls_total,
             controls_implemented = excluded.controls_implemented,
             controls_verified = excluded.controls_verified,
             calculated_at = excluded.calculated_at`
      ).bind(
        tenantId,
        fw.framework,
        fw.score,
        fw.grade,
        fw.controlsTotal,
        fw.controlsImplemented,
        fw.controlsVerified
      )
    );
    historyStmts.push(
      db.prepare(
        `INSERT INTO compliance_history (id, tenant_id, framework, score, grade, recorded_at)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'))`
      ).bind(tenantId, fw.framework, fw.score, fw.grade)
    );
  }
  if (upsertStmts.length > 0) {
    await db.batch([...upsertStmts, ...historyStmts]);
  }
}
async function computeSelfAssessedScores(db, tenantId, frameworks) {
  try {
    const row = await db.prepare(
      `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`
    ).bind(tenantId).first();
    if (!row?.value) return [];
    const controls = JSON.parse(
      row.value
    );
    if (!Array.isArray(controls) || controls.length === 0) return [];
    const frameworkSet = new Set(frameworks);
    const byFramework = /* @__PURE__ */ new Map();
    for (const c of controls) {
      if (!frameworkSet.has(c.framework)) continue;
      const list = byFramework.get(c.framework) || [];
      list.push(c);
      byFramework.set(c.framework, list);
    }
    const scores = [];
    for (const fw of frameworks) {
      const fwControls = byFramework.get(fw) || [];
      const total = fwControls.length;
      if (total === 0) {
        scores.push({
          framework: fw,
          score: 0,
          grade: "F",
          controlsTotal: 0,
          controlsImplemented: 0,
          controlsVerified: 0
        });
        continue;
      }
      const weightSum = fwControls.reduce((sum, c) => sum + (STATUS_WEIGHTS[c.status] ?? 0), 0);
      const score = Math.round(weightSum / total * 100 * 100) / 100;
      const implemented = fwControls.filter(
        (c) => c.status === "implemented" || c.status === "verified"
      ).length;
      const verified = fwControls.filter((c) => c.status === "verified").length;
      scores.push({
        framework: fw,
        score,
        grade: computeGrade(score),
        controlsTotal: total,
        controlsImplemented: implemented,
        controlsVerified: verified
      });
    }
    return scores;
  } catch {
    return [];
  }
}
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
  const [evidenceScores, selfScores] = await Promise.all([
    fetchEvidenceGroundedScores(platform, user.tenantId, frameworks),
    computeSelfAssessedScores(db, user.tenantId, frameworks)
  ]);
  if (evidenceScores && evidenceScores.length > 0) {
    const selfMap = new Map(selfScores.map((s) => [s.framework, s]));
    const blended = [];
    const coveredFrameworks = new Set(evidenceScores.map((s) => s.framework));
    for (const ev of evidenceScores) {
      const sa = selfMap.get(ev.framework);
      if (sa) {
        if (ev.score >= sa.score) {
          blended.push({ ...ev, source: "evidence" });
        } else {
          blended.push({
            ...sa,
            controlsTotal: Math.max(sa.controlsTotal, ev.controlsTotal),
            source: "self-assessed-fallback"
          });
        }
      } else {
        blended.push({ ...ev, source: "evidence" });
      }
      selfMap.delete(ev.framework);
    }
    for (const fw of frameworks) {
      if (!coveredFrameworks.has(fw)) {
        const sa = selfMap.get(fw);
        if (sa && sa.score > 0) {
          blended.push({ ...sa, source: "self-assessed" });
        } else {
          blended.push({
            framework: fw,
            score: sa?.score ?? 0,
            grade: sa?.grade ?? "F",
            controlsTotal: sa?.controlsTotal ?? 0,
            controlsImplemented: sa?.controlsImplemented ?? 0,
            controlsVerified: sa?.controlsVerified ?? 0,
            source: "no-data"
          });
        }
      }
    }
    await persistScores(db, user.tenantId, blended);
    return json({ scores: blended, source: "evidence", frameworksConfigured }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
    });
  }
  if (selfScores.length > 0) {
    const tagged = selfScores.map((s) => ({
      ...s,
      source: s.score > 0 ? "self-assessed" : "no-data"
    }));
    await persistScores(db, user.tenantId, tagged);
    return json({ scores: tagged, source: "self-assessed", frameworksConfigured }, {
      headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
    });
  }
  const emptyScores = frameworks.map((fw) => ({
    framework: fw,
    score: 0,
    grade: "F",
    controlsTotal: 0,
    controlsImplemented: 0,
    controlsVerified: 0,
    source: "no-data"
  }));
  return json({ scores: emptyScores, source: "empty", frameworksConfigured }, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
  });
};
const POST = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  let frameworks = [];
  try {
    const row = await db.prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`).bind(user.tenantId).first();
    if (row?.value) {
      frameworks = JSON.parse(row.value);
    }
  } catch {
  }
  if (frameworks.length === 0) {
    frameworks = ["SOC2", "ISO27001", "NIST CSF"];
  }
  const { results: prevRows } = await db.prepare("SELECT framework, score FROM compliance_scores WHERE tenant_id = ?").bind(user.tenantId).all();
  const previousScores = {};
  for (const row of prevRows ?? []) {
    previousScores[row.framework] = row.score;
  }
  const selfScores = await computeSelfAssessedScores(db, user.tenantId, frameworks);
  const scores = await fetchEvidenceGroundedScores(platform, user.tenantId, frameworks);
  let finalScores;
  let source;
  if (scores && scores.length > 0) {
    const selfMap = new Map(selfScores.map((s) => [s.framework, s]));
    const blended = [];
    const covered = new Set(scores.map((s) => s.framework));
    for (const ev of scores) {
      const sa = selfMap.get(ev.framework);
      if (sa) {
        if (ev.score >= sa.score) {
          blended.push({ ...ev, source: "evidence" });
        } else {
          blended.push({
            ...sa,
            controlsTotal: Math.max(sa.controlsTotal, ev.controlsTotal),
            source: "self-assessed-fallback"
          });
        }
      } else {
        blended.push({ ...ev, source: "evidence" });
      }
      selfMap.delete(ev.framework);
    }
    for (const fw of frameworks) {
      if (!covered.has(fw)) {
        const sa = selfMap.get(fw);
        if (sa && sa.score > 0) {
          blended.push({ ...sa, source: "self-assessed" });
        } else {
          blended.push({
            framework: fw,
            score: sa?.score ?? 0,
            grade: sa?.grade ?? "F",
            controlsTotal: sa?.controlsTotal ?? 0,
            controlsImplemented: sa?.controlsImplemented ?? 0,
            controlsVerified: sa?.controlsVerified ?? 0,
            source: "no-data"
          });
        }
      }
    }
    finalScores = blended;
    source = "evidence";
  } else if (selfScores.length > 0) {
    finalScores = selfScores.map((s) => ({
      ...s,
      source: s.score > 0 ? "self-assessed" : "no-data"
    }));
    source = "self-assessed";
  } else {
    finalScores = frameworks.map((fw) => ({
      framework: fw,
      score: 0,
      grade: "F",
      controlsTotal: 0,
      controlsImplemented: 0,
      controlsVerified: 0,
      source: "no-data"
    }));
    source = "empty";
  }
  await persistScores(db, user.tenantId, finalScores);
  const orchestratorUrl = env.ORCHESTRATOR_URL;
  const serviceApiKey = env.ORCHESTRATOR_API_KEY || env.INTERNAL_API_KEY || "";
  if (orchestratorUrl) {
    for (const fw of finalScores) {
      const previousScore = previousScores[fw.framework];
      if (previousScore !== void 0 && previousScore !== fw.score) {
        fetch(`${orchestratorUrl}/api/v1/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-ID": user.tenantId,
            ...serviceApiKey ? { "X-API-Key": serviceApiKey } : {}
          },
          body: JSON.stringify({
            tenantId: user.tenantId,
            type: "compliance.score_changed",
            source: "compliance-scores-api",
            payload: {
              framework: fw.framework,
              score: fw.score,
              previousScore,
              grade: fw.grade,
              direction: fw.score < previousScore ? "below" : "above",
              controlsTotal: fw.controlsTotal,
              controlsImplemented: fw.controlsImplemented,
              controlsVerified: fw.controlsVerified
            },
            idempotencyKey: `score-${user.tenantId}-${fw.framework}-${Date.now()}`
          })
        }).catch((err) => {
          console.error("[scores] Event delivery failed:", err);
        });
      }
    }
  }
  return json({
    scores: finalScores,
    recalculated: true,
    source
  });
};

export { GET, POST };
//# sourceMappingURL=_server.ts-CQHof2BU.js.map
