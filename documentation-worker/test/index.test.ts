import { describe, expect, it } from 'vitest';
import worker from '../src/index';

const noop = () => {};

async function runRequest(path: string) {
	const request = new Request(`https://example.com${path}`);
	const ctx = {
		waitUntil: noop,
		passThroughOnException: noop,
	} as ExecutionContext;
	const response = await worker.fetch(request, {} as Env, ctx);
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

	it('serves docs placeholder JSON', async () => {
		const response = await runRequest('/docs');
		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({ ok: true });
	});
});
