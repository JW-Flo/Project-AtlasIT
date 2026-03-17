import type {
  ADPWorker,
  ADPWorkersResponse,
  ADPDepartment,
  ADPOrganizationDepartmentsResponse,
} from "./types.js";

const API_BASE = "https://api.adp.com";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  // ADP uses standard rate limit headers
  const remaining = parseInt(
    headers.get("X-RateLimit-Remaining") ?? headers.get("adp-rlimit-remaining") ?? "60",
    10,
  );
  const resetAt =
    parseInt(
      headers.get("X-RateLimit-Reset") ?? headers.get("adp-rlimit-reset") ?? "0",
      10,
    ) * 1000;
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function adpFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; hasMore: boolean; totalCount: number }> {
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

  if (response.status === 429) {
    const rateLimit = parseRateLimit(response.headers);
    await waitForRateLimit(rateLimit);
    // Retry once after rate limit wait
    const retryResponse = await fetch(url, init);
    if (!retryResponse.ok) {
      const errorBody = await retryResponse.text().catch(() => "Unknown error");
      throw new Error(`ADP API error (${retryResponse.status}): ${errorBody}`);
    }
    const data = (await retryResponse.json()) as T;
    return { data, hasMore: false, totalCount: 0 };
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`ADP API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  if (response.status === 204) {
    return { data: undefined as T, hasMore: false, totalCount: 0 };
  }

  const data = (await response.json()) as T;
  return { data, hasMore: false, totalCount: 0 };
}

// -- Workers (employees) --

export async function listWorkers(
  accessToken: string,
  skip: number = 0,
  top: number = 100,
): Promise<{ workers: ADPWorker[]; totalCount: number }> {
  const url = `${API_BASE}/hr/v2/workers?$skip=${skip}&$top=${top}`;
  const { data } = await adpFetch<ADPWorkersResponse>(url, accessToken);
  return {
    workers: data.workers ?? [],
    totalCount: data.meta?.totalNumber ?? data.workers?.length ?? 0,
  };
}

export async function listAllWorkers(
  accessToken: string,
): Promise<ADPWorker[]> {
  const allWorkers: ADPWorker[] = [];
  const pageSize = 100;
  let skip = 0;

  const first = await listWorkers(accessToken, skip, pageSize);
  allWorkers.push(...first.workers);

  const totalCount = first.totalCount;

  while (allWorkers.length < totalCount) {
    skip += pageSize;
    const page = await listWorkers(accessToken, skip, pageSize);
    if (page.workers.length === 0) break;
    allWorkers.push(...page.workers);
  }

  return allWorkers;
}

export async function getWorker(
  associateOID: string,
  accessToken: string,
): Promise<ADPWorker> {
  const url = `${API_BASE}/hr/v2/workers/${encodeURIComponent(associateOID)}`;
  const { data } = await adpFetch<{ workers: ADPWorker[] }>(url, accessToken);
  if (!data.workers?.[0]) {
    throw new Error(`Worker ${associateOID} not found`);
  }
  return data.workers[0];
}

// -- Organization Departments --

export async function listDepartments(
  accessToken: string,
  skip: number = 0,
  top: number = 100,
): Promise<{ departments: ADPDepartment[]; totalCount: number }> {
  const url = `${API_BASE}/hr/v2/organization-departments?$skip=${skip}&$top=${top}`;
  const { data } = await adpFetch<ADPOrganizationDepartmentsResponse>(
    url,
    accessToken,
  );
  return {
    departments: data.organizationDepartments ?? [],
    totalCount:
      data.meta?.totalNumber ?? data.organizationDepartments?.length ?? 0,
  };
}

export async function listAllDepartments(
  accessToken: string,
): Promise<ADPDepartment[]> {
  const allDepartments: ADPDepartment[] = [];
  const pageSize = 100;
  let skip = 0;

  const first = await listDepartments(accessToken, skip, pageSize);
  allDepartments.push(...first.departments);

  const totalCount = first.totalCount;

  while (allDepartments.length < totalCount) {
    skip += pageSize;
    const page = await listDepartments(accessToken, skip, pageSize);
    if (page.departments.length === 0) break;
    allDepartments.push(...page.departments);
  }

  return allDepartments;
}
