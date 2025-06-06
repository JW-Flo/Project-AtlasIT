export function handleError(error: unknown): Response {
  console.error('Error:', error);
  
  if (error instanceof Error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  return new Response(JSON.stringify({
    error: 'Unknown error occurred',
    timestamp: new Date().toISOString()
  }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json'
    }
  });
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
