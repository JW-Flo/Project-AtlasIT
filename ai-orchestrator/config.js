// Configuration helper for orchestrator worker
// MCP endpoint must be configured via environment variables.
// The legacy hardcoded endpoint has been removed.

export function resolveMcpEndpoint(env) {
  const fromEnv = env && (env.MCP_ENDPOINT || env.MCP_BASE_URL || env.MCP_URL);
  if (!fromEnv || !String(fromEnv).trim()) {
    // Return explicit result object when not configured
    // This allows tests and development without MCP integration
    return { configured: false, endpoint: null };
  }
  return { configured: true, endpoint: String(fromEnv).trim() };
}
