// Configuration helper for orchestrator worker
// Provides environment-based override for MCP endpoint while preserving legacy fallback.

export function resolveMcpEndpoint(env) {
  const fromEnv = env && (env.MCP_ENDPOINT || env.MCP_BASE_URL || env.MCP_URL);
  return (
    (fromEnv && String(fromEnv).trim()) ||
    "https://atlasit-mcp.kd8jc7v8cd.workers.dev"
  );
}
