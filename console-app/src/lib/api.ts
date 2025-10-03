export interface ApiEnv {
  CORE_API_BASE?: string;
  DISPATCH_BASE?: string;
  COMPLIANCE_BASE?: string;
  ORCHESTRATOR_BASE?: string;
}

async function doFetch(
  base: string | undefined,
  path: string,
  init?: RequestInit,
) {
  if (!base) throw new Error("Missing API base for " + path);
  const url = base.replace(/\/$/, "") + path;
  const headers = new Headers(init?.headers || {});
  if (!headers.has("x-correlation-id"))
    headers.set("x-correlation-id", crypto.randomUUID());
  const resp = await fetch(url, { ...init, headers });
  return resp;
}

export async function coreFetch(env: ApiEnv, path: string, init?: RequestInit) {
  return doFetch(env.CORE_API_BASE, path, init);
}

export async function dispatchFetch(
  env: ApiEnv,
  path: string,
  init?: RequestInit,
) {
  return doFetch(env.DISPATCH_BASE, path, init);
}

export async function complianceFetch(
  env: ApiEnv,
  path: string,
  init?: RequestInit,
) {
  return doFetch(env.COMPLIANCE_BASE, path, init);
}

export async function orchestratorFetch(
  env: ApiEnv,
  path: string,
  init?: RequestInit,
) {
  return doFetch(env.ORCHESTRATOR_BASE, path, init);
}
