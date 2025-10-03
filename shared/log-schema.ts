// Structured log schema & validator (append-only fields)
export interface AtlasLogBase {
  ts: string; // ISO timestamp
  level: "debug" | "info" | "warn" | "error";
  event: string; // canonical event name (kebab / dot)
  correlationId?: string; // request/span correlation
  durationMs?: number; // operation latency
  service?: string; // emitting service
  status?: string; // success|failure|... domain-specific
  actor?: string | null; // user / system actor
  component?: string; // subsystem tag
  message?: string; // human-friendly detail
  meta?: Record<string, any>; // extra contextual fields
}

export type AtlasLog = AtlasLogBase & Record<string, any>; // allow extension

export interface LogValidationIssue {
  path: string;
  message: string;
}

export interface LogValidationResult {
  ok: boolean;
  issues: LogValidationIssue[];
}

const LEVELS = new Set(["debug", "info", "warn", "error"]);

export function validateLog(entry: any): LogValidationResult {
  const issues: LogValidationIssue[] = [];
  if (!entry || typeof entry !== "object") {
    return {
      ok: false,
      issues: [{ path: "", message: "Entry not an object" }],
    };
  }
  if (typeof entry.ts !== "string")
    issues.push({ path: "ts", message: "ts (ISO string) required" });
  if (!LEVELS.has(entry.level))
    issues.push({ path: "level", message: "invalid level" });
  if (typeof entry.event !== "string")
    issues.push({ path: "event", message: "event required" });
  if (entry.durationMs != null && typeof entry.durationMs !== "number")
    issues.push({ path: "durationMs", message: "durationMs must be number" });
  if (entry.meta != null && typeof entry.meta !== "object")
    issues.push({ path: "meta", message: "meta must be object" });
  return { ok: issues.length === 0, issues };
}

export function normalizeLog(partial: Partial<AtlasLog>): AtlasLog {
  const base: AtlasLog = {
    ts: partial.ts || new Date().toISOString(),
    level: (partial.level as any) || "info",
    event: partial.event || "unknown",
    correlationId: partial.correlationId,
    durationMs: partial.durationMs,
    service: partial.service,
    status: partial.status,
    actor: partial.actor ?? null,
    component: partial.component,
    message: partial.message,
    meta:
      partial.meta && typeof partial.meta === "object"
        ? partial.meta
        : undefined,
  };
  return base;
}
