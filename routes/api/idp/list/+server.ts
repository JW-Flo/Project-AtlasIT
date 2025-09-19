import {
  registerAdapter,
  listAdapters,
} from "../../../../packages/idp/src/index.ts";
import oktaAdapter from "../../../../packages/idp-adapters/okta/src/index.ts";

let registryInitialized = false;

function ensureRegistry() {
  if (!registryInitialized) {
    registerAdapter(oktaAdapter.id, oktaAdapter, {
      flagEnvVar: oktaAdapter.featureFlag,
    });
    registryInitialized = true;
  }
}

function toEnv(event: any): Record<string, string | undefined> {
  return (
    (event?.locals?.env as Record<string, string | undefined>) ??
    (event?.env as Record<string, string | undefined>) ??
    (process.env as Record<string, string | undefined>)
  );
}

export async function GET(event: any) {
  ensureRegistry();
  const env = toEnv(event);
  const adapters = listAdapters({ enabledOnly: true, env }).map((entry) => ({
    id: entry.id,
    displayName: entry.displayName,
  }));
  return new Response(JSON.stringify({ adapters }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
