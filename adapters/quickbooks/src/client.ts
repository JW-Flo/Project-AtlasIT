import type {
  QuickBooksCustomer,
  QuickBooksEmployee,
  QuickBooksQueryResponse,
} from "./types.js";

const API_BASE = "https://quickbooks.api.intuit.com/v2/company";

async function qboFetch<T>(
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

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`QuickBooks API error (${response.status}): ${errorBody}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// -- Query with pagination support --

async function paginateAll<T>(
  query: string,
  realmId: string,
  accessToken: string,
  pageSize: number = 100,
): Promise<T[]> {
  const results: T[] = [];
  let startPosition = 1;
  let hasMore = true;

  while (hasMore) {
    const paginatedQuery = `${query} MAXRESULTS ${pageSize} STARTPOSITION ${startPosition}`;
    const encodedQuery = encodeURIComponent(paginatedQuery);
    const url = `${API_BASE}/${encodeURIComponent(realmId)}/query?query=${encodedQuery}`;

    const response = await qboFetch<QuickBooksQueryResponse<T>>(
      url,
      accessToken,
    );

    if (response.QueryResponse) {
      // Extract entities from response
      const entities: T[] = [];
      if (response.QueryResponse.Customer) {
        entities.push(...(response.QueryResponse.Customer as T[]));
      }
      if (response.QueryResponse.Employee) {
        entities.push(...(response.QueryResponse.Employee as T[]));
      }

      results.push(...entities);

      // Check if there are more pages
      const maxResults = response.QueryResponse.maxResults ?? 0;
      hasMore = entities.length === maxResults;
      startPosition += maxResults;
    } else {
      hasMore = false;
    }
  }

  return results;
}

// -- Customers (treated as contacts/groups in directory context) --

export async function listCustomers(
  realmId: string,
  accessToken: string,
): Promise<QuickBooksCustomer[]> {
  const query = "SELECT * FROM Customer";
  return paginateAll<QuickBooksCustomer>(query, realmId, accessToken);
}

// -- Employees --

export async function listEmployees(
  realmId: string,
  accessToken: string,
): Promise<QuickBooksEmployee[]> {
  const query = "SELECT * FROM Employee";
  return paginateAll<QuickBooksEmployee>(query, realmId, accessToken);
}
