import type {
  CrowdStrikeTokenResponse,
  CrowdStrikeUser,
  CrowdStrikeDevice,
  CrowdStrikeHostGroup,
  CrowdStrikeResourceResponse,
  CrowdStrikeIdResponse,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.crowdstrike.com";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function parseRateLimit(headers: Headers): RateLimitInfo {
  const remaining = parseInt(
    headers.get("X-RateLimit-Remaining") ?? "100",
    10,
  );
  const retryAfter = parseInt(headers.get("X-RateLimit-RetryAfter") ?? "0", 10);
  const resetAt = retryAfter > 0 ? Date.now() + retryAfter * 1000 : 0;
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

/**
 * Authenticate with CrowdStrike OAuth2 client credentials flow.
 * POST /oauth2/token with client_id and client_secret as form data.
 */
export async function authenticate(
  clientId: string,
  clientSecret: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const response = await fetch(`${baseUrl}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `CrowdStrike auth failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as CrowdStrikeTokenResponse;
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Clear the cached OAuth token (useful after 401 responses).
 */
export function clearTokenCache(): void {
  tokenCache = null;
}

async function crowdstrikeFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
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
    // Retry once after waiting
    const retryResponse = await fetch(url, init);
    if (!retryResponse.ok) {
      const errorBody = await retryResponse
        .text()
        .catch(() => "Unknown error");
      throw new Error(
        `CrowdStrike API error (${retryResponse.status}): ${errorBody}`,
      );
    }
    return (await retryResponse.json()) as T;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(
      `CrowdStrike API error (${response.status}): ${errorBody}`,
    );
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  return (await response.json()) as T;
}

/**
 * Fetch all IDs using offset-based pagination, then resolve entities in batches.
 */
async function paginateIds(
  baseUrl: string,
  path: string,
  accessToken: string,
  limit: number = 100,
): Promise<string[]> {
  const allIds: string[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}${path}${path.includes("?") ? "&" : "?"}offset=${offset}&limit=${limit}`;
    const response = await crowdstrikeFetch<CrowdStrikeIdResponse>(
      url,
      accessToken,
    );

    const ids = response.resources ?? [];
    allIds.push(...ids);

    const pagination = response.meta?.pagination;
    if (pagination && offset + ids.length < pagination.total) {
      offset += limit;
    } else {
      hasMore = false;
    }
  }

  return allIds;
}

/**
 * Resolve entity details by IDs in batches (CrowdStrike limits to ~100 IDs per request).
 */
async function resolveEntities<T>(
  baseUrl: string,
  path: string,
  ids: string[],
  accessToken: string,
  batchSize: number = 100,
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const params = batch.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
    const url = `${baseUrl}${path}?${params}`;
    const response = await crowdstrikeFetch<CrowdStrikeResourceResponse<T>>(
      url,
      accessToken,
    );
    results.push(...(response.resources ?? []));
  }

  return results;
}

// -- Console Users --

export async function listUserIds(
  accessToken: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<string[]> {
  return paginateIds(baseUrl, "/users/queries/users/v1", accessToken);
}

export async function getUserDetails(
  ids: string[],
  accessToken: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<CrowdStrikeUser[]> {
  if (ids.length === 0) return [];
  return resolveEntities<CrowdStrikeUser>(
    baseUrl,
    "/users/entities/users/v1",
    ids,
    accessToken,
  );
}

// -- Devices/Hosts --

export async function listDeviceIds(
  accessToken: string,
  baseUrl: string = DEFAULT_BASE_URL,
  filter?: string,
): Promise<string[]> {
  const path = filter
    ? `/devices/queries/devices-scroll/v1?filter=${encodeURIComponent(filter)}`
    : "/devices/queries/devices-scroll/v1";
  return paginateIds(baseUrl, path, accessToken, 5000);
}

export async function getDeviceDetails(
  ids: string[],
  accessToken: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<CrowdStrikeDevice[]> {
  if (ids.length === 0) return [];
  return resolveEntities<CrowdStrikeDevice>(
    baseUrl,
    "/devices/entities/devices/v2",
    ids,
    accessToken,
  );
}

// -- Host Groups --

export async function listHostGroupIds(
  accessToken: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<string[]> {
  return paginateIds(baseUrl, "/devices/queries/host-groups/v1", accessToken);
}

export async function getHostGroupDetails(
  ids: string[],
  accessToken: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<CrowdStrikeHostGroup[]> {
  if (ids.length === 0) return [];
  return resolveEntities<CrowdStrikeHostGroup>(
    baseUrl,
    "/devices/entities/host-groups/v1",
    ids,
    accessToken,
  );
}

export async function listHostGroupMembers(
  groupId: string,
  accessToken: string,
  baseUrl: string = DEFAULT_BASE_URL,
): Promise<string[]> {
  const path = `/devices/queries/devices-scroll/v1?filter=groups:['${encodeURIComponent(groupId)}']`;
  return paginateIds(baseUrl, path, accessToken, 5000);
}
