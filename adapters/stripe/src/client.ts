import type { StripePerson, StripeAccount, StripeList } from "./types.js";

const BASE_URL = "https://api.stripe.com/v1";

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  // Stripe uses RateLimit-Remaining / RateLimit-Reset (draft IETF spec)
  const remaining = parseInt(headers.get("RateLimit-Remaining") ?? "100", 10);
  const resetAt = parseInt(headers.get("RateLimit-Reset") ?? "0", 10) * 1000;
  return { remaining, resetAt };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

function encodeFormData(data: Record<string, string>): string {
  return Object.entries(data)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}

async function stripeFetch<T>(
  url: string,
  secretKey: string,
  options?: {
    method?: string;
    body?: Record<string, string>;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    Accept: "application/json",
  };

  const init: RequestInit = {
    method: options?.method ?? "GET",
    headers,
  };

  if (options?.body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = encodeFormData(options.body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`Stripe API error (${response.status}): ${body}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  return (await response.json()) as T;
}

async function paginateAll<T extends { id: string }>(
  url: string,
  secretKey: string,
  limit = 100,
): Promise<T[]> {
  const results: T[] = [];
  let startingAfter: string | undefined;

  const separator = url.includes("?") ? "&" : "?";

  while (true) {
    const paginatedUrl = startingAfter
      ? `${url}${separator}limit=${limit}&starting_after=${encodeURIComponent(startingAfter)}`
      : `${url}${separator}limit=${limit}`;

    const response = await stripeFetch<StripeList<T>>(paginatedUrl, secretKey);
    results.push(...response.data);

    if (!response.has_more || response.data.length === 0) {
      break;
    }

    startingAfter = response.data[response.data.length - 1].id;
  }

  return results;
}

// --- Person (connected account) endpoints ---

export async function listPersons(
  secretKey: string,
  accountId: string,
): Promise<StripePerson[]> {
  const url = `${BASE_URL}/accounts/${encodeURIComponent(accountId)}/persons`;
  return paginateAll<StripePerson>(url, secretKey);
}

export async function getPerson(
  secretKey: string,
  accountId: string,
  personId: string,
): Promise<StripePerson> {
  const url = `${BASE_URL}/accounts/${encodeURIComponent(accountId)}/persons/${encodeURIComponent(personId)}`;
  return stripeFetch<StripePerson>(url, secretKey);
}

export async function createPerson(
  secretKey: string,
  accountId: string,
  data: Record<string, string>,
): Promise<StripePerson> {
  const url = `${BASE_URL}/accounts/${encodeURIComponent(accountId)}/persons`;
  return stripeFetch<StripePerson>(url, secretKey, {
    method: "POST",
    body: data,
  });
}

export async function updatePerson(
  secretKey: string,
  accountId: string,
  personId: string,
  data: Record<string, string>,
): Promise<StripePerson> {
  const url = `${BASE_URL}/accounts/${encodeURIComponent(accountId)}/persons/${encodeURIComponent(personId)}`;
  return stripeFetch<StripePerson>(url, secretKey, {
    method: "POST",
    body: data,
  });
}

export async function deletePerson(
  secretKey: string,
  accountId: string,
  personId: string,
): Promise<{ id: string; deleted: boolean }> {
  const url = `${BASE_URL}/accounts/${encodeURIComponent(accountId)}/persons/${encodeURIComponent(personId)}`;
  return stripeFetch<{ id: string; deleted: boolean }>(url, secretKey, {
    method: "DELETE",
  });
}

// --- Account endpoints ---

export async function listAccounts(
  secretKey: string,
): Promise<StripeAccount[]> {
  const url = `${BASE_URL}/accounts`;
  return paginateAll<StripeAccount>(url, secretKey);
}

export async function getAccount(
  secretKey: string,
  accountId: string,
): Promise<StripeAccount> {
  const url = `${BASE_URL}/accounts/${encodeURIComponent(accountId)}`;
  return stripeFetch<StripeAccount>(url, secretKey);
}
