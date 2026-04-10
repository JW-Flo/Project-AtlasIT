/**
 * AuthError — Hono-compatible HTTP error for the auth middleware stack.
 *
 * Usage:
 *   throw new AuthError(401, "Missing authorization header");
 *   throw new AuthError(403, "Insufficient role: requires admin");
 */

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}
