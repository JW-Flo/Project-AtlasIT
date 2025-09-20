import {
  registerAdapter,
  listAdapters,
} from "../../../../packages/idp/src/index";
import {
  createOktaAdapter,
  OKTA_ADAPTER_ID,
  OKTA_FLAG_ENV,
} from "@atlasit/idp-adapters/okta";

let registryInitialized = false;

function ensureRegistry() {
  if (!registryInitialized) {
    registerAdapter(OKTA_ADAPTER_ID, createOktaAdapter(), {
      flagEnvVar: OKTA_FLAG_ENV,
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
  // listAdapters reads from process.env; apply incoming env for tests
  Object.assign(process.env, env);
  const adapters = listAdapters({ enabledOnly: true }).map((entry) => ({
    id: entry.id,
    enabled: entry.enabled,
  }));
  return new Response(JSON.stringify({ adapters }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
