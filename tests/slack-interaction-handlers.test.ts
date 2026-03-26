import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleBlockActions,
  handleViewSubmission,
} from "../console-app/src/lib/server/slack/interaction-handlers";

function makeMockDb() {
  const run = vi.fn().mockResolvedValue({});
  const bind = vi.fn().mockReturnValue({ run });
  const prepare = vi.fn().mockReturnValue({ bind });
  return { prepare, bind, run };
}

function makePayload(overrides: Record<string, any> = {}) {
  return {
    type: "block_actions",
    user: { id: "U123", username: "testuser" },
    team: { id: "T456" },
    channel: { id: "C789" },
    response_url: "https://hooks.slack.com/response/xyz",
    actions: [],
    ...overrides,
  };
}

describe("handleBlockActions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok")));
  });

  describe("approval_approve", () => {
    it("updates access request status to approved", async () => {
      const db = makeMockDb();
      const payload = makePayload({
        actions: [
          {
            action_id: "approval_approve",
            value: JSON.stringify({ requestId: "req-1" }),
            action_ts: "1711100000.000",
          },
        ],
      });

      const result = await handleBlockActions(payload, db as any, "tenant-abc");
      expect(result.processed).toBe(true);
      expect(result.actions).toContain("approval_approve");
      expect(db.prepare).toHaveBeenCalled();
    });

    it("sends acknowledgment to response_url", async () => {
      const db = makeMockDb();
      const payload = makePayload({
        actions: [
          {
            action_id: "approval_approve",
            value: JSON.stringify({ requestId: "req-1" }),
            action_ts: "1711100000.000",
          },
        ],
      });

      await handleBlockActions(payload, db as any, "tenant-abc");
      expect(fetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/response/xyz",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("approval_deny", () => {
    it("updates access request status to denied", async () => {
      const db = makeMockDb();
      const payload = makePayload({
        actions: [
          {
            action_id: "approval_deny",
            value: JSON.stringify({ requestId: "req-2" }),
            action_ts: "1711100000.000",
          },
        ],
      });

      const result = await handleBlockActions(payload, db as any, "tenant-abc");
      expect(result.processed).toBe(true);
      expect(result.actions).toContain("approval_deny");
    });
  });

  describe("callback URL", () => {
    it("calls callback URL when provided in action value", async () => {
      const db = makeMockDb();
      const payload = makePayload({
        actions: [
          {
            action_id: "approval_approve",
            value: JSON.stringify({
              requestId: "req-1",
              callbackUrl: "https://example.com/callback",
            }),
            action_ts: "1711100000.000",
          },
        ],
      });

      await handleBlockActions(payload, db as any, "tenant-abc");
      expect(fetch).toHaveBeenCalledWith(
        "https://example.com/callback",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("malformed action value", () => {
    it("skips actions with malformed JSON values", async () => {
      const db = makeMockDb();
      const payload = makePayload({
        actions: [
          {
            action_id: "approval_approve",
            value: "not-json",
            action_ts: "1711100000.000",
          },
        ],
      });

      const result = await handleBlockActions(payload, db as any, "tenant-abc");
      expect(result.processed).toBe(false);
      expect(result.actions).toHaveLength(0);
    });
  });

  describe("generic actions", () => {
    it("logs and acknowledges unknown action_ids", async () => {
      const db = makeMockDb();
      const payload = makePayload({
        actions: [
          {
            action_id: "view_incident",
            value: "inc-123",
            block_id: "block-1",
            action_ts: "1711100000.000",
          },
        ],
      });

      const result = await handleBlockActions(payload, db as any, "tenant-abc");
      expect(result.processed).toBe(true);
      expect(result.actions).toContain("view_incident");
    });
  });

  describe("no actions", () => {
    it("returns unprocessed when no actions present", async () => {
      const db = makeMockDb();
      const payload = makePayload({ actions: [] });

      const result = await handleBlockActions(payload, db as any, "tenant-abc");
      expect(result.processed).toBe(false);
    });
  });
});

describe("handleViewSubmission", () => {
  it("returns acknowledgment for known callback_ids", async () => {
    const payload = {
      type: "view_submission",
      user: { id: "U123" },
      view: {
        callback_id: "task_modal",
        state: {
          values: {
            task_block: {
              task_input: { value: "Run backup" },
            },
          },
        },
      },
    };

    const result = await handleViewSubmission(payload);
    expect(result.processed).toBe(true);
  });

  it("returns unprocessed for unknown callback_ids", async () => {
    const payload = {
      type: "view_submission",
      user: { id: "U123" },
      view: {
        callback_id: "unknown_modal",
        state: { values: {} },
      },
    };

    const result = await handleViewSubmission(payload);
    expect(result.processed).toBe(false);
  });
});
