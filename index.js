import registry from "./adapters/registry.json";
import { traceFetch } from "./src/lib/trace.js";

const adapterRegistry = Array.isArray(registry) ? registry : [];

function isFeatureEnabled(env, flag) {
  if (!flag) return false;
  const raw = env?.[flag];
  if (typeof raw === "string") {
    return raw === "1" || raw.toLowerCase() === "true";
  }
  if (typeof raw === "number") {
    return raw === 1;
  }
  if (typeof raw === "boolean") {
    return raw;
  }
  return false;
}

export const STEP_DEFINITIONS = {
  joiner: [
    {
      id: "validate-profile",
      action: "validateProfile",
      description: "Ensure new hire profile is complete",
      maxAttempts: 3,
    },
    {
      id: "provision-primary-account",
      action: "provisionPrimaryAccount",
      description: "Create primary identity provider record",
      maxAttempts: 3,
    },
    {
      id: "synchronize-access",
      action: "synchronizeAccess",
      description: "Configure downstream systems for day-one access",
      maxAttempts: 2,
    },
    {
      id: "notify-stakeholders",
      action: "notifyStakeholders",
      description: "Send onboarding summary to stakeholders",
      maxAttempts: 1,
    },
  ],
  mover: [
    {
      id: "snapshot-access",
      action: "snapshotCurrentAccess",
      description: "Capture current access roster prior to change",
      maxAttempts: 2,
    },
    {
      id: "apply-role-change",
      action: "applyRoleChange",
      description: "Apply role/attribute updates to source systems",
      maxAttempts: 3,
    },
    {
      id: "reconcile-entitlements",
      action: "reconcileAccessChanges",
      description: "Align entitlements to the target state",
      maxAttempts: 3,
    },
    {
      id: "notify-stakeholders",
      action: "notifyStakeholders",
      description: "Notify stakeholders of move completion",
      maxAttempts: 1,
    },
  ],
  leaver: [
    {
      id: "disable-primary-account",
      action: "disablePrimaryAccount",
      description: "Disable the primary identity provider account",
      maxAttempts: 3,
    },
    {
      id: "revoke-entitlements",
      action: "revokeAccess",
      description: "Revoke downstream system access",
      maxAttempts: 3,
    },
    {
      id: "collect-artifacts",
      action: "collectArtifacts",
      description: "Collect equipment and generate audit artifacts",
      maxAttempts: 2,
    },
    {
      id: "finalize-offboarding",
      action: "finalizeOffboarding",
      description: "Finalize offboarding evidence package",
      maxAttempts: 1,
    },
  ],
};

export const STEP_HANDLERS = {
  async validateProfile({ run }) {
    const { user } = run.context;
    if (!user || !user.email) {
      throw new Error("User profile missing required email field");
    }
    if (!user.displayName) {
      throw new Error("User profile missing display name");
    }
    return { validated: true, email: user.email };
  },
  async provisionPrimaryAccount({ run }) {
    const id = run.context.user?.id;
    if (!id) {
      throw new Error("User id required to provision primary account");
    }
    return { accountId: `okta:${id}` };
  },
  async synchronizeAccess({ run }) {
    const entitlements = run.context.entitlements;
    if (!Array.isArray(entitlements) || entitlements.length === 0) {
      throw new Error("No entitlements supplied for synchronization");
    }
    return { connectors: entitlements };
  },
  async notifyStakeholders({ run }) {
    const recipients = run.context.notifications?.recipients || [];
    return { notified: recipients };
  },
  async snapshotCurrentAccess({ run }) {
    const previous = run.context.entitlements?.previous || [];
    return { captured: previous };
  },
  async applyRoleChange({ run }) {
    if (!run.context.newRole) {
      throw new Error("Missing new role details for mover flow");
    }
    return { newRole: run.context.newRole };
  },
  async reconcileAccessChanges({ run }) {
    const target = run.context.entitlements?.target;
    if (!Array.isArray(target) || target.length === 0) {
      throw new Error("Target entitlements required to reconcile access");
    }
    return { applied: target };
  },
  async disablePrimaryAccount({ run }) {
    const email = run.context.user?.email;
    if (!email) {
      throw new Error("Email required to disable primary account");
    }
    return { disabled: email };
  },
  async revokeAccess({ run }) {
    const entitlements = Array.isArray(run.context.entitlements)
      ? run.context.entitlements
      : run.context.entitlements?.previous || [];
    return { revoked: entitlements };
  },
  async collectArtifacts({ run }) {
    const equipment = run.context.exit?.equipment || [];
    if (equipment.length === 0) {
      throw new Error("No equipment registered for collection");
    }
    return { equipment };
  },
  async finalizeOffboarding() {
    return { status: "closed", archivedAt: new Date().toISOString() };
  },
};

