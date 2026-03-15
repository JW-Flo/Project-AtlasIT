import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

interface Control {
  id: string;
  framework: string;
  name: string;
  status: "not_started" | "in_progress" | "implemented" | "verified";
  notes: string;
}

interface FrameworkScore {
  framework: string;
  score: number;
  grade: string;
  controlsTotal: number;
  controlsImplemented: number;
  controlsVerified: number;
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

const FRAMEWORK_CONTROLS: Record<string, string[]> = {
  SOC2: [
    "Access Control",
    "Change Management",
    "Incident Response",
    "Risk Assessment",
    "Vendor Management",
  ],
  ISO27001: [
    "Information Security Policy",
    "Asset Management",
    "Access Control",
    "Cryptography",
    "Physical Security",
  ],
  "NIST CSF": ["Identify", "Protect", "Detect", "Respond", "Recover"],
  HIPAA: [
    "Privacy Rule",
    "Security Rule",
    "Breach Notification",
    "Administrative Safeguards",
  ],
  GDPR: [
    "Data Mapping",
    "Consent Management",
    "Data Subject Rights",
    "DPO Appointment",
    "Breach Notification",
  ],
};

function buildDefaultControls(frameworks: string[]): Control[] {
  const controls: Control[] = [];
  for (const fw of frameworks) {
    const names = FRAMEWORK_CONTROLS[fw];
    if (!names) continue;
    for (const name of names) {
      controls.push({
        id: `${fw.toLowerCase().replace(/\s+/g, "_")}_${name.toLowerCase().replace(/\s+/g, "_")}`,
        framework: fw,
        name,
        status: "not_started",
        notes: "",
      });
    }
  }
  return controls;
}

async function ensureScoreTables(db: any): Promise<void> {
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
}

async function calculateScores(
  db: any,
  tenantId: string,
): Promise<FrameworkScore[]> {
  // Read tenant frameworks
  let frameworks: string[] = [];
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'frameworks'`,
      )
      .bind(tenantId)
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

  // Read tenant controls
  let controls: Control[] | null = null;
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
      )
      .bind(tenantId)
      .first();
    if (row?.value) {
      controls = JSON.parse(row.value as string);
    }
  } catch {
    // no saved controls
  }
  if (!controls) {
    controls = buildDefaultControls(frameworks);
  }

  // Calculate per-framework scores
  const scores: FrameworkScore[] = [];
  const upsertStmts: any[] = [];
  const historyStmts: any[] = [];

  for (const fw of frameworks) {
    const fwControls = controls.filter((c) => c.framework === fw);
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

    const weightSum = fwControls.reduce(
      (sum, c) => sum + (STATUS_WEIGHTS[c.status] ?? 0),
      0,
    );
    const score = Math.round((weightSum / total) * 100 * 100) / 100;
    const grade = computeGrade(score);
    const implemented = fwControls.filter(
      (c) => c.status === "implemented" || c.status === "verified",
    ).length;
    const verified = fwControls.filter((c) => c.status === "verified").length;

    scores.push({
      framework: fw,
      score,
      grade,
      controlsTotal: total,
      controlsImplemented: implemented,
      controlsVerified: verified,
    });

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
        .bind(tenantId, fw, score, grade, total, implemented, verified),
    );

    historyStmts.push(
      db
        .prepare(
          `INSERT INTO compliance_history (id, tenant_id, framework, score, grade, recorded_at)
           VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, datetime('now'))`,
        )
        .bind(tenantId, fw, score, grade),
    );
  }

  if (upsertStmts.length > 0) {
    await db.batch([...upsertStmts, ...historyStmts]);
  }

  return scores;
}

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  await ensureScoreTables(db);
  const scores = await calculateScores(db, user.tenantId);

  return json({ scores });
};

export const POST: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  await ensureScoreTables(db);
  const scores = await calculateScores(db, user.tenantId);

  return json({ scores, recalculated: true });
};
