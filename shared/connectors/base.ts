import { ConnectorError, mapHttpError } from "./errors";
import type { ConnectorResult } from "./types";

const DEFAULT_MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface RequestOptions {
  action: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  maxAttempts?: number;
}

function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  return JSON.parse(JSON.stringify(body));
}

export async function requestWithRetry<T = unknown>(
  appId: string,
  options: RequestOptions,
): Promise<ConnectorResult<T>> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(options.endpoint, {
        method: options.method,
        headers: {
          "content-type": "application/json",
          ...(options.headers || {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });

      const text = await response.text();
      let parsed: unknown = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
      }

      if (!response.ok) {
        const error = mapHttpError(response.status, parsed || text);
        if (error.code === "RATE_LIMITED" && attempt < maxAttempts) {
          const retryAfter = Number(response.headers.get("retry-after") || "0");
          const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** (attempt - 1);
          await sleep(delay);
          continue;
        }
        throw error;
      }

      return {
        ok: true,
        status: response.status,
        message: "Request successful",
        data: parsed as T,
        evidence: {
          appId,
          action: options.action,
          endpoint: options.endpoint,
          request: {
            method: options.method,
            body: sanitizeBody(options.body),
          },
          response: parsed,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      lastError = error;
      if (error instanceof ConnectorError && error.code !== "RATE_LIMITED") {
        throw error;
      }
      if (attempt < maxAttempts) {
        await sleep(250 * 2 ** (attempt - 1));
      }
    }
  }

  if (lastError instanceof ConnectorError) {
    throw lastError;
  }

  throw new ConnectorError("Connector request failed after retries", 500, "UPSTREAM_ERROR", lastError);
}

export function requireField(credentials: Record<string, string>, key: string): string {
  const value = credentials[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ConnectorError(`Missing required credential field: ${key}`, 400, "BAD_REQUEST");
  }
  return value.trim();
}

export function requireIdentifier(value: string | undefined, label: string): string {
  const sanitized = (value || "").trim();
  if (!sanitized) {
    throw new ConnectorError(`Missing required parameter: ${label}`, 400, "BAD_REQUEST");
  }
  return sanitized;
}
