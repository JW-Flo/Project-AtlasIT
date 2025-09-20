import {
  registerAdapter,
  getAdapter,
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

export async function POST(event: any) {
  ensureRegistry();
  const env = toEnv(event);
  Object.assign(process.env, env);
  const adapter = getAdapter(OKTA_ADAPTER_ID) as any;
  if (!adapter) {
    return new Response(
      JSON.stringify({ error: "No IdP adapter enabled" }, null, 2),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const bodyText = await event?.request?.text?.();
  let payload: any = undefined;
  if (bodyText) {
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }, null, 2),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
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

  const result = await adapter.provision({
    user: payload.user,
    groups: payload.groups ?? [],
  });
  const wrapped = { ok: true, ...result };
  return new Response(JSON.stringify({ result: wrapped }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
