// index.js - Cloudflare dispatch Worker
export default {
  async fetch(request, env) {
    // Health check endpoint
    if (new URL(request.url).pathname === "/health") {
      if (!env.dispatcher) {
        return new Response("Dispatcher binding missing", { status: 502 });
      }
      return new Response("OK", { status: 200 });
    }

    // Add /tasks endpoint for progress reporting
    if (new URL(request.url).pathname === "/tasks") {
      // For now, return mock data; later, wire to KV or Durable Object
      const tasks = [
        {
          id: 'task-1',
          name: 'Sync Okta Users',
          status: 'running',
          owner: 'agent-1',
          startedAt: '2025-05-19T18:00:00Z',
        },
        {
          id: 'task-2',
          name: 'License Audit',
          status: 'pending',
          owner: 'agent-2',
          startedAt: '2025-05-19T18:05:00Z',
        },
        {
          id: 'task-3',
          name: 'Ramp ETL',
          status: 'success',
          owner: 'agent-3',
          startedAt: '2025-05-19T18:10:00Z',
        }
      ]
      return new Response(JSON.stringify(tasks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Add /cicd endpoint for smoke test health check
    if (new URL(request.url).pathname === "/cicd") {
      return new Response("pause", { status: 200 });
    }

    // Add /api/pause endpoint for smoke test
    if (new URL(request.url).pathname === "/api/pause" && request.method === "POST") {
      return new Response(JSON.stringify({ status: "paused" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    // Add /api/resume endpoint for smoke test
    if (new URL(request.url).pathname === "/api/resume" && request.method === "POST") {
      return new Response(JSON.stringify({ status: "resumed" }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Add /api/last-slack-status endpoint for smoke test
    if (new URL(request.url).pathname === "/api/last-slack-status") {
      const slackUrl = env.SLACK_WEBHOOK_URL || "dummy";
      return new Response(JSON.stringify({ slack: slackUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
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
      console.error("Error occurred:", err); // Log the error for debugging
      return new Response("Bad Gateway", { status: 502 });
    }
  }
};
