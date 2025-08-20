import { describe, it, expect } from "vitest";
import { handleRequest } from "./index.js";

const env = {
  API_ALLOWED_KEYS: "wk",
  AI_DETERMINISTIC: "1",
  RATE_LIMIT_MAX_REQUESTS: "10",
  RATE_LIMIT_WINDOW_SECONDS: "60",
};

async function post(path: string, body: any) {
  return handleRequest(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "wk" },
      body: JSON.stringify(body),
    }),
    env,
    { waitUntil() {} },
  );
}
async function get(path: string) {
  return handleRequest(
    new Request(`http://localhost${path}`, { headers: { "x-api-key": "wk" } }),
    env,
    { waitUntil() {} },
  );
}

describe("Workflow Engine (MVP)", () => {
  it("creates and retrieves workflow", async () => {
    const create = await post("/workflow", {
      name: "deploy-app",
      steps: ["plan", "apply"],
    });
    expect(create.status).toBe(201);
    const createBody: any = await create.json();
    expect(createBody.workflow.id).toBeDefined();
    expect(createBody.workflow.steps).toEqual(["plan", "apply"]);
    const id = createBody.workflow.id;

    const fetch = await get(`/workflow/${id}`);
    expect(fetch.status).toBe(200);
    const fetchBody: any = await fetch.json();
    expect(fetchBody.workflow.id).toBe(id);
    expect(fetchBody.workflow.name).toBe("deploy-app");
  });

  it("returns 404 for missing workflow", async () => {
    const res = await get("/workflow/does-not-exist");
    expect(res.status).toBe(404);
  });
});
