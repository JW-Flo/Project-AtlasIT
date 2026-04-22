const __vite_import_meta_env__ = {};
const AWS_API_BASE = __vite_import_meta_env__?.VITE_API_URL ?? "";
function getAuthToken() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem("atlasit_token");
}
async function doFetch(base, path, init) {
  const resolved = base || AWS_API_BASE || void 0;
  if (!resolved) throw new Error("Missing API base for " + path);
  const url = resolved.replace(/\/$/, "") + path;
  const headers = new Headers(init?.headers || {});
  if (!headers.has("x-correlation-id")) headers.set("x-correlation-id", crypto.randomUUID());
  const token = getAuthToken();
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${token}`);
  }
  const resp = await fetch(url, { ...init, headers });
  return resp;
}
async function coreFetch(env, path, init) {
  return doFetch(env.CORE_API_BASE, path, init);
}
async function dispatchFetch(env, path, init) {
  return doFetch(env.DISPATCH_BASE, path, init);
}
async function orchestratorFetch(env, path, init) {
  return doFetch(env.ORCHESTRATOR_BASE, path, init);
}

export { coreFetch as c, dispatchFetch as d, orchestratorFetch as o };
//# sourceMappingURL=api-IZoNGiDX.js.map
