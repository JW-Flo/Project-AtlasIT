import { listIntegrations } from "./registry.js";
import { jmlCatalogByApp } from "./jml/index.js";

export const SUPPORTED_IDP_SOURCES = new Set([
  "okta",
  "google_workspace",
  "active_directory",
  "entra_id",
]);

export function normalizeIdpSource(input) {
  if (typeof input !== "string") return null;
  const normalized = input.toLowerCase().trim();
  if (SUPPORTED_IDP_SOURCES.has(normalized)) return normalized;
  return null;
}

export function buildLifecycleWorkflowsForApp(app, idpSource) {
  const definition = jmlCatalogByApp.get(app.id);
  const fallback = {
    joiner: ["provision_account", "assign_baseline_access", "notify_manager"],
    mover: ["reconcile_entitlements", "update_role_access", "notify_manager"],
    leaver: ["suspend_account", "revoke_access", "archive_audit_event"],
  };
  const byIdp = definition?.workflows?.[idpSource] || fallback;

  return {
    appId: app.id,
    category: app.category,
    idpSource,
    connector: definition?.connector || {
      integrationId: app.id,
      slug: `${app.id}-connector`,
      mode: "fallback",
      joinerWorkflowFile: `shared/integrations/jml/workflows/${app.id}/joiner.workflow.yaml`,
    },
    joiner: byIdp.joiner,
    mover: byIdp.mover,
    leaver: byIdp.leaver,
  };
}

export function resolveLifecycleApps(payload, state) {
  const connectedIds = Array.from(state.connected.values());
  if (Array.isArray(payload.apps) && payload.apps.length > 0) {
    return payload.apps
      .filter((id) => typeof id === "string" && id.trim())
      .map((id) => id.trim());
  }
  if (payload.scope === "connected") return connectedIds;
  return listIntegrations().map((i) => i.id);
}
