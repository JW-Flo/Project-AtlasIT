/**
 * AuthError — thrown by auth middleware with an HTTP status code.
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
