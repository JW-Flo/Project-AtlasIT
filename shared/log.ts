// Central logging utility (append-only evolution)
// Provides: log(level,event,payload,{env,c}) with correlation id support and in-memory ring buffer
// Optionally persists to D1 (LOG_DB) if binding provided (table `logs` with columns id, ts, level, event, correlationId, payload JSON)

// Import without explicit .ts extension to satisfy TypeScript configuration
import { normalizeLog, validateLog } from "./log-schema";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  env?: any; // Cloudflare Worker env
  c?: any; // Hono context (for correlation id)
  correlationId?: string;
  skipValidation?: boolean;
}

const RING_MAX = 200;
const ring: any[] = [];

function pushRing(entry: any) {
  ring.push(entry);
  if (ring.length > RING_MAX) ring.shift();
}

export function generateCorrelationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return "cid-" + Math.random().toString(36).slice(2);
}

export function getRecentLogs(limit = 50, level?: LogLevel) {
  const filtered = level ? ring.filter((r) => r.level === level) : ring;
  return filtered.slice(-limit);
}

export async function log(
  level: LogLevel,
  event: string,
  payload: Record<string, any> = {},
  opts: LogOptions = {},
) {
  try {
    const correlationId =
      opts.c?.get?.("correlationId") ||
      opts.correlationId ||
      generateCorrelationId();
    const base = normalizeLog({ level, event, correlationId, payload });
    if (!opts.skipValidation) {
      const result = validateLog(base);
      if (!result.ok) {
        // Fallback minimal console output if validation fails
        console.error("[log.validation_failed]", {
          event,
          issues: result.issues,
        });
      }
    }

    // Console output (structured JSON string)
    const line = JSON.stringify(base);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);

    pushRing(base);

    // Persist to D1 if available
    const env = opts.env || opts.c?.env;
    const db = env?.LOG_DB || env?.LOGS_DB || env?.logsDB;
    if (db && db.prepare) {
      try {
        await db
          .prepare(
            "INSERT INTO logs (ts, level, event, correlationId, payload) VALUES (?1, ?2, ?3, ?4, ?5)",
          )
          .bind(
            base.ts,
            base.level,
            base.event,
            base.correlationId,
            JSON.stringify(base.payload || {}),
          )
          .run();
      } catch (_tableErr) {
        // ignore missing table or other persistence errors (non-fatal)
      }
    }

    // Analytics Engine (if binding provided)
    const analytics = env?.ATLAS_ANALYTICS || env?.analytics;
    if (analytics && analytics.writeDataPoint) {
      try {
        analytics.writeDataPoint({
          indexes: [base.level, base.event],
          blobs: [JSON.stringify(base.payload || {})],
          doubles: [1],
        });
      } catch (_analyticsErr) {
        // minimal handling to satisfy lint (avoid silent swallow)
        if (typeof console !== "undefined")
          console.debug?.("[log.analytics_write_failed]");
      }
    }

    return base;
  } catch (err) {
    console.error("[log.internal_error]", err);
  }
}

// Hono middleware to ensure correlation id present
export function correlationMiddleware() {
  return async (c: any, next: any) => {
    const existing = c.req.header("x-correlation-id");
    const cid = existing || generateCorrelationId();
    c.set("correlationId", cid);
    c.res.headers.set("x-correlation-id", cid);
    await next();
  };
}

export function logRequestMiddleware() {
  return async (c: any, next: any) => {
    const start = Date.now();
    await next();
    const durationMs = Date.now() - start;
    log(
      "info",
      "http.request",
      {
        path: c.req.path,
        method: c.req.method,
        status: c.res.status,
        durationMs,
      },
      { c },
    );
  };
}

export default log;
