import type {
  WorkdayWorker,
  WorkdayOrganization,
  WorkdayListResponse,
} from "./types.js";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const remaining = parseInt(
    headers.get("X-Rate-Limit-Remaining") ?? "60",
    10,
  );
  const resetAt =
    parseInt(headers.get("X-Rate-Limit-Reset") ?? "0", 10) * 1000;
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

function buildBaseUrl(tenantUrl: string, tenantName: string): string {
  // Workday REST API: https://{host}/ccx/api/v1/{tenant}
  const url = new URL(tenantUrl);
  return `${url.origin}/ccx/api/v1/${encodeURIComponent(tenantName)}`;
}

async function workdayFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; headers: Headers }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`Workday API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  if (response.status === 204) {
    return { data: undefined as T, headers: response.headers };
  }

  const data = (await response.json()) as T;
  return { data, headers: response.headers };
}

async function paginateAll<T>(
  baseUrl: string,
  accessToken: string,
  pageSize: number = 100,
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${separator}limit=${pageSize}&offset=${offset}`;

    const { data } = await workdayFetch<WorkdayListResponse<T>>(
      url,
      accessToken,
    );

    results.push(...data.data);
    total = data.total;
    offset += pageSize;
  }

  return results;
}

// -- Workers --

export async function listWorkers(
  tenantUrl: string,
  tenantName: string,
  accessToken: string,
): Promise<WorkdayWorker[]> {
  const base = buildBaseUrl(tenantUrl, tenantName);
  const url = `${base}/workers`;
  return paginateAll<WorkdayWorker>(url, accessToken);
}

export async function getWorker(
  tenantUrl: string,
  tenantName: string,
  workerId: string,
  accessToken: string,
): Promise<WorkdayWorker> {
  const base = buildBaseUrl(tenantUrl, tenantName);
  const url = `${base}/workers/${encodeURIComponent(workerId)}`;
  const { data } = await workdayFetch<WorkdayWorker>(url, accessToken);
  return data;
}

// -- Organizations --

export async function listOrganizations(
  tenantUrl: string,
  tenantName: string,
  accessToken: string,
): Promise<WorkdayOrganization[]> {
  const base = buildBaseUrl(tenantUrl, tenantName);
  const url = `${base}/organizations`;
  return paginateAll<WorkdayOrganization>(url, accessToken);
}

export async function getOrganization(
  tenantUrl: string,
  tenantName: string,
  orgId: string,
  accessToken: string,
): Promise<WorkdayOrganization> {
  const base = buildBaseUrl(tenantUrl, tenantName);
  const url = `${base}/organizations/${encodeURIComponent(orgId)}`;
  const { data } = await workdayFetch<WorkdayOrganization>(url, accessToken);
  return data;
}
