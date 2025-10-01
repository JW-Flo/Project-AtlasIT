export interface RetryOptions {
  attempts?: number; // total attempts including first
  baseDelayMs?: number; // initial backoff
  maxDelayMs?: number;
  jitter?: boolean;
  onRetry?: (ctx: { attempt: number; error: any }) => void;
}

const DEFAULT: Required<RetryOptions> = {
  attempts: 4,
  baseDelayMs: 250,
  maxDelayMs: 4000,
  jitter: true,
  onRetry: () => {},
};

// Only for idempotent safe GETs. Rejects if method != GET.
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts?: RetryOptions,
): Promise<Response> {
  const cfg = { ...DEFAULT, ...(opts || {}) };
  const method = (init?.method || "GET").toUpperCase();
  if (method !== "GET") throw new Error("fetchWithRetry only supports GET");
  let attempt = 0;
  let lastErr: any;
  while (attempt < cfg.attempts) {
    try {
      const res = await fetch(input, init);
      if (!shouldRetryStatus(res.status)) return res;
      lastErr = new Error("Retryable status " + res.status);
    } catch (e) {
      lastErr = e;
    }
    attempt++;
    if (attempt >= cfg.attempts) break;
    cfg.onRetry({ attempt, error: lastErr });
    await delay(backoff(attempt, cfg));
  }
  throw lastErr;
}

function shouldRetryStatus(status: number): boolean {
  if (status >= 500) return true; // 5xx
  if (status === 429) return true; // rate limited
  return false;
}

function backoff(attempt: number, cfg: Required<RetryOptions>): number {
  const exp = Math.min(
    cfg.baseDelayMs * Math.pow(2, attempt - 1),
    cfg.maxDelayMs,
  );
  if (!cfg.jitter) return exp;
  const jitter = Math.random() * exp * 0.25; // 0-25% jitter
  return exp - jitter / 2;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
