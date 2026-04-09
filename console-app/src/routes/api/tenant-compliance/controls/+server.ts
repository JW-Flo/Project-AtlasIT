import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { buildDefaultControls, aggregateEvidenceForControls, type Control } from "$lib/compliance/framework-controls";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  // Get tenant frameworks
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

  // Check for saved control statuses
  let controls: Control[] | null = null;
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
      )
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      controls = JSON.parse(row.value as string);
    }
  } catch {
    // no saved controls
  }

  // Build defaults for current frameworks; if saved controls are stale (fewer
  // than defaults — e.g. old 5-per-framework vs current 139), rebuild the set
  // while preserving any saved statuses/notes.
  const defaults = buildDefaultControls(frameworks);
  if (!controls || controls.length < defaults.length) {
    const savedMap = new Map((controls || []).map((c: Control) => [c.id, c]));
    controls = defaults.map((d) => {
      const saved = savedMap.get(d.id);
      if (saved) return { ...d, status: saved.status, notes: saved.notes };
      return d;
    });
    // Persist the expanded controls so this migration only runs once
    try {
      await db
        .prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'compliance_controls', ?)`,
        )
        .bind(user.tenantId, JSON.stringify(controls))
        .run();
    } catch {
      // best-effort
    }
  }

  // Filter controls to only include those for the tenant's selected frameworks
  const frameworkSet = new Set(frameworks);
  const scopedControls = controls!.filter((c) => frameworkSet.has(c.framework));

  // Fetch evidence counts per CDT control ID, then aggregate into simplified control IDs
  const rawCdtCounts: Record<string, number> = {};
  let totalEvidenceCount = 0;
  try {
    const { results: rows } = await db
      .prepare(
        `SELECT control_id, COUNT(*) as count
         FROM compliance_evidence
         WHERE tenant_id = ?
         GROUP BY control_id`,
      )
      .bind(user.tenantId)
      .all<{ control_id: string; count: number }>();
    for (const row of rows ?? []) {
      rawCdtCounts[row.control_id] = row.count;
      totalEvidenceCount += row.count;
    }
  } catch {
    // compliance_evidence table may not exist yet — return empty counts
  }

  // Map CDT evidence (CC6.1, A.9.2.2, PR.AC-1, etc.) to simplified control IDs
  const evidenceCounts = aggregateEvidenceForControls(rawCdtCounts);

  // Auto-promote control statuses based on evidence:
  //   - evidence exists (1-2 items) → at least "in_progress"
  //   - 3+ evidence items → at least "implemented"
  //   - user-set "verified" is never downgraded
  const STATUS_RANK: Record<string, number> = {
    not_started: 0,
    in_progress: 1,
    implemented: 2,
    verified: 3,
  };
  const RANK_STATUS = ["not_started", "in_progress", "implemented", "verified"] as const;
  let promoted = false;

  for (const control of scopedControls) {
    const evCount = evidenceCounts[control.id] || 0;
    if (evCount === 0) continue;
    const currentRank = STATUS_RANK[control.status] ?? 0;
    const evidenceRank = evCount >= 3 ? 2 : 1; // 3+ → implemented, 1-2 → in_progress
    if (evidenceRank > currentRank) {
      control.status = RANK_STATUS[evidenceRank];
      promoted = true;
    }
  }

  // Persist auto-promoted statuses back to DB so scores stay in sync
  if (promoted) {
    try {
      // Re-merge with full control list (including controls outside current framework filter)
      const allControls = controls!.map((c) => {
        const updated = scopedControls.find((sc) => sc.id === c.id);
        return updated || c;
      });
      await db
        .prepare(
          `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
           VALUES (?, 'compliance_controls', ?)`,
        )
        .bind(user.tenantId, JSON.stringify(allControls))
        .run();
    } catch {
      // Best-effort — don't fail the GET
    }
  }

  return json({ frameworks, controls: scopedControls, evidenceCounts, rawCdtCounts, totalEvidenceCount, frameworksConfigured });
};

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const env = (platform?.env as any) || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });

  const body = await request.json().catch(() => ({}));
  const { controls } = body as { controls?: Control[] };

  if (!controls || !Array.isArray(controls)) {
    return json({ error: "controls array required" }, { status: 400 });
  }

  // Validate each control
  const validStatuses = ["not_started", "in_progress", "implemented", "verified"];
  for (const c of controls) {
    if (!c.id || !c.framework || !c.name || !validStatuses.includes(c.status)) {
      return json({ error: `Invalid control: ${c.id}` }, { status: 400 });
    }
  }

  // Merge incoming controls with the full stored set so that controls belonging
  // to frameworks outside the current selection are not wiped.
  let existingControls: any[] = [];
  try {
    const row = await db
      .prepare(
        `SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = 'compliance_controls'`,
      )
      .bind(user.tenantId)
      .first();
    if (row?.value) {
      existingControls = JSON.parse(row.value as string);
    }
  } catch {
    // no existing controls — save as-is
  }

  const incomingIds = new Set(controls.map((c: any) => c.id));
  const preserved = existingControls.filter((c: any) => !incomingIds.has(c.id));
  const merged = [...preserved, ...controls];

  await db
    .prepare(
      `INSERT OR REPLACE INTO tenant_preferences (tenant_id, key, value)
       VALUES (?, 'compliance_controls', ?)`,
    )
    .bind(user.tenantId, JSON.stringify(merged))
    .run();

  return json({ success: true });
};
