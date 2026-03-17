import type { XeroContact, XeroUser, XeroAPIResponse } from "./types.js";

const API_BASE = "https://api.xero.com/api.xro/2.0";

async function xeroFetch<T>(
  url: string,
  accessToken: string,
  tenantId: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
    "xero-tenant-id": tenantId,
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
    throw new Error(`Xero API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// -- Pagination helper --

async function paginateAll<T>(
  resourcePath: string,
  accessToken: string,
  tenantId: string,
  pageSize: number = 100,
): Promise<T[]> {
  const results: T[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${API_BASE}/${resourcePath}?page=${pageNum}&pagesize=${pageSize}`;
    const response = await xeroFetch<XeroAPIResponse<T>>(
      url,
      accessToken,
      tenantId,
    );

    let items: T[] = [];

    if (response.Contacts) {
      items = response.Contacts as T[];
    } else if (response.Users) {
      items = response.Users as T[];
    }

    results.push(...items);

    // Check if we got a full page (if we got fewer items than pageSize, we're done)
    hasMore = items.length === pageSize;
    pageNum++;
  }

  return results;
}

// -- Contacts (customers/organizations) --

export async function listContacts(
  accessToken: string,
  tenantId: string,
): Promise<XeroContact[]> {
  return paginateAll<XeroContact>("Contacts", accessToken, tenantId);
}

// -- Users --

export async function listUsers(
  accessToken: string,
  tenantId: string,
): Promise<XeroUser[]> {
  return paginateAll<XeroUser>("Users", accessToken, tenantId);
}

// -- Get connections (to verify tenant access) --

export async function getConnections(
  accessToken: string,
): Promise<Array<{ id: string; tenantName: string; tenantId: string }>> {
  const url = "https://api.xero.com/connections";
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Xero connections: ${response.status}`);
  }

  return (await response.json()) as Array<{
    id: string;
    tenantName: string;
    tenantId: string;
  }>;
}
