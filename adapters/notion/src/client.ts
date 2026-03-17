import type { NotionUser, NotionDatabase } from "./types.js";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  // Notion uses rate limiting headers
  const remaining = 3; // Notion: ~3 requests/second
  const retryAfter = parseInt(headers.get("Retry-After") ?? "0", 10);
  return { remaining, resetAt: Date.now() + retryAfter * 1000 };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 0) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function notionFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ data: T; nextCursor: string | null }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Notion-Version": "2022-06-28",
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
    throw new Error(`Notion API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  const data = (await response.json()) as T & { next_cursor?: string };

  const nextCursor: string | null =
    (data as { next_cursor?: string }).next_cursor ?? null;

  return { data, nextCursor };
}

async function paginateAll<T>(
  url: string,
  accessToken: string,
  limit: number = 100,
): Promise<T[]> {
  const results: T[] = [];
  let cursor: string | null = null;

  while (true) {
    const body: Record<string, unknown> = { page_size: limit };
    if (cursor) {
      body.start_cursor = cursor;
    }

    const response: {
      data: { results: T[]; next_cursor?: string | null };
      nextCursor: string | null;
    } = await notionFetch<{
      results: T[];
      next_cursor?: string | null;
    }>(url, accessToken, "POST", body);

    if (response.data.results) {
      results.push(...response.data.results);
    }

    cursor = response.nextCursor || response.data.next_cursor || null;
    if (!cursor) break;
  }

  return results;
}

// -- Users --

export async function listUsers(accessToken: string): Promise<NotionUser[]> {
  const results: NotionUser[] = [];
  let cursor: string | null = null;

  while (true) {
    let url = "https://api.notion.com/v1/users?page_size=100";
    if (cursor) {
      url += `&start_cursor=${encodeURIComponent(cursor)}`;
    }

    const response = await notionFetch<{
      results: NotionUser[];
      next_cursor?: string | null;
    }>(url, accessToken, "GET");

    if (response.data.results) {
      results.push(...response.data.results);
    }

    cursor = response.data.next_cursor ?? null;
    if (!cursor) break;
  }

  return results;
}

// -- Databases (as a proxy for groups/workspaces) --

export async function listDatabases(
  accessToken: string,
): Promise<NotionDatabase[]> {
  const url = "https://api.notion.com/v1/search";
  const body = { filter: { value: "database", property: "object" } };

  const results: NotionDatabase[] = [];
  let cursor: string | null = null;

  while (true) {
    const requestBody = { ...body, page_size: 100 };
    if (cursor) {
      Object.assign(requestBody, { start_cursor: cursor });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(`Notion API error (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      results: NotionDatabase[];
      next_cursor: string | null;
    };

    results.push(...data.results);

    cursor = data.next_cursor;
    if (!cursor) break;
  }

  return results;
}
