// Configuration helper for orchestrator worker
// MCP endpoint must be configured via environment variables.
// The legacy hardcoded endpoint has been removed.

export function resolveMcpEndpoint(env) {
  const fromEnv = env && (env.MCP_ENDPOINT || env.MCP_BASE_URL || env.MCP_URL);
  if (!fromEnv || !String(fromEnv).trim()) {
    // Return null when not configured - callers should handle gracefully
    // This allows tests and development without MCP integration
    return null;
  }
  return String(fromEnv).trim();
}
