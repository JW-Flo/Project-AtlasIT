export function handleError(error: unknown): Response {
  console.error('Error:', error);

  // Standardized error mapping to onboarding error shapes
  const toJson = (payload: any, status = 500) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  if (error instanceof ValidationError) {
    return toJson({ error: { code: 'ONB-001', message: error.message, details: error.details } }, 400);
  }
  if (error instanceof ConfigurationError) {
    return toJson({ error: { code: 'ONB-003', message: error.message } }, 400);
  }
  if (error instanceof IntegrationError) {
    return toJson({ error: { code: 'ONB-010', message: error.message } }, 502);
  }

  if (error instanceof Error) {
    return toJson({ error: { code: 'ONB-999', message: error.message } }, 500);
  }
  return toJson({ error: { code: 'ONB-999', message: 'Unknown error occurred' } }, 500);
}

export class ValidationError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public config?: Record<string, any>) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class IntegrationError extends Error {
  constructor(message: string, public integration?: string) {
    super(message);
    this.name = 'IntegrationError';
  }
}
