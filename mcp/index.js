import { Hono } from "hono";

// In-memory LRU-ish cache (simple TTL)
const cache = new Map();
function cached(key, ttl, fetcher) {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.exp) return hit.val;
  return fetcher().then((val) => {
    cache.set(key, { val, exp: Date.now() + ttl });
    return val;
  });
}

const app = new Hono();

// Root endpoint
app.get("/", (c) => c.text("MCP Server Running"));

// Health check endpoint
app.get("/healthz", (c) => c.text("OK"));

// Configuration endpoint
app.post("/configure", async (c) => {
  const config = await c.req.json();
  // Store config in KV
  await c.env.MCP_STORE.put("config", JSON.stringify(config));
  return c.json({ status: "success" });
});

// Agent registration endpoint
app.post("/register", async (c) => {
  const agent = await c.req.json();
  // Store agent in KV (append to agents list)
  const agents = await cached("agents", 5000, async () => {
    const raw = await c.env.MCP_STORE.get("agents");
    return raw ? JSON.parse(raw) : [];
  });
  agents.push(agent);
  await c.env.MCP_STORE.put("agents", JSON.stringify(agents));
  return c.json({ status: "success" });
});

// Task submission endpoint
app.post("/task", async (c) => {
  const task = await c.req.json();
  // Store task in KV (append to tasks list)
  const tasks = await cached("tasks", 5000, async () => {
    const raw = await c.env.MCP_STORE.get("tasks");
    return raw ? JSON.parse(raw) : [];
  });
  tasks.push(task);
  await c.env.MCP_STORE.put("tasks", JSON.stringify(tasks));
  return c.json({ status: "success", task });
});

// Task result reporting endpoint
app.post("/task/result", async (c) => {
  const result = await c.req.json();
  // Store result in KV by task_id
  if (!result.task_id) {
    return c.json({ status: "error", message: "Missing task_id" }, 400);
  }
  await c.env.MCP_STORE.put(
    `task_result_${result.task_id}`,
    JSON.stringify(result),
  );
  return c.json({ status: "success", result });
});

// Task list endpoint
app.get("/task/list", async (c) => {
  const tasksRaw = await c.env.MCP_STORE.get("tasks");
  const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
  return c.json({ tasks });
});

// Plan proposal endpoint
app.post("/plan/propose", async (c) => {
  const plan = await c.req.json();
  // Store plan in KV with status 'pending'
  plan.status = "pending";
  plan.proposed_at = new Date().toISOString();
  await c.env.MCP_STORE.put("latest_plan", JSON.stringify(plan));
  return c.json({ status: "success", plan });
});

// Plan approval endpoint
app.post("/plan/approve", async (c) => {
  const { approved_by } = await c.req.json();
  const planRaw = await c.env.MCP_STORE.get("latest_plan");
  if (!planRaw) {
    return c.json({ status: "error", message: "No plan to approve" }, 404);
  }
  const plan = JSON.parse(planRaw);
  plan.status = "approved";
  plan.approved_by = approved_by || "admin";
  plan.approved_at = new Date().toISOString();
  await c.env.MCP_STORE.put("latest_plan", JSON.stringify(plan));
  return c.json({ status: "success", plan });
});

// Metrics endpoint
app.get("/metrics", async (c) => {
  const [agents, tasks, plan] = await Promise.all([
    cached("agents", 5000, () =>
      c.env.MCP_STORE.get("agents").then((r) => (r ? JSON.parse(r) : [])),
    ),
    cached("tasks", 5000, () =>
      c.env.MCP_STORE.get("tasks").then((r) => (r ? JSON.parse(r) : [])),
    ),
    cached("plan", 5000, () =>
      c.env.MCP_STORE.get("latest_plan").then((r) =>
        r ? JSON.parse(r) : null,
      ),
    ),
  ]);

  return c.json({
    timestamp: new Date().toISOString(),
    agents_count: agents.length,
    tasks_count: tasks.length,
    latest_plan_status: plan ? plan.status : "none",
    deadline_ms_remaining: parseInt(c.env.MCP_DEADLINE_MS || "-1", 10),
  });
});

// --- Control Endpoints -------------------------------------------------
app.get("/state", async (c) => {
  const paused = await c.env.MCP_STORE.get("paused");
  return c.json({ paused: paused === "true" });
});

app.post("/control/pause", async (c) => {
  await c.env.MCP_STORE.put("paused", "true");
  return c.json({ status: "paused" });
});

app.post("/control/resume", async (c) => {
  await c.env.MCP_STORE.put("paused", "false");
  return c.json({ status: "running" });
});

export default app;
