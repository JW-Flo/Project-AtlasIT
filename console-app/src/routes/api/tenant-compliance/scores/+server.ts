import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getWorkerBase, safeProxyFetch } from "../../_proxy-helpers";

type ScoreSource = "evidence" | "self-assessed" | "self-assessed-fallback" | "no-data";

interface FrameworkScore {
  framework: string;
  score: number;
  grade: string;
  controlsTotal: number;
  controlsImplemented: number;
  controlsVerified: number;
  source?: ScoreSource;
}

const STATUS_WEIGHTS: Record<string, number> = {
  not_started: 0,
  in_progress: 0.25,
  implemented: 0.75,
  verified: 1.0,
};

function computeGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

async function ensureScoreTables(db: any): Promise<void> {
  try {
    await db.batch([
      db.prepare(
        `CREATE TABLE IF NOT EXISTS compliance_scores (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenant_id TEXT NOT NULL,
        framework TEXT NOT NULL,
        score REAL NOT NULL DEFAULT 0,
        max_score REAL NOT NULL DEFAULT 100,
        grade TEXT NOT NULL DEFAULT 'F',
        controls_total INTEGER NOT NULL DEFAULT 0,
        controls_implemented INTEGER NOT NULL DEFAULT 0,
        controls_verified INTEGER NOT NULL DEFAULT 0,
        calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(tenant_id, framework)
      )`,
      ),
      db.prepare(
        `CREATE TABLE IF NOT EXISTS compliance_history (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenant_id TEXT NOT NULL,
        framework TEXT NOT NULL,
        score REAL NOT NULL,
        grade TEXT NOT NULL,
        recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      ),
    ]);
  } catch (e) {
    console.error("ensureScoreTables error:", e);
  }
}

// ── Evidence-grounded scoring via compliance-worker ──────────────────────────

interface CdtControlEvaluation {
  controlId: string;
  controlName: string;
  framework: string;
  status: string;
  evidenceCount: number;
  lastEvidenceAt: string | null;
}

interface CdtEvaluateResponse {
  controls: CdtControlEvaluation[];
  scores: Array<{
    framework: string;
    score: number;
    grade: string;
    controlsTotal: number;
    controlsNotStarted: number;
    controlsInProgress: number;
    controlsImplemented: number;
    controlsVerified: number;
  }>;
}

/**
 * Fetch evidence-grounded scores from the compliance-worker CDT evaluate endpoint.
 * Returns null if the compliance-worker is unavailable.
 */
async function fetchEvidenceGroundedScores(
  platform: any,
  tenantId: string,
  frameworks: string[],
): Promise<FrameworkScore[] | null> {
  const base = getWorkerBase(platform);
  const allScores: FrameworkScore[] = [];

  // The CDT evaluate endpoint supports a framework query param.
  // Fetch each framework separately since the compliance-worker evaluates
  // SOC2 and ISO27001 controls (the two with defined control definitions).
  // For other frameworks, we'll still get results if evidence exists.
  for (const fw of frameworks) {
    const url = `${base}/api/v1/cdt/evaluate?framework=${encodeURIComponent(fw)}`;
    const result = await safeProxyFetch(platform, url, {
      headers: {
        "x-tenant-id": tenantId,
        "Content-Type": "application/json",
      },
    });

    if (!result.ok) continue;

    try {
      const data = (await result.response.json()) as CdtEvaluateResponse;
      if (data.scores && data.scores.length > 0) {
        for (const s of data.scores) {
          allScores.push({
            framework: s.framework,
            score: s.score,
            grade: s.grade,
            controlsTotal: s.controlsTotal,
            controlsImplemented: s.controlsImplemented + s.controlsVerified,
            controlsVerified: s.controlsVerified,
          });
        }
      } else if (data.controls && data.controls.length > 0) {
        // Compute score from controls if scores array wasn't returned
        const controls = data.controls;
        const total = controls.length;
        const weightSum = controls.reduce((sum, c) => sum + (STATUS_WEIGHTS[c.status] ?? 0), 0);
        const score = total > 0 ? Math.round((weightSum / total) * 100 * 100) / 100 : 0;
        const implemented = controls.filter(
          (c) => c.status === "implemented" || c.status === "verified",
        ).length;
        const verified = controls.filter((c) => c.status === "verified").length;

        allScores.push({
          framework: fw,
          score,
          grade: computeGrade(score),
          controlsTotal: total,
          controlsImplemented: implemented,
          controlsVerified: verified,
        });
      }
    } catch {
      // JSON parse failed — skip this framework
      continue;
    }
  }

  return allScores.length > 0 ? allScores : null;
}

// ── Persist scores to D1 ─────────────────────────────────────────────────────

async function persistScores(db: any, tenantId: string, scores: FrameworkScore[]): Promise<void> {
  const upsertStmts: any[] = [];
  const historyStmts: any[] = [];

  for (const fw of scores) {
    upsertStmts.push(
      db
        .prepare(
          `INSERT INTO compliance_scores (id, tenant_id, framework, score, grade, controls_total, controls_implemented, controls_verified, calculated_at)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(tenant_id, framework) DO UPDATE SET
             score = excluded.score,
             grade = excluded.grade,
             controls_total = excluded.controls_total,
             controls_implemented = excluded.controls_implemented,
             controls_verified = excluded.controls_verified,
             calculated_at = excluded.calculated_at`,
        )
        .bind(
          tenantId,
          fw.framework,
          fw.score,
          fw.grade,
          fw.controlsTotal,
          fw.controlsImplemented,
          fw.controlsVerified,
        ),
    );

    historyStmts.push(
      db
        .prepare(
          `INSERT INTO compliance_history (id, tenant_id, framework, score, grade, recorded_at)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(tenantId, fw.framework, fw.score, fw.grade),
    );
  }

  if (upsertStmts.length > 0) {
    await db.batch([...upsertStmts, ...historyStmts]);
  }
}

// ── Self-assessed scoring from tenant control statuses ──────────────────────

async function computeSelfAssessedScores(
  db: any,
  tenantId: string,
  frameworks: string[],
): Promise<FrameworkScore[]> {
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
      )
      .bind(tenantId)
      .first();
    if (!row?.value) return [];

    const controls: Array<{ id: string; framework: string; status: string }> = JSON.parse(
      row.value as string,
    );
    if (!Array.isArray(controls) || controls.length === 0) return [];

    const frameworkSet = new Set(frameworks);
    const byFramework = new Map<string, typeof controls>();
    for (const c of controls) {
      if (!frameworkSet.has(c.framework)) continue;
      const list = byFramework.get(c.framework) || [];
      list.push(c);
      byFramework.set(c.framework, list);
    }

    const scores: FrameworkScore[] = [];
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
          controlsVerified: 0,
        });
        continue;
      }
      const weightSum = fwControls.reduce((sum, c) => sum + (STATUS_WEIGHTS[c.status] ?? 0), 0);
      const score = Math.round((weightSum / total) * 100 * 100) / 100;
      const implemented = fwControls.filter(
        (c) => c.status === "implemented" || c.status === "verified",
      ).length;
      const verified = fwControls.filter((c) => c.status === "verified").length;
      scores.push({
        framework: fw,
        score,
        grade: computeGrade(score),
        controlsTotal: total,
        controlsImplemented: implemented,
        controlsVerified: verified,
      });
    }
    return scores;
  } catch {
    return [];
  }
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  await ensureScoreTables(db);

  // Read tenant frameworks
  let frameworks: string[] = [];
  let frameworksConfigured = true;
  try {
    const row = await db
      .prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`)
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      frameworks = JSON.parse(row.value as string);
    }
  } catch {
    // no frameworks set
  }
  if (frameworks.length === 0) {
    frameworks = ["SOC2", "ISO27001", "NIST CSF"];
    frameworksConfigured = false;
  }

  // Try evidence-grounded scoring from compliance-worker first
  const evidenceScores = await fetchEvidenceGroundedScores(platform, user.tenantId, frameworks);

  // Always compute self-assessed scores from tenant controls as the primary source
  const selfScores = await computeSelfAssessedScores(db, user.tenantId, frameworks);

  if (evidenceScores && evidenceScores.length > 0) {
    // Blend: evidence-grounded scores take priority when evidence exists.
    // Self-assessed scores are only used for frameworks the compliance-worker
    // doesn't cover. Within a covered framework, take the MAX score to avoid
    // penalizing tenants who have self-assessed but haven't connected adapters.
    const selfMap = new Map(selfScores.map((s) => [s.framework, s]));

    const blended: FrameworkScore[] = [];
    const coveredFrameworks = new Set(evidenceScores.map((s) => s.framework));

    for (const ev of evidenceScores) {
      const sa = selfMap.get(ev.framework);
      if (sa) {
        if (ev.score >= sa.score) {
          blended.push({ ...ev, source: "evidence" });
        } else {
          // Self-assessed is higher — evidence was attempted but scored lower
          blended.push({
            ...sa,
            controlsTotal: Math.max(sa.controlsTotal, ev.controlsTotal),
            source: "self-assessed-fallback",
          });
        }
      } else {
        blended.push({ ...ev, source: "evidence" });
      }
      selfMap.delete(ev.framework);
    }

    // Fill in frameworks the compliance-worker doesn't cover
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
            source: "no-data",
          });
        }
      }
    }

    await persistScores(db, user.tenantId, blended);
    return json({ scores: blended, source: "evidence", frameworksConfigured });
  }

  // Use self-assessed scores from controls (primary path when compliance-worker unavailable)
  if (selfScores.length > 0) {
    const tagged = selfScores.map((s) => ({
      ...s,
      source: (s.score > 0 ? "self-assessed" : "no-data") as ScoreSource,
    }));
    await persistScores(db, user.tenantId, tagged);
    return json({ scores: tagged, source: "self-assessed", frameworksConfigured });
  }

  // No scores available at all — return empty
  const emptyScores: FrameworkScore[] = frameworks.map((fw) => ({
    framework: fw,
    score: 0,
    grade: "F",
    controlsTotal: 0,
    controlsImplemented: 0,
    controlsVerified: 0,
    source: "no-data" as ScoreSource,
  }));
  return json({ scores: emptyScores, source: "empty", frameworksConfigured });
};

export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  await ensureScoreTables(db);

  // Read tenant frameworks
  let frameworks: string[] = [];
  try {
    const row = await db
      .prepare(`SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`)
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      frameworks = JSON.parse(row.value as string);
    }
  } catch {
    // no frameworks set
  }
  if (frameworks.length === 0) {
    frameworks = ["SOC2", "ISO27001", "NIST CSF"];
  }

  // Read previous scores before recalculation to detect changes
  const { results: prevRows } = await db
    .prepare("SELECT framework, score FROM compliance_scores WHERE tenant_id = ?")
    .bind(user.tenantId)
    .all();
  const previousScores: Record<string, number> = {};
  for (const row of (prevRows ?? []) as any[]) {
    previousScores[row.framework] = row.score;
  }

  // Always compute self-assessed scores from controls as the primary source
  const selfScores = await computeSelfAssessedScores(db, user.tenantId, frameworks);

  // Recalculate from evidence via compliance-worker
  const scores = await fetchEvidenceGroundedScores(platform, user.tenantId, frameworks);

  let finalScores: FrameworkScore[];
  let source: string;

  if (scores && scores.length > 0) {
    // Blend: evidence scores take priority; self-assessed used for uncovered frameworks
    const selfMap = new Map(selfScores.map((s) => [s.framework, s]));
    const blended: FrameworkScore[] = [];
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
            source: "self-assessed-fallback",
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
            source: "no-data",
          });
        }
      }
    }

    finalScores = blended;
    source = "evidence";
  } else if (selfScores.length > 0) {
    finalScores = selfScores.map((s) => ({
      ...s,
      source: (s.score > 0 ? "self-assessed" : "no-data") as ScoreSource,
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
      source: "no-data" as ScoreSource,
    }));
    source = "empty";
  }

  await persistScores(db, user.tenantId, finalScores);

  // Emit compliance.score_changed for any framework whose score changed
  const orchestratorUrl = env.ORCHESTRATOR_URL as string | undefined;
  if (orchestratorUrl) {
    for (const fw of finalScores) {
      const previousScore = previousScores[fw.framework];
      if (previousScore !== undefined && previousScore !== fw.score) {
        fetch(`${orchestratorUrl}/api/v1/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
              controlsVerified: fw.controlsVerified,
            },
            idempotencyKey: `score-${user.tenantId}-${fw.framework}-${Date.now()}`,
          }),
        }).catch(() => {}); // best-effort, non-blocking
      }
    }
  }

  return json({
    scores: finalScores,
    recalculated: true,
    source,
  });
};