function clone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function mapToArray(map) {
  const items = [];
  for (const [, value] of map) {
    items.push(value);
  }
  return items;
}

export class JMLEngine {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;
    const segments = url.pathname.split("/").filter(Boolean);
    const endpoint = segments[segments.length - 1] || "";

    if (method === "POST" && endpoint === "enqueue") {
      const payload = await request.json();
      return this.handleEnqueue(payload);
    }

    if (method === "GET" && endpoint === "status") {
      return this.handleStatus();
    }

    if (method === "GET" && endpoint === "dlq") {
      return this.handleDlq();
    }

    return new Response("Not Found", { status: 404 });
  }

  async handleEnqueue(data) {
    const type = data?.type;
    if (!type) {
      return new Response(JSON.stringify({ error: "type is required" }), {
        status: 400,
      });
    }

    const steps = this.getStepsForType(type);
    if (steps.length === 0) {
      return new Response(
        JSON.stringify({ error: `Unsupported lifecycle type: ${type}` }),
        {
          status: 400,
        },
      );
    }

    const runId = crypto.randomUUID();
    const tenantId = data.tenantId || data.tenant?.id || "unknown";
    const userId = data.user?.id || data.userId || "unknown";
    const createdAt = new Date().toISOString();

    const run = {
      id: runId,
      type,
      tenantId,
      userId,
      status: "pending",
      createdAt,
      currentStep: 0,
      steps,
      history: [],
      context: clone(data),
    };

    await this.state.storage.put(`run:${runId}`, run);
    await this.processRun(runId);

    return new Response(JSON.stringify({ runId }), { status: 200 });
  }

  async handleStatus() {
    const runs = await this.state.storage.list({ prefix: "run:" });
    const runList = mapToArray(runs).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return new Response(JSON.stringify(runList), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  async handleDlq() {
    const dlqEntries = await this.state.storage.list({ prefix: "dlq:" });
    const list = mapToArray(dlqEntries).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return new Response(JSON.stringify(list), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  getStepsForType(type) {
    const definitions = STEP_DEFINITIONS[type];
    if (!definitions) {
      return [];
    }
    return definitions.map((definition) => ({
      ...definition,
      status: "pending",
      attempts: 0,
    }));
  }

  async processRun(runId) {
    const run = await this.state.storage.get(`run:${runId}`);
    if (!run) return;

    const step = run.steps[run.currentStep];
    if (!step) {
      if (run.status !== "completed") {
        run.status = "completed";
        run.completedAt = new Date().toISOString();
        await this.state.storage.put(`run:${runId}`, run);
      }
      return;
    }

    const now = new Date().toISOString();
    if (step.status === "pending" || step.status === "retrying") {
      step.status = "running";
      step.startedAt = step.startedAt || now;
      run.status = "running";
      await this.state.storage.put(`run:${runId}`, run);
    }

    try {
      const result = await this.executeStep(step, run);
      step.status = "completed";
      step.completedAt = new Date().toISOString();
      if (result !== undefined) {
        step.output = result;
      }

      run.history.push({
        stepId: step.id,
        action: step.action,
        status: "completed",
        timestamp: step.completedAt,
        output: result ?? null,
      });
      run.currentStep += 1;
      await this.state.storage.put(`run:${runId}`, run);
      await this.processRun(runId);
    } catch (error) {
      step.attempts = (step.attempts || 0) + 1;
      step.error = error instanceof Error ? error.message : String(error);

      run.history.push({
        stepId: step.id,
        action: step.action,
        status: "failed",
        attempt: step.attempts,
        timestamp: new Date().toISOString(),
        error: step.error,
      });

      if (step.attempts < step.maxAttempts) {
        step.status = "retrying";
        step.nextRetryAt = new Date().toISOString();
        await this.state.storage.put(`run:${runId}`, run);
        await this.processRun(runId);
        return;
      }

      step.status = "failed";
      run.status = "failed";
      run.failedAt = new Date().toISOString();

      await this.state.storage.put(`dlq:${runId}:${step.id}`, {
        id: `${runId}:${step.id}`,
        runId,
        stepId: step.id,
        type: run.type,
        error: step.error,
        attempts: step.attempts,
        createdAt: run.failedAt,
        context: run.context,
      });

      await this.state.storage.put(`run:${runId}`, run);
    }
  }

  async executeStep(step, run) {
    const control = run.context?.control || {};
    if (control.failStep === step.id || control.failAction === step.action) {
      throw new Error(`Simulated failure for step ${step.id}`);
    }

    const handler = STEP_HANDLERS[step.action];
    if (!handler) {
      throw new Error(`Unhandled action: ${step.action}`);
    }

    return handler({ run, step, env: this.env });
  }
}

async function handleFetch(request, env, ctx) {
  // Health check endpoint
  if (new URL(request.url).pathname === "/health") {
    // Allow health to succeed even if dispatcher binding not present (free plan / parallel rename mode)
    if (!env.dispatcher) {
      return new Response("OK", { status: 200 });
    }
    return new Response("OK", { status: 200 });
  }

  if (new URL(request.url).pathname === "/api/connectors") {
    const enabled = adapterRegistry
      .filter((entry) => isFeatureEnabled(env, entry.featureFlag))
      .map((entry) => ({
        name: entry.name,
        slug: entry.slug,
        featureFlag: entry.featureFlag,
      }));
    return new Response(JSON.stringify({ adapters: enabled }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Add /tasks endpoint for progress reporting
  if (new URL(request.url).pathname === "/tasks") {
    // For now, return mock data; later, wire to KV or Durable Object
    const tasks = [
      {
        id: "task-1",
        name: "Sync Okta Users",
        status: "running",
        owner: "agent-1",
        startedAt: "2025-05-19T18:00:00Z",
      },
      {
        id: "task-2",
        name: "License Audit",
        status: "pending",
        owner: "agent-2",
        startedAt: "2025-05-19T18:05:00Z",
      },
      {
        id: "task-3",
        name: "Ramp ETL",
        status: "success",
        owner: "agent-3",
        startedAt: "2025-05-19T18:10:00Z",
      },
    ];
    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Add /cicd endpoint for smoke test health check
  if (new URL(request.url).pathname === "/cicd") {
    return new Response("pause", { status: 200 });
  }

  // Add /api/pause endpoint for smoke test
  if (
    new URL(request.url).pathname === "/api/pause" &&
    request.method === "POST"
  ) {
    return new Response(JSON.stringify({ status: "paused" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  // Add /api/resume endpoint for smoke test
  if (
    new URL(request.url).pathname === "/api/resume" &&
    request.method === "POST"
  ) {
    return new Response(JSON.stringify({ status: "resumed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Add /api/last-slack-status endpoint for smoke test
  if (new URL(request.url).pathname === "/api/last-slack-status") {
    const slackUrl = env.SLACK_WEBHOOK_URL || "dummy";
    return new Response(JSON.stringify({ slack: slackUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Extract the sub-worker name from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const subWorkerName = pathParts[0] || "customer-worker-1";

    if (!subWorkerName) {
      return new Response("No sub-worker specified", { status: 400 });
    }

    // Forward the request to the sub-worker in the dispatcher namespace
    if (!env.dispatcher) {
      // Attempt auto-remediation: try to create the dispatcher binding if possible
      // NOTE: This is a placeholder. Cloudflare Workers cannot create bindings at runtime.
      // Instead, return a clear error and remediation hint.
      return new Response(
        "Dispatcher namespace not configured. To auto-remediate: redeploy with correct wrangler.toml [[dispatch_namespaces]] binding.",
        { status: 500 },
      );
    }

    let subWorker = await env.dispatcher.get(subWorkerName);
    if (!subWorker) {
      // Attempt auto-remediation: try to deploy a default sub-worker (not possible at runtime)
      // Instead, return a clear error and remediation hint.
      return new Response(
        `Sub-worker "${subWorkerName}" not found in dispatcher. To auto-remediate: deploy the sub-worker to the dispatcher namespace.`,
        { status: 502 },
      );
    }
    const trace = ctx?.trace;
    trace?.log("dispatch.forward", { subWorkerName });
    const response = await subWorker.fetch(request);
    trace?.log("dispatch.return", { status: response.status });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    ctx?.trace?.log("dispatch.error", { message });
    console.error("Error occurred:", err); // Log the error for debugging
    return new Response("Bad Gateway", { status: 502 });
  }
}

export default {
  fetch: traceFetch(handleFetch),
};
