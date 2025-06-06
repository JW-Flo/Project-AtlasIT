import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';

describe('Onboarding Service Integration Tests', () => {
  let mf: Miniflare;

  beforeAll(async () => {
    // Set up Miniflare environment
    mf = new Miniflare({
      modules: true,
      script: `
        export default {
          async fetch(request, env) {
            return await (await import('./index.js')).default.fetch(request, env);
          }
        }
      `,
      kvNamespaces: ['STATE'],
      d1Databases: ['DB'],
      bindings: {
        AI_API_KEY: 'test-key'
      }
    });

    // Initialize test database
    const db = await mf.getD1Database('DB');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterAll(async () => {
    // Clean up test database
    const db = await mf.getD1Database('DB');
    await db.exec('DROP TABLE IF EXISTS tenants');
  });

  it('should complete full onboarding flow', async () => {
    // Test data
    const tenantData = {
      tenantId: 'test-tenant-1',
      name: 'Test Company',
      industry: 'Technology',
      size: '50-100'
    };

    // Step 1: Start onboarding
    const startResponse = await mf.dispatchFetch('http://localhost:8787/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tenantData)
    });

    expect(startResponse.status).toBe(201);
    const startResult = await startResponse.json();
    expect(startResult.status).toBe('success');

    // Step 2: Verify tenant was created in database
    const db = await mf.getD1Database('DB');
    const { results } = await db.prepare(
      'SELECT * FROM tenants WHERE id = ?'
    ).bind(tenantData.tenantId).all();

    expect(results.length).toBe(1);
    expect(results[0].name).toBe(tenantData.name);
    expect(results[0].status).toBe('active');

    // Step 3: Verify state was stored in KV
    const kv = await mf.getKVNamespace('STATE');
    const storedState = await kv.get(`onboarding:${tenantData.tenantId}`);
    expect(storedState).not.toBeNull();

    const parsedState = JSON.parse(storedState!);
    expect(parsedState.status).toBe('in_progress');
    expect(parsedState.data).toEqual(tenantData);
  });

  it('should handle onboarding errors gracefully', async () => {
    // Test invalid data
    const invalidData = {
      // Missing required fields
      industry: 'Technology'
    };

    const response = await mf.dispatchFetch('http://localhost:8787/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidData)
    });

    expect(response.status).toBe(500);
    const result = await response.json();
    expect(result.status).toBe('error');
  });
});
