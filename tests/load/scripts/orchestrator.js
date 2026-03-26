/**
 * k6 load test script for AtlasIT AI Orchestrator.
 *
 * Endpoints tested:
 *   GET  /health
 *   POST /api/v1/events         (publish event)
 *   GET  /api/v1/events         (list events)
 *   GET  /api/v1/events/:id     (get event detail)
 *   POST /api/v1/agents         (register agent)
 *   GET  /api/v1/agents         (list agents)
 *   GET  /api/v1/dead-letter    (DLQ check)
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { BASE_URL, headers, TENANT_ID } from "../config.js";

// Use a separate base URL for orchestrator if configured, otherwise same host
const ORCHESTRATOR_URL = __ENV.ORCHESTRATOR_URL || BASE_URL;

/**
 * Run a single iteration of all Orchestrator endpoint groups.
 */
export default function orchestratorTests() {
  const params = { headers: headers(), tags: { service: "orchestrator" } };

  // ------------------------------------------------------------------
  // Health
  // ------------------------------------------------------------------
  group("orchestrator | health", () => {
    const res = http.get(`${ORCHESTRATOR_URL}/health`, {
      ...params,
      tags: { ...params.tags, name: "orchestrator-health" },
    });
    check(res, {
      "health returns 200": (r) => r.status === 200,
      "health body has status": (r) => {
        const body = r.json();
        return body && body.status !== undefined;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Publish event
  // ------------------------------------------------------------------
  let publishedEventId = null;
  group("orchestrator | publish event", () => {
    const payload = JSON.stringify({
      tenantId: TENANT_ID,
      type: "k6.orchestrator.test",
      source: "k6-load-test",
      payload: { action: "test", iteration: __ITER },
      idempotencyKey: `k6-orch-${Date.now()}-${__VU}-${__ITER}`,
    });
    const res = http.post(`${ORCHESTRATOR_URL}/api/v1/events`, payload, {
      ...params,
      tags: { ...params.tags, name: "orchestrator-publish-event" },
    });
    check(res, {
      "publish event returns 201 or 200": (r) =>
        r.status === 201 || r.status === 200,
      "publish event has event id": (r) => {
        const body = r.json();
        if (body && body.data && body.data.id) {
          publishedEventId = body.data.id;
          return true;
        }
        return false;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // List events
  // ------------------------------------------------------------------
  group("orchestrator | list events", () => {
    const res = http.get(
      `${ORCHESTRATOR_URL}/api/v1/events?limit=10`,
      {
        ...params,
        tags: { ...params.tags, name: "orchestrator-list-events" },
      },
    );
    check(res, {
      "list events returns 200": (r) => r.status === 200,
      "list events has data array": (r) => {
        const body = r.json();
        return body && Array.isArray(body.data);
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Get event detail
  // ------------------------------------------------------------------
  group("orchestrator | get event", () => {
    const id = publishedEventId || "00000000-0000-0000-0000-000000000000";
    const res = http.get(`${ORCHESTRATOR_URL}/api/v1/events/${id}`, {
      ...params,
      tags: { ...params.tags, name: "orchestrator-get-event" },
    });
    check(res, {
      "get event returns 200 or 404": (r) =>
        r.status === 200 || r.status === 404,
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Register agent
  // ------------------------------------------------------------------
  let registeredAgentId = null;
  group("orchestrator | register agent", () => {
    const agentName = `k6-agent-${Date.now()}-${__VU}-${__ITER}`;
    const payload = JSON.stringify({
      name: agentName,
      description: "k6 load test agent",
      webhookUrl: "https://httpbin.org/post",
      capabilities: ["test"],
      eventTypes: ["k6.orchestrator.test"],
    });
    const res = http.post(`${ORCHESTRATOR_URL}/api/v1/agents`, payload, {
      ...params,
      tags: { ...params.tags, name: "orchestrator-register-agent" },
    });
    check(res, {
      "register agent returns 201": (r) => r.status === 201,
      "register agent has id": (r) => {
        const body = r.json();
        if (body && body.data && body.data.id) {
          registeredAgentId = body.data.id;
          return true;
        }
        return false;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // List agents
  // ------------------------------------------------------------------
  group("orchestrator | list agents", () => {
    const res = http.get(`${ORCHESTRATOR_URL}/api/v1/agents`, {
      ...params,
      tags: { ...params.tags, name: "orchestrator-list-agents" },
    });
    check(res, {
      "list agents returns 200": (r) => r.status === 200,
      "list agents has data": (r) => {
        const body = r.json();
        return body && body.data !== undefined;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Dead letter queue check
  // ------------------------------------------------------------------
  group("orchestrator | dead letter queue", () => {
    const res = http.get(
      `${ORCHESTRATOR_URL}/api/v1/dead-letter?limit=10`,
      {
        ...params,
        tags: { ...params.tags, name: "orchestrator-dlq-list" },
      },
    );
    check(res, {
      "DLQ list returns 200": (r) => r.status === 200,
      "DLQ has data": (r) => {
        const body = r.json();
        return body && body.data !== undefined;
      },
    });
  });

  sleep(0.5);

  // ------------------------------------------------------------------
  // Cleanup: delete registered agent
  // ------------------------------------------------------------------
  if (registeredAgentId) {
    group("orchestrator | cleanup agent", () => {
      const res = http.del(
        `${ORCHESTRATOR_URL}/api/v1/agents/${registeredAgentId}`,
        null,
        {
          ...params,
          tags: { ...params.tags, name: "orchestrator-delete-agent" },
        },
      );
      check(res, {
        "delete agent returns 200": (r) => r.status === 200,
      });
    });
  }

  sleep(1);
}
