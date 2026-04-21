/**
 * Error classification and actionable messaging utilities.
 * Provides consistent error handling across all API routes and user-facing components.
 */

export type ErrorType = "network" | "auth" | "permission" | "validation" | "server" | "unknown";

export interface ClassifiedError {
  type: ErrorType;
  message: string;
  actionable: string;
  retryable: boolean;
  httpStatus?: number;
}

/**
 * Classify an error based on its characteristics.
 * Returns a structured error object with type, actionable guidance, and retry policy.
 */
export function classifyError(error: unknown, context?: string): ClassifiedError {
  // Network errors (fetch failures, timeouts, DNS issues)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: "network",
      message: "Connection failed",
      actionable: "Check your network connection and try again.",
      retryable: true,
    };
  }

  // Response errors (HTTP status codes)
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;

    if (status === 401) {
      // Auto-redirect to login (F-09 fix)
      // Check if not already on login page to avoid redirect loop
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?return=${returnUrl}`;
      }

      return {
        type: "auth",
        message: "Redirecting to login",
        actionable: "Your session has expired. Redirecting to login...",
        retryable: false,
        httpStatus: 401,
      };
    }

    if (status === 403) {
      return {
        type: "permission",
        message: "Access denied",
        actionable: "You don't have permission to perform this action. Contact your administrator.",
        retryable: false,
        httpStatus: 403,
      };
    }

    if (status === 404) {
      return {
        type: "validation",
        message: "Resource not found",
        actionable: context
          ? `${context} was not found. It may have been deleted or moved.`
          : "The requested resource was not found.",
        retryable: false,
        httpStatus: 404,
      };
    }

    if (status === 422) {
      return {
        type: "validation",
        message: "Validation failed",
        actionable: "Please check your input and try again.",
        retryable: false,
        httpStatus: 422,
      };
    }

    if (status === 429) {
      return {
        type: "validation",
        message: "Rate limit exceeded",
        actionable: "Too many requests. Please wait a moment and try again.",
        retryable: true,
        httpStatus: 429,
      };
    }

    if (status >= 500) {
      // Distinguish retriable vs non-retriable 5xx errors
      const retriable = [502, 503, 504].includes(status);
      return {
        type: "server",
        message: retriable ? "Service temporarily unavailable" : "Server error",
        actionable: retriable
          ? "Our servers are temporarily unavailable. Please try again in a moment."
          : "Something went wrong on our end. Please contact support if this persists.",
        retryable: retriable,
        httpStatus: status,
      };
    }

    if (status >= 400) {
      return {
        type: "validation",
        message: "Request failed",
        actionable: "Invalid request. Please check your input.",
        retryable: false,
        httpStatus: status,
      };
    }
  }

  // Parse error messages for specific patterns
  const message = error instanceof Error ? error.message : String(error);

  if (message.toLowerCase().includes("timeout")) {
    return {
      type: "network",
      message: "Request timeout",
      actionable: "The request took too long. Please try again.",
      retryable: true,
    };
  }

  if (
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("not authenticated")
  ) {
    return {
      type: "auth",
      message: "Authentication required",
      actionable: "Your session has expired. Please sign in again.",
      retryable: false,
    };
  }

  if (
    message.toLowerCase().includes("forbidden") ||
    message.toLowerCase().includes("permission denied")
  ) {
    return {
      type: "permission",
      message: "Access denied",
      actionable: "You don't have permission to perform this action. Contact your administrator.",
      retryable: false,
    };
  }

  // Default unknown error
  return {
    type: "unknown",
    message: "An error occurred",
    actionable: context
      ? `Failed to ${context}. Please try again or contact support if the problem persists.`
      : "Something went wrong. Please try again or contact support if the problem persists.",
    retryable: true,
  };
}

/**
 * Get a user-friendly, actionable error message.
 */
export function getActionableMessage(type: ErrorType, context?: string): string {
  switch (type) {
    case "network":
      return "Connection lost. Check your network and try again.";
    case "auth":
      return "Session expired. Please sign in again.";
    case "permission":
      return "You don't have permission. Contact your administrator.";
    case "validation":
      return context
        ? `Invalid ${context}. Please check your input.`
        : "Invalid input. Please check your data.";
    case "server":
      return "Server error. Please try again in a moment.";
    case "unknown":
    default:
      return context
        ? `Failed to ${context}. Please try again.`
        : "Something went wrong. Please try again.";
  }
}

/**
 * Retry a function with exponential backoff.
 * Retries only on retryable errors (network, server, rate limit).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    context?: string;
  } = {},
): Promise<T> {
  const { maxAttempts = 3, initialDelayMs = 1000, maxDelayMs = 10000, context } = options;

  let lastError: ClassifiedError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const classified = classifyError(error, context);
      lastError = classified;

      // Don't retry non-retryable errors
      if (!classified.retryable) {
        throw classified;
      }

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        throw classified;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      const jitter = Math.random() * baseDelay * 0.1; // Add 0-10% jitter
      const delay = baseDelay + jitter;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached due to the throw in the loop, but TypeScript needs it
  throw lastError || new Error("Retry failed");
}

/**
 * Wrap a fetch call with error classification and optional retry logic.
 * Returns a standardized error response that can be used throughout the app.
 */
export async function safeFetch<T = unknown>(
  url: string,
  options: RequestInit & { retry?: boolean; context?: string } = {},
): Promise<{ ok: true; data: T } | { ok: false; error: ClassifiedError }> {
  const { retry = false, context, ...fetchOptions } = options;

  const fetchFn = async () => {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorWithStatus = new Error(`HTTP ${response.status}`) as Error & { status: number };
      errorWithStatus.status = response.status;
      throw errorWithStatus;
    }

    const data = await response.json();
    return data as T;
  };

  try {
    const data = retry ? await retryWithBackoff(fetchFn, { context }) : await fetchFn();
    return { ok: true, data };
  } catch (error) {
    const classified =
      error && typeof error === "object" && "type" in error
        ? (error as ClassifiedError)
        : classifyError(error, context);
    return { ok: false, error: classified };
  }
}

/**
 * Log a structured error to CloudWatch via the errors API endpoint.
 * This is fire-and-forget and will not throw if logging fails.
 */
export async function logError(
  error: ClassifiedError,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    // Fire-and-forget error logging
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: error.type,
        message: error.message,
        httpStatus: error.httpStatus,
        timestamp: new Date().toISOString(),
        // URL sanitized on server - only send full URL, backend strips query params
        url: window.location.href,
        metadata,
      }),
    }).catch(() => {
      // Silently fail - logging errors should not interrupt the user experience
    });
  } catch {
    // Ignore logging errors
  }
}
