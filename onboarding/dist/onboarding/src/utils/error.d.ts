export declare function handleError(error: unknown): Response;
export declare class ValidationError extends Error {
  details?: string[] | undefined;
  constructor(message: string, details?: string[] | undefined);
}
export declare class ConfigurationError extends Error {
  config?: Record<string, any> | undefined;
  constructor(message: string, config?: Record<string, any> | undefined);
}
export declare class IntegrationError extends Error {
  integration?: string | undefined;
  constructor(message: string, integration?: string | undefined);
}
//# sourceMappingURL=error.d.ts.map
