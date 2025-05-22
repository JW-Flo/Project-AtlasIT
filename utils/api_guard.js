export class RateLimiter {
  constructor({ maxRequests = 3, windowMs = 10 * 60 * 1000 } = {}) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    // { key: [timestamps] }
    this.calls = new Map();
  }

  /**
   * Returns true if another request is allowed for the given key.
   * Cleans up timestamps older than window.
   */
  canProceed(key) {
    const now = Date.now();
    if (!this.calls.has(key)) {
      this.calls.set(key, []);
    }
    const timestamps = this.calls.get(key).filter((ts) => now - ts < this.windowMs);
    this.calls.set(key, timestamps);
    return timestamps.length < this.maxRequests;
  }

  registerCall(key) {
    if (!this.calls.has(key)) {
      this.calls.set(key, []);
    }
    this.calls.get(key).push(Date.now());
  }
}

/**
 * Simple exponential backoff helper with jitter.
 * @param {Function} fn      Async function to execute.
 * @param {Object}   opts    Options.
 * @param {number}   opts.maxRetries  Maximum retries (default 3).
 * @param {number}   opts.baseDelayMs Initial delay in ms (default 1000).
 * @param {Function} opts.classifier  Optional function(err) -> { transient: bool }.
 */
export async function withBackoff(fn, {
  maxRetries = parseInt(process.env.MAX_RETRIES || '3', 10),
  baseDelayMs = 1000,
  classifier
} = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      const transient = classifier ? classifier(err) : true;
      if (!transient || attempt > maxRetries) {
        throw err;
      }
      // Calculate exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.4 * delay; // ±40%
      const wait = delay - jitter;
      await new Promise((res) => setTimeout(res, wait));
    }
  }
}

/**
 * Very naive classifier that treats HTTP 5xx, network errors, and rate-limit
 * responses as transient.
 */
export function defaultClassifier(err) {
  if (!err) return true;
  const msg = err.message || "";
  return /timed out|ECONNRESET|5\d{2}|rate limit/i.test(msg);
} 
