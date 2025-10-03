export interface RuntimeConfig {
  complianceBase: string; // original primary base from server
  fallbackBases?: string[]; // ordered list from server (append-only contract)
  resolvedBase?: string; // first reachable base chosen client-side
}

let _config: RuntimeConfig | null = null;
let _pending: Promise<RuntimeConfig> | null = null;

export async function getRuntimeConfig(
  fetchFn: typeof fetch = fetch,
): Promise<RuntimeConfig> {
  if (_config) return _config;
  if (_pending) return _pending; // _pending is a Promise<RuntimeConfig>
  _pending = (async () => {
    const fallback: RuntimeConfig = { complianceBase: "/api/mock/compliance" };
    try {
      const res = await fetchFn("/api/config");
      if (!res.ok) return fallback;
      const json: any = await res.json();
      const bases: string[] = Array.isArray(json?.fallbackBases)
        ? json.fallbackBases.filter((x: any) => typeof x === "string")
        : [];
      const primary =
        typeof json?.complianceBase === "string"
          ? json.complianceBase
          : fallback.complianceBase;

      // Build ordered probe list: server fallbackBases (already de-duped) then ensure mock path last.
      const probeList = [...bases];
      if (!probeList.includes(primary)) probeList.unshift(primary);
      if (!probeList.includes("/api/mock/compliance"))
        probeList.push("/api/mock/compliance");

      const resolved = await resolveFirstReachable(probeList, fetchFn);
      const cfg: RuntimeConfig = {
        complianceBase: primary,
        fallbackBases: bases,
        resolvedBase: resolved,
      };
      _config = cfg;
      return cfg;
    } catch {
      _config = fallback;
      return fallback;
    } finally {
      _pending = null;
    }
  })();
  return _pending;
}

export function __resetRuntimeConfig() {
  _config = null;
  _pending = null;
}

async function resolveFirstReachable(
  candidates: string[],
  fetchFn: typeof fetch,
): Promise<string> {
  for (const base of candidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);
      // Hit a lightweight path (snapshot for compliance); could be optimized by adding /health later.
      const url =
        base.endsWith("/snapshot") || base.includes("/snapshot")
          ? base
          : base.replace(/\/$/, "") + "/snapshot";
      const r = await fetchFn(url, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (r.ok) return base;
    } catch {
      /* ignore and continue */
    }
  }
  return candidates[candidates.length - 1];
}
