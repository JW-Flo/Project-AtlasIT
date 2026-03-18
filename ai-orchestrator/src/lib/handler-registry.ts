/**
 * Pluggable step handler registry.
 *
 * Replaces the hard-coded handler dispatch in step-executor.ts with a
 * registry pattern. Built-in handlers (atlas.*, adapter provisioning)
 * are registered at startup, and tenants/plugins can register custom
 * handlers via the API.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface StepHandlerContext {
  tenantId: string;
  workflowRunId: string;
  stepId: string;
  context: Record<string, unknown>;
  adapterUrls: Record<string, string>;
  evidence?: R2Bucket;
  db?: D1Database;
}

export type StepHandlerFn = (ctx: StepHandlerContext) => Promise<unknown>;

interface RegisteredHandler {
  pattern: string;
  handler: StepHandlerFn;
  description: string;
}

// ── Registry ────────────────────────────────────────────────────────────────

const handlers: RegisteredHandler[] = [];

/**
 * Register a step handler.
 * Pattern can be exact ("atlas.resolve_access_bundle") or use wildcards
 * ("okta.*" matches any okta operation, "*.provision" matches any app provision).
 */
export function registerHandler(
  pattern: string,
  handler: StepHandlerFn,
  description = "",
): void {
  // Insert at beginning so more specific patterns (registered later) match first
  handlers.unshift({ pattern, handler, description });
}

/**
 * Resolve the handler for a given step action string.
 * Returns null if no handler matches.
 */
export function resolveHandler(action: string): StepHandlerFn | null {
  for (const entry of handlers) {
    if (matchPattern(entry.pattern, action)) {
      return entry.handler;
    }
  }
  return null;
}

/** List all registered handlers (for diagnostics). */
export function listHandlers(): Array<{
  pattern: string;
  description: string;
}> {
  return handlers.map((h) => ({
    pattern: h.pattern,
    description: h.description,
  }));
}

function matchPattern(pattern: string, action: string): boolean {
  if (pattern === action) return true;
  if (pattern === "*") return true;

  const patternParts = pattern.split(".");
  const actionParts = action.split(".");

  if (patternParts.length !== actionParts.length) return false;

  return patternParts.every((p, i) => p === "*" || p === actionParts[i]);
}

// ── Built-in handlers ───────────────────────────────────────────────────────

function extractUserProfile(context: Record<string, unknown>) {
  return {
    id: context.userId as string | undefined,
    externalId: context.externalId as string | undefined,
    email: context.email as string | undefined,
    displayName: context.displayName as string | undefined,
    firstName: context.firstName as string | undefined,
    lastName: context.lastName as string | undefined,
    department: context.department as string | undefined,
    title: context.title as string | undefined,
    manager: context.manager as string | undefined,
    phone: context.phone as string | undefined,
    groups: (context.groups as string[]) ?? [],
    appAccess:
      (context.appAccess as Array<{
        appId: string;
        role: string;
        groupId: string;
      }>) ?? [],
    rawAttributes: (context.rawAttributes as Record<string, unknown>) ?? {},
  };
}

/** Register all built-in step handlers. Call once at worker startup. */
export function registerBuiltinHandlers(): void {
  // Atlas internal: resolve access bundle
  registerHandler(
    "atlas.resolve_access_bundle",
    async (ctx) => ({
      resolvedApps: ctx.context.appAccess ?? [],
      resolvedGroups: ctx.context.groups ?? [],
      email: ctx.context.email,
      userId: ctx.context.userId,
    }),
    "Resolve user access bundle from directory context",
  );

  // Atlas internal: emit evidence
  registerHandler(
    "atlas.emit_evidence",
    async (ctx) => {
      if (!ctx.evidence) return { evidenceId: null, skipped: true };
      const evidenceId = crypto.randomUUID().replace(/-/g, "");
      const key = `workflow-evidence/${ctx.tenantId}/${evidenceId}.json`;
      await ctx.evidence.put(
        key,
        JSON.stringify({
          evidenceId,
          tenantId: ctx.tenantId,
          capturedAt: new Date().toISOString(),
          context: ctx.context,
        }),
      );
      return { evidenceId, key };
    },
    "Emit workflow evidence to R2",
  );

  // Atlas internal: update workflow run status in D1
  registerHandler(
    "atlas.update_run_status",
    async (ctx) => {
      if (!ctx.db) return { skipped: true };
      const status = (ctx.context.targetStatus as string) ?? "completed";
      await ctx.db
        .prepare(
          `UPDATE workflow_runs SET status = ?, steps_done = steps_done + 1, updated_at = datetime('now')
           WHERE id = ? AND tenant_id = ?`,
        )
        .bind(status, ctx.workflowRunId, ctx.tenantId)
        .run();
      return { updated: true };
    },
    "Update workflow run status in D1",
  );

  // Generic adapter provision (matches any app.provision)
  registerHandler(
    "*.provision",
    async (ctx) => {
      const appId = ctx.stepId
        .replace(/^(provision_|provision_new_)/, "")
        .replace(/_.*$/, "");
      const adapterUrl = ctx.adapterUrls[appId];
      if (!adapterUrl) throw new Error(`No adapter URL for "${appId}"`);

      const res = await fetch(`${adapterUrl}/api/provision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": ctx.tenantId,
        },
        body: JSON.stringify({
          tenantId: ctx.tenantId,
          userProfile: extractUserProfile(ctx.context),
          config: {},
        }),
      });
      if (!res.ok)
        throw new Error(`${appId} provision failed: HTTP ${res.status}`);
      return res.json().catch(() => ({}));
    },
    "Provision user in adapter via /api/provision",
  );

  // Generic adapter deprovision (matches any app.deprovision)
  registerHandler(
    "*.deprovision",
    async (ctx) => {
      const appId = ctx.stepId
        .replace(/^(revoke_|revoke_old_|deprovision_)/, "")
        .replace(/_.*$/, "");
      const adapterUrl = ctx.adapterUrls[appId];
      if (!adapterUrl) throw new Error(`No adapter URL for "${appId}"`);

      const res = await fetch(`${adapterUrl}/api/deprovision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": ctx.tenantId,
        },
        body: JSON.stringify({
          tenantId: ctx.tenantId,
          userProfile: extractUserProfile(ctx.context),
          config: {},
        }),
      });
      if (!res.ok)
        throw new Error(`${appId} deprovision failed: HTTP ${res.status}`);
      return res.json().catch(() => ({}));
    },
    "Deprovision user in adapter via /api/deprovision",
  );

  // Generic adapter sync
  registerHandler(
    "*.sync",
    async (ctx) => {
      const appId = ctx.stepId.replace(/^sync_/, "");
      const adapterUrl = ctx.adapterUrls[appId];
      if (!adapterUrl) throw new Error(`No adapter URL for "${appId}"`);

      const res = await fetch(`${adapterUrl}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": ctx.tenantId,
        },
        body: JSON.stringify({ tenantId: ctx.tenantId }),
      });
      if (!res.ok) throw new Error(`${appId} sync failed: HTTP ${res.status}`);
      return res.json().catch(() => ({}));
    },
    "Trigger directory sync on adapter",
  );
}
