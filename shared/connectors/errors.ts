export class ConnectorError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: "UNAUTHORIZED" | "NOT_FOUND" | "RATE_LIMITED" | "BAD_REQUEST" | "UPSTREAM_ERROR",
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}

export function mapHttpError(status: number, details?: unknown): ConnectorError {
  if (status === 401 || status === 403) {
    return new ConnectorError("Unauthorized connector request", status, "UNAUTHORIZED", details);
  }
  if (status === 404) {
    return new ConnectorError("Remote resource not found", status, "NOT_FOUND", details);
  }
  if (status === 429) {
    return new ConnectorError("Remote API rate limit exceeded", status, "RATE_LIMITED", details);
  }
  if (status >= 400 && status < 500) {
    return new ConnectorError("Invalid connector request", status, "BAD_REQUEST", details);
  }
  return new ConnectorError("Connector upstream failure", status, "UPSTREAM_ERROR", details);
}
