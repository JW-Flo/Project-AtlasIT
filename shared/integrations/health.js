import { integrations } from "./registry.js";

// Simple per-integration health stub. Future: real API pings.
// Uses env flags: INTEGRATION_<UPPER_ID>_ENABLED, INTEGRATION_<UPPER_ID>_ERROR
export async function probeIntegrations(env) {
  const results = [];
  for (const i of integrations) {
    const upper = i.id.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const enabled = env[`INTEGRATION_${upper}_ENABLED`] === "1";
    const forcedError = env[`INTEGRATION_${upper}_ERROR`] === "1";
    let status = enabled ? "enabled" : "disabled";
    let error = null;
    if (enabled && forcedError) {
      status = "error";
      error = "forced_error_flag";
    }
    results.push({
      id: i.id,
      name: i.name,
      category: i.category,
      status,
      error,
    });
  }
  return results;
}
