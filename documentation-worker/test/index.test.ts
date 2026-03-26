import { describe, expect, it } from 'vitest';
import worker from '../src/index';

const noop = () => {};

type KvValueType = 'text' | 'json';

function createInMemoryKv(): KVNamespace {
	const store = new Map<string, string>();

	return {
		async get(key: string, type?: KvValueType): Promise<any> {
			const value = store.get(key);
			if (value === undefined) {
				return null;
			}
			if (type === 'json') {
				return JSON.parse(value);
			}
			return value;
		},
		async put(key: string, value: string): Promise<void> {
			store.set(key, value);
		},
	} as KVNamespace;
}

async function runRequest(path: string, init: RequestInit = {}, env: Partial<Env> = {}) {
	const request = new Request(`https://example.com${path}`, init);
	const ctx = {
		props: {},
		waitUntil: noop,
		passThroughOnException: noop,
	} as unknown as ExecutionContext;
	const response = await worker.fetch(request, env as Env, ctx);
	return response;
}

describe('documentation worker', () => {
	it('returns health status with request id header', async () => {
		const response = await runRequest('/health');
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
		const requestId = response.headers.get('x-request-id');
		expect(requestId).toBeTruthy();
		const payload = await response.json();
		expect(payload).toMatchObject({ status: 'ok', service: 'documentation-worker', requestId });
	});

	it('returns empty object when docs are not yet persisted', async () => {
		const response = await runRequest('/docs', {}, { DOCS: createInMemoryKv() });
		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toEqual({});
	});

	it('persists docs with PUT and reads same payload with GET', async () => {
		const kv = createInMemoryKv();
		const documentPayload = {
			title: 'Atlas Docs',
			version: 1,
			sections: [{ id: 'intro', body: 'Welcome' }],
		};

		const putResponse = await runRequest(
			'/docs',
			{
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(documentPayload),
			},
			{ DOCS: kv },
		);
		expect(putResponse.status).toBe(200);

		const getResponse = await runRequest('/docs', {}, { DOCS: kv });
		expect(getResponse.status).toBe(200);
		expect(await getResponse.json()).toEqual(documentPayload);
	});

	it('returns 400 for invalid docs payload', async () => {
		const response = await runRequest(
			'/docs',
			{
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(['not', 'an', 'object']),
			},
			{ DOCS: createInMemoryKv() },
		);

		expect(response.status).toBe(400);
		const payload = await response.json();
		expect(payload).toMatchObject({ error: 'Payload must be a JSON object' });
	});
});
