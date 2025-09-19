import {
  registerAdapter,
  getAdapter,
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

export async function POST(event: any) {
  ensureRegistry();
  const env = toEnv(event);
  const adapter = getAdapter(oktaAdapter.id, { env, requireEnabled: true });
  if (!adapter) {
    return new Response(
      JSON.stringify({ error: "No IdP adapter enabled" }, null, 2),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  let payload: any;
  try {
    payload = await event?.request?.json?.();
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }, null, 2),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!payload?.user) {
    return new Response(
      JSON.stringify({ error: "user is required" }, null, 2),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const result = await adapter.provisionUser(payload);
  return new Response(JSON.stringify({ result }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
