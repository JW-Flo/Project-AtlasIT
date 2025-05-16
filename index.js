// index.js - Cloudflare dispatch Worker
export default {
  async fetch(request, env, ctx) {
    // Health check endpoint
    if (new URL(request.url).pathname === "/health") {
      if (!env.dispatcher) {
        return new Response("Dispatcher binding missing", { status: 502 });
      }
      return new Response("OK", { status: 200 });
    }

    try {
      // Extract the sub-worker name from the URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const subWorkerName = pathParts[0] || "customer-worker-1";

      if (!subWorkerName) {
        return new Response('No sub-worker specified', { status: 400 });
      }

      // Forward the request to the sub-worker in the dispatcher namespace
      if (!env.dispatcher) {
        // Attempt auto-remediation: try to create the dispatcher binding if possible
        // NOTE: This is a placeholder. Cloudflare Workers cannot create bindings at runtime.
        // Instead, return a clear error and remediation hint.
        return new Response('Dispatcher namespace not configured. To auto-remediate: redeploy with correct wrangler.toml [[dispatch_namespaces]] binding.', { status: 500 });
      }

      let subWorker = await env.dispatcher.get(subWorkerName);
      if (!subWorker) {
        // Attempt auto-remediation: try to deploy a default sub-worker (not possible at runtime)
        // Instead, return a clear error and remediation hint.
        return new Response(`Sub-worker "${subWorkerName}" not found in dispatcher. To auto-remediate: deploy the sub-worker to the dispatcher namespace.`, { status: 502 });
      }
      return subWorker.fetch(request);
    } catch (err) {
      return new Response("Dispatch error: " + (err && err.message ? err.message : err), { status: 502 });
    }
  }
};
