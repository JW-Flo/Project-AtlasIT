import type { BambooHREmployee, BambooHRDirectory } from "./types.js";

const API_BASE = "https://api.bamboohr.com/api/gateway.php";

async function bamboohrFetch<T>(
  url: string,
  apiKey: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Basic ${btoa(`${apiKey}:x`)}`,
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
    throw new Error(`BambooHR API error (${response.status}): ${errorBody}`);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// -- Directory listing --

export async function listEmployees(
  subdomain: string,
  apiKey: string,
): Promise<BambooHREmployee[]> {
  const url = `${API_BASE}/${encodeURIComponent(subdomain)}/v1/employees/directory`;
  const data = await bamboohrFetch<BambooHRDirectory>(url, apiKey);
  return data.employees || [];
}

export async function getEmployee(
  subdomain: string,
  apiKey: string,
  employeeId: string,
): Promise<BambooHREmployee> {
  const url = `${API_BASE}/${encodeURIComponent(subdomain)}/v1/employees/${encodeURIComponent(employeeId)}`;
  return bamboohrFetch<BambooHREmployee>(url, apiKey);
}

// -- Webhooks --

export async function getWebhookDetails(
  subdomain: string,
  apiKey: string,
): Promise<{ webhookUrl?: string }> {
  const url = `${API_BASE}/${encodeURIComponent(subdomain)}/v1/webhooks`;
  try {
    const data = await bamboohrFetch<{ webhookUrl?: string }>(url, apiKey);
    return data;
  } catch {
    return {};
  }
}
