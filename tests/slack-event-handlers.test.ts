import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSlackEvent } from "../console-app/src/lib/server/slack/event-handlers";

describe("handleSlackEvent", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }))));
  });

  describe("app_mention", () => {
    it("replies with help text when mentioned", async () => {
      const event = {
        type: "app_mention",
        user: "U123",
        text: "<@B001> hello",
        channel: "C789",
        ts: "1711100000.000",
      };

      const result = await handleSlackEvent(event, "bot-token", "T456");
      expect(result.handled).toBe(true);
      expect(result.eventType).toBe("app_mention");
      expect(fetch).toHaveBeenCalledWith(
        "https://slack.com/api/chat.postMessage",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("skips mention without bot token", async () => {
      const event = {
        type: "app_mention",
        user: "U123",
        text: "<@B001> hello",
        channel: "C789",
        ts: "1711100000.000",
      };

      const result = await handleSlackEvent(event, null, "T456");
      expect(result.handled).toBe(false);
    });
  });

  describe("message events", () => {
    it("logs channel messages without replying", async () => {
      const event = {
        type: "message",
        user: "U123",
        text: "just a regular message",
        channel: "C789",
        channel_type: "channel",
        ts: "1711100000.000",
      };

      const result = await handleSlackEvent(event, "bot-token", "T456");
      expect(result.handled).toBe(true);
      expect(result.eventType).toBe("message");
      expect(fetch).not.toHaveBeenCalled();
    });

    it("skips bot messages", async () => {
      const event = {
        type: "message",
        bot_id: "B999",
        text: "bot message",
        channel: "C789",
        ts: "1711100000.000",
      };

      const result = await handleSlackEvent(event, "bot-token", "T456");
      expect(result.handled).toBe(false);
    });

    it("skips message subtypes", async () => {
      const event = {
        type: "message",
        subtype: "channel_join",
        user: "U123",
        channel: "C789",
        ts: "1711100000.000",
      };

      const result = await handleSlackEvent(event, "bot-token", "T456");
      expect(result.handled).toBe(false);
    });
  });

  describe("reaction events", () => {
    it("logs reaction_added", async () => {
      const event = {
        type: "reaction_added",
        user: "U123",
        reaction: "thumbsup",
        item: { type: "message", channel: "C789", ts: "1711100000.000" },
      };

      const result = await handleSlackEvent(event, "bot-token", "T456");
      expect(result.handled).toBe(true);
      expect(result.eventType).toBe("reaction_added");
    });

    it("logs reaction_removed", async () => {
      const event = {
        type: "reaction_removed",
        user: "U123",
        reaction: "thumbsup",
        item: { type: "message", channel: "C789", ts: "1711100000.000" },
      };

      const result = await handleSlackEvent(event, "bot-token", "T456");
      expect(result.handled).toBe(true);
      expect(result.eventType).toBe("reaction_removed");
    });
  });

  describe("unknown events", () => {
    it("returns unhandled for unrecognized event types", async () => {
      const event = {
        type: "channel_rename",
        channel: { id: "C789", name: "new-name" },
      };

      const result = await handleSlackEvent(event, "bot-token", "T456");
      expect(result.handled).toBe(false);
    });
  });
});
