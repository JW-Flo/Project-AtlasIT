/**
 * AtlasIT GitHub Proxy Worker
 * 
 * This file is a hand-maintained JavaScript implementation for Cloudflare Workers.
 * If a TypeScript version exists in src/index.ts, both are maintained separately for compatibility.
 * Deploy using: wrangler deploy
 */

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const traceId = crypto.randomUUID();
		const baseHeaders = { 
			'x-trace-id': traceId,
			'x-service': 'atlasit-github-proxy'
		};

		const jsonResponse = (data, status = 200) => {
			return new Response(JSON.stringify(data), {
				status,
				headers: {
					'content-type': 'application/json',
					...baseHeaders
				}
			});
		};

		// Health check endpoint
		if (url.pathname === '/health') {
			return jsonResponse({ 
				status: 'ok', 
				service: 'atlasit-github-proxy',
				traceId 
			});
		}

		// Verify proxy token
		const token = request.headers.get('X-Proxy-Token');
		if (!token || token !== env.PROXY_SECRET) {
			console.log(`[${traceId}] Unauthorized request - invalid or missing token`);
			return jsonResponse({ 
				error: 'Forbidden', 
				message: 'Invalid or missing X-Proxy-Token',
				traceId 
			}, 403);
		}

		// Extract target path from query parameter
		const targetPath = url.searchParams.get('path');
		if (!targetPath) {
			return jsonResponse({ 
				error: 'Bad Request', 
				message: 'Missing required query parameter: path',
				traceId 
			}, 400);
		}

		// Validate path is within allowed repository
		if (!targetPath.startsWith('/repos/HarderWorkingCo/Project-AtlasIT')) {
			console.log(`[${traceId}] Blocked request to unauthorized path: ${targetPath}`);
			return jsonResponse({ 
				error: 'Forbidden', 
				message: 'Path not allowed. Only /repos/HarderWorkingCo/Project-AtlasIT/* endpoints are permitted',
				traceId 
			}, 403);
		}

		// Determine target host (api.github.com or raw.githubusercontent.com)
		const isRawContent = url.searchParams.get('raw') === 'true';
		const targetHost = isRawContent ? 'raw.githubusercontent.com' : 'api.github.com';
		
		// Build upstream URL
		let upstreamUrl;
		if (isRawContent) {
			// For raw content: https://raw.githubusercontent.com/HarderWorkingCo/Project-AtlasIT/main/path/to/file
			const branch = url.searchParams.get('ref') || 'main';
			const filePath = url.searchParams.get('file_path') || '';
			upstreamUrl = `https://${targetHost}/HarderWorkingCo/Project-AtlasIT/${branch}/${filePath}`;
		} else {
			upstreamUrl = `https://${targetHost}${targetPath}`;
		}

		console.log(`[${traceId}] Proxying ${request.method} request to: ${upstreamUrl}`);

		// Prepare upstream request headers
		const upstreamHeaders = new Headers({
			'Authorization': `Bearer ${env.GH_PAT}`,
			'User-Agent': 'AtlasIT-GitHub-Proxy/1.0',
			'Accept': 'application/vnd.github.v3+json',
		});

		// Forward Content-Type if present
		const contentType = request.headers.get('Content-Type');
		if (contentType) {
			upstreamHeaders.set('Content-Type', contentType);
		}

		// Prepare request body for non-GET requests
		let body;
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			try {
				body = await request.text();
			} catch (error) {
				console.error(`[${traceId}] Error reading request body:`, error);
				return jsonResponse({ 
					error: 'Bad Request', 
					message: 'Invalid request body',
					traceId 
				}, 400);
			}
		}

		// Forward request to GitHub
		try {
			const upstreamResponse = await fetch(upstreamUrl, {
				method: request.method,
				headers: upstreamHeaders,
				body,
			});

			console.log(`[${traceId}] GitHub responded with status: ${upstreamResponse.status}`);

			// Create response with trace ID
			const responseHeaders = new Headers(upstreamResponse.headers);
			responseHeaders.set('x-trace-id', traceId);
			responseHeaders.set('x-service', 'atlasit-github-proxy');

			return new Response(upstreamResponse.body, {
				status: upstreamResponse.status,
				statusText: upstreamResponse.statusText,
				headers: responseHeaders,
			});
		} catch (error) {
			console.error(`[${traceId}] Error forwarding request to GitHub:`, error);
			return jsonResponse({ 
				error: 'Bad Gateway', 
				message: 'Failed to communicate with GitHub API',
				traceId 
			}, 502);
		}
	},
};
