// Central logging utility (append-only evolution)
// Provides: log(level,event,payload,{env,c}) with correlation id support and in-memory ring buffer
// Optionally persists to D1 (LOG_DB) if binding provided (table `logs` with columns id, ts, level, event, correlationId, payload JSON)

import { normalizeLog, validateLog } from "./log-schema.ts";

const RING_MAX = 200;
const ring = [];

function pushRing(entry) {
  ring.push(entry);
  if (ring.length > RING_MAX) ring.shift();
}

export function generateCorrelationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return "cid-" + Math.random().toString(36).slice(2);
}

export function getRecentLogs(limit, level) {
  const lim = typeof limit === "number" ? limit : 50;
  const filtered = level ? ring.filter((r) => r.level === level) : ring;
  return filtered.slice(-lim);
}

// --- Redaction ------------------------------------------------------------
const REDACT_KEYS =
  /password|secret|token|authorization|api[-_]?key|session|cookie|email/i;
const EMAIL_REGEX = /([A-Z0-9._%+-]){3}[^@]*@/i;

function redactValue(key, value) {
  if (value == null) return value;
  if (typeof value === "string") {
    if (
      /password|secret|token|authorization|api[-_]?key|session|cookie/i.test(
        key,
      )
    )
      return "[REDACTED]";
    if (/email/i.test(key)) {
      return value.replace(EMAIL_REGEX, (m) => m.slice(0, 3) + "***@");
    }
    if (value.length > 512) return value.slice(0, 256) + "...[truncated]";
  }
  if (typeof value === "object") return redactObject(value);
  return value;
}

function redactObject(obj) {
  if (Array.isArray(obj)) return obj.map((v) => redactValue("item", v));
  const copy = {};
  for (const k of Object.keys(obj)) {
    if (REDACT_KEYS.test(k)) {
      copy[k] = "[REDACTED]";
      continue;
    }
    copy[k] = redactValue(k, obj[k]);
  }
  return copy;
}

function buildEntry(level, event, payload, correlationId) {
  const safePayload = redactObject(payload || {});
  return normalizeLog({ level, event, correlationId, meta: safePayload });
}

async function persistEntry(base, env) {
  const db = env?.LOG_DB || env?.LOGS_DB || env?.logsDB;
  if (!(db && db.prepare)) return;
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
        JSON.stringify(base.meta || {}),
      )
      .run();
  } catch (e) {
    console.warn?.("[log.persist_failed]", String(e));
  }
}

function analyticsEntry(base, env) {
  const analytics = env?.ATLAS_ANALYTICS || env?.analytics;
  if (!analytics || !analytics.writeDataPoint) return;
  try {
    analytics.writeDataPoint({
      indexes: [base.level, base.event],
      blobs: [JSON.stringify(base.meta || {})],
      doubles: [1],
    });
  } catch (e) {
    console.warn?.("[log.analytics_write_failed]", String(e));
  }
}

export async function log(level, event, payload = {}, opts = {}) {
  try {
    const correlationId =
      opts.c?.get?.("correlationId") ||
      opts.correlationId ||
      generateCorrelationId();
    const base = buildEntry(level, event, payload, correlationId);
    if (!opts.skipValidation) {
      const result = validateLog(base);
      if (!result.ok)
        console.error("[log.validation_failed]", {
          event,
          issues: result.issues,
        });
    }
    const line = JSON.stringify(base);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    pushRing(base);
    const env = opts.env || opts.c?.env || {};
    await persistEntry(base, env);
    analyticsEntry(base, env);
    return base;
  } catch (err) {
    console.error("[log.internal_error]", err);
  }
}

export function correlationMiddleware() {
  return async (c, next) => {
    const existing = c.req.header("x-correlation-id");
    const cid = existing || generateCorrelationId();
    c.set("correlationId", cid);
    c.res.headers.set("x-correlation-id", cid);
    await next();
  };
}

export function logRequestMiddleware() {
  return async (c, next) => {
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
