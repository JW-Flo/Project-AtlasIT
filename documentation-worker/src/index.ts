/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
// Side-effect import for generated worker types
import '../worker-configuration.d.ts';

function json(data: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	if (!headers.has('content-type')) headers.set('content-type', 'application/json');
	return new Response(JSON.stringify(data), { ...init, headers });
}

export default {
	// Explicit Env type reference above; using loosely typed env to avoid missing symbol in unit TS context.
	async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const requestId = crypto.randomUUID();
		const baseHeaders: HeadersInit = { 'x-request-id': requestId };

		if (url.pathname === '/health') {
			return json({ status: 'ok', service: 'documentation-worker', requestId }, { status: 200, headers: baseHeaders });
		}

		if (request.method === 'GET' && (url.pathname === '/docs' || url.pathname === '/docs/index')) {
			return json({ ok: true, message: 'Documentation worker placeholder' }, { status: 200, headers: baseHeaders });
		}

		return json({ error: 'Not Found', path: url.pathname, requestId }, { status: 404, headers: baseHeaders });
	},
} satisfies ExportedHandler<Env>;
