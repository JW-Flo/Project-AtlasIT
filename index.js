// index.js - Cloudflare dispatch Worker
export default {
  async fetch(request, env, ctx) {
    try {
      // Extract the sub-worker name from the URL path
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const subWorkerName = pathParts[0];

      if (!subWorkerName) {
        return new Response('No sub-worker specified', { status: 400 });
      }

      // Forward the request to the sub-worker in the dispatcher namespace
      // Assumes the dispatcher namespace is bound as DISPATCHER
      if (!env.DISPATCHER) {
        return new Response('Dispatcher namespace not configured', { status: 500 });
      }

      // Example: Forward to a sub-Worker named "customer-worker-1"
      const subWorker = await env.DISPATCHER.get(subWorkerName);
      if (!subWorker) {
        return new Response("Sub-worker not found", { status: 502 });
      }
      return subWorker.fetch(request);
    } catch (err) {
      return new Response("Dispatch error: " + (err && err.message ? err.message : err), { status: 502 });
    }
  }
};
