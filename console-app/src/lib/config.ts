export interface RuntimeConfig {
  complianceBase: string;
  resolvedBase?: string;
}

let _config: RuntimeConfig | null = null;
let _pending: Promise<RuntimeConfig> | null = null;

export async function getRuntimeConfig(
  fetchFn: typeof fetch = fetch,
): Promise<RuntimeConfig> {
  if (_config) return _config;
  if (_pending) return _pending;
  _pending = (async () => {
    const fallback: RuntimeConfig = { complianceBase: "/api/mock/compliance" };
    try {
      const res = await fetchFn("/api/config");
      if (!res.ok) return fallback;
      const json: any = await res.json();
      const primary =
        typeof json?.complianceBase === "string"
          ? json.complianceBase
          : fallback.complianceBase;
      const resolved =
        typeof json?.resolvedBase === "string" ? json.resolvedBase : primary;
      const cfg: RuntimeConfig = {
        complianceBase: primary,
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
