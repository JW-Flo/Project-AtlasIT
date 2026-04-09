import { describe, it, expect } from "vitest";

function mockEnv() {
  return {
    dispatcher: {
      get: () => ({ fetch: (r) => new Response("stub", { status: 200 }) }),
    },
    SLACK_WEBHOOK_URL: "https://hooks.slack.test/mock",
  };
}

describe("environment integration", () => {
  it("does not expose SLACK_WEBHOOK_URL from /api/last-slack-status", async () => {
    const mod = await import("../index.js");
    const req = new Request("https://example.com/api/last-slack-status");
    const res = await mod.default.fetch(req, mockEnv(), {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slackConfigured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("hooks.slack.test/mock");
  });
});
