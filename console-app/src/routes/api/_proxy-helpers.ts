export function getWorkerBase(platform: any): string {
  const env = (platform?.env as any) || {};
  const complianceBase: string =
    env.COMPLIANCE_BASE || "https://compliance.atlasit.pro";
  return complianceBase.replace(/\/api\/compliance\/?$/, "").replace(/\/$/, "");
}

export function getEnv(platform: any): Record<string, any> {
  return (platform?.env as any) || {};
}

export async function proxyFetch(
  platform: any,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const env = getEnv(platform);
  if (env.COMPLIANCE_WORKER) {
    return env.COMPLIANCE_WORKER.fetch(new Request(url, init));
  }
  return fetch(url, init);
}
