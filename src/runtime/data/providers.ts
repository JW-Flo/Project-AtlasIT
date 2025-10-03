import { list } from "../registry/registry";
import { isDataProviderFeature } from "../features/types";

export interface ProviderFetchOptions {
  params?: Record<string, unknown>;
  ctx?: unknown;
}

export async function fetchProvider(
  id: string,
  opts: ProviderFetchOptions = {},
): Promise<unknown> {
  const providers = list("data").filter(isDataProviderFeature as any);
  const provider = providers.find((p) => p.id === id) as any;
  if (!provider) {
    throw new Error(`provider.not_found:${id}`);
  }
  return provider.fetch(opts.params, opts.ctx);
}

export function listProviders(): ReadonlyArray<{
  id: string;
  version?: string;
}> {
  const providers = list("data").filter(isDataProviderFeature as any);
  return providers.map((p) => ({ id: p.id, version: p.version }));
}
