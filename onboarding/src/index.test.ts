import { describe, it, expect } from 'vitest';

describe('Onboarding Worker', () => {
  it('should respond with health status', async () => {
    const request = new Request('https://example.com/health');
    const env = {
      STATE: {
        put: async () => {},
      },
      DB: {
        prepare: () => ({
          bind: () => ({
            run: async () => {},
          }),
        }),
      },
      AI_API_KEY: 'test-key',
    };
    const ctx = {} as ExecutionContext;

    const response = await (await import('./index')).default.fetch(request, env, ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('onboarding');
  });

  it('should initiate onboarding on POST /api/onboarding', async () => {
    const body = {
      tenantId: 'tenant123',
      name: 'Test Tenant',
    };
    const request = new Request('https://example.com/api/onboarding', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const statePutMock = vi.fn(async () => {});
    const dbRunMock = vi.fn(async () => {});

    const env = {
      STATE: {
        put: statePutMock,
      },
      DB: {
        prepare: () => ({
          bind: () => ({
            run: dbRunMock,
          }),
        }),
      },
      AI_API_KEY: 'test-key',
    };
    const ctx = {} as ExecutionContext;

    const response = await (await import('./index')).default.fetch(request, env, ctx);
    const responseBody = await response.json();

    expect(response.status).toBe(201);
    expect(responseBody.status).toBe('success');
    expect(statePutMock).toHaveBeenCalled();
    expect(dbRunMock).toHaveBeenCalled();
  });
});
