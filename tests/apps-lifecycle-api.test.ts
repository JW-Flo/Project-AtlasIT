import { describe, expect, it } from "vitest";
import worker from "../index.js";

const movementUrl = "https://atlasit.test/api/v1/apps/lifecycle/movement";
const workflowsUrl = "https://atlasit.test/api/v1/apps/lifecycle/workflows";

describe("apps lifecycle movement API", () => {
  it("returns lifecycle plans for requested movement with normalized email", async () => {
    const response = await worker.fetch(
      new Request(movementUrl, {
        method: "POST",
        body: JSON.stringify({
          type: "joiner",
          idpSource: "google_workspace",
          user: { email: "New.User@Example.com " },
          apps: ["okta", "slack"],
        }),
      }),
      {} as any,
    );

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.type).toBe("joiner");
    expect(body.scope).toBe("all");
    expect(body.idpSource).toBe("google_workspace");
    expect(body.user.email).toBe("new.user@example.com");
    expect(Array.isArray(body.applications)).toBe(true);
    expect(body.applications).toHaveLength(2);
    expect(body.applications[0].connector.slug).toContain("connector");
    expect(body.applications[0].connector.joinerWorkflowFile).toContain(
      "joiner.workflow.yaml",
    );
    expect(body.applications[0].steps.length).toBeGreaterThan(0);
    expect(body.applications[0].workflows.joiner.length).toBeGreaterThan(0);
    expect(body.applications[0].workflows.mover.length).toBeGreaterThan(0);
    expect(body.applications[0].workflows.leaver.length).toBeGreaterThan(0);
  });

  it("fans out to all marketplace apps by default", async () => {
    const response = await worker.fetch(
      new Request(movementUrl, {
        method: "POST",
        body: JSON.stringify({
          type: "mover",
          idpSource: "okta",
          user: { email: "person@example.com" },
        }),
      }),
      {} as any,
    );

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.scope).toBe("all");
    expect(body.applications.length).toBeGreaterThan(5);
  });

  it("rejects unknown explicit app targets", async () => {
    const response = await worker.fetch(
      new Request(movementUrl, {
        method: "POST",
        body: JSON.stringify({
          type: "joiner",
          user: { email: "person@example.com" },
          apps: ["okta", "not-real-app"],
        }),
      }),
      {} as any,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("unknown apps requested");
    expect(body.unknownApps).toContain("not-real-app");
  });

  it("rejects unsupported idp source", async () => {
    const response = await worker.fetch(
      new Request(movementUrl, {
        method: "POST",
        body: JSON.stringify({
          type: "joiner",
          idpSource: "ping",
          user: { email: "person@example.com" },
        }),
      }),
      {} as any,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("unsupported idpSource");
  });

  it("rejects invalid email", async () => {
    const response = await worker.fetch(
      new Request(movementUrl, {
        method: "POST",
        body: JSON.stringify({
          type: "joiner",
          user: { email: "bad-email" },
        }),
      }),
      {} as any,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("valid user.email required");
  });
});

describe("apps lifecycle workflows API", () => {
  it("returns full joiner/mover/leaver workflows for selected apps and idp", async () => {
    const response = await worker.fetch(
      new Request(workflowsUrl, {
        method: "POST",
        body: JSON.stringify({
          idpSource: "active_directory",
          apps: ["okta", "slack"],
        }),
      }),
      {} as any,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.idpSource).toBe("active_directory");
    expect(body.count).toBe(2);
    expect(body.applications[0].connector.slug).toContain("connector");
    expect(body.applications[0].connector.joinerWorkflowFile).toContain(
      "joiner.workflow.yaml",
    );
    expect(body.applications[0].joiner.length).toBeGreaterThan(0);
    expect(body.applications[0].mover.length).toBeGreaterThan(0);
    expect(body.applications[0].leaver.length).toBeGreaterThan(0);
  });
});
