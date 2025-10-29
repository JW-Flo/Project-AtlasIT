// Configuration helper for orchestrator worker
// MCP endpoint must be configured via environment variables.
// The legacy hardcoded endpoint has been removed.

export function resolveMcpEndpoint(env) {
  const fromEnv = env && (env.MCP_ENDPOINT || env.MCP_BASE_URL || env.MCP_URL);
  if (!fromEnv || !String(fromEnv).trim()) {
    // Return null to indicate MCP endpoint is not configured
    // Callers should handle this appropriately (e.g., skip MCP integration)
    return null;
  }
  return String(fromEnv).trim();
}
