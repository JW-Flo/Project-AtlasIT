export function handleError(error) {
  console.error("Error:", error);
  if (error instanceof Error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
  return new Response(
    JSON.stringify({
      error: "Unknown error occurred",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
export class ValidationError extends Error {
  details;
  constructor(message, details) {
    super(message);
    this.details = details;
    this.name = "ValidationError";
  }
}
export class ConfigurationError extends Error {
  config;
  constructor(message, config) {
    super(message);
    this.config = config;
    this.name = "ConfigurationError";
  }
}
export class IntegrationError extends Error {
  integration;
  constructor(message, integration) {
    super(message);
    this.integration = integration;
    this.name = "IntegrationError";
  }
}
//# sourceMappingURL=error.js.map
