import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
// __APP_VERSION__ and __GIT_COMMIT__ are defined via Vite define and declared in global.d.ts

interface ResourceStatus {
  ok: boolean;
  type: string;
}

export const GET: RequestHandler = async ({ platform }) => {
  const env = (platform?.env as any) || {};

  const map = <T extends Record<string, { ok: boolean; type: string }>>(o: T) =>
    o;

  const d1 = map({
    ATLAS_CORE_DB: { ok: !!env.ATLAS_CORE_DB, type: "d1" },
    ATLAS_AUDIT_DB: { ok: !!env.ATLAS_AUDIT_DB, type: "d1" },
    D1_COMPLIANCE: { ok: !!env.D1_COMPLIANCE, type: "d1" },
    D1_AUDIT: { ok: !!env.D1_AUDIT, type: "d1" },
  });

  const kv = map({
    KV_SESSIONS: { ok: !!env.KV_SESSIONS, type: "kv" },
    KV_CACHE: { ok: !!env.KV_CACHE, type: "kv" },
    KV_FEATURE_FLAGS: { ok: !!env.KV_FEATURE_FLAGS, type: "kv" },
  });

  const r2 = map({
    R2_POLICIES: { ok: !!env.R2_POLICIES, type: "r2" },
    R2_EVIDENCE: { ok: !!env.R2_EVIDENCE, type: "r2" },
    R2_ARTIFACTS: { ok: !!env.R2_ARTIFACTS, type: "r2" },
  });

  const analytics = map({
    ANALYTICS_EVENTS: { ok: !!env.ANALYTICS_EVENTS, type: "analytics" },
    ANALYTICS_METRICS: { ok: !!env.ANALYTICS_METRICS, type: "analytics" },
  });

  const queues = map({
    WORKFLOW_QUEUE: { ok: !!env.WORKFLOW_QUEUE, type: "queue" },
    Q_POLICY_REBUILD: { ok: !!env.Q_POLICY_REBUILD, type: "queue" },
    Q_RISK_RECALC: { ok: !!env.Q_RISK_RECALC, type: "queue" },
  });

  const resources = { d1, kv, r2, analytics, queues };

  return json({
    status: "ok",
    name: env.APP_NAME || "AtlasIT Console",
    journeyId: env.JOURNEY_ID || "continental-usa-2025",
    version:
      typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "unknown",
    commit: typeof __GIT_COMMIT__ !== "undefined" ? __GIT_COMMIT__ : "unknown",
    timestamp: new Date().toISOString(),
    resources,
  });
};
