import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleAtlasCommand,
  handleEvidenceCommand,
} from "../console-app/src/lib/server/slack/command-handlers";

function makeMockDb(overrides: Record<string, any> = {}) {
  const allResults = overrides.allResults ?? [];
  const firstResult = overrides.firstResult ?? null;
  const first = vi.fn().mockResolvedValue(firstResult);
  const all = vi.fn().mockResolvedValue({ results: allResults });
  const bind = vi.fn().mockReturnValue({ all, first });
  const prepare = vi.fn().mockReturnValue({ bind });
  return { prepare, bind, all, first };
}

describe("handleAtlasCommand", () => {
  describe("/atlas help", () => {
    it("returns help text with available commands", async () => {
      const result = await handleAtlasCommand("help", "U123", null as any);
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("/atlas");
      expect(result.text).toContain("help");
      expect(result.text).toContain("status");
    });

    it("returns help when text is empty", async () => {
      const result = await handleAtlasCommand("", "U123", null as any);
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("help");
    });
  });

  describe("/atlas status", () => {
    it("returns compliance scores when tenant is found", async () => {
      const db = makeMockDb({
        allResults: [
          { framework: "SOC 2", score: 78, grade: "B" },
          { framework: "ISO 27001", score: 65, grade: "C" },
        ],
      });

      const result = await handleAtlasCommand("status", "U123", db as any, "tenant-abc");
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("SOC 2");
      expect(result.text).toContain("78");
    });

    it("returns fallback when no tenant mapped", async () => {
      const result = await handleAtlasCommand("status", "U123", null as any);
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("not linked");
    });

    it("returns message when no scores exist", async () => {
      const db = makeMockDb({ allResults: [] });
      const result = await handleAtlasCommand("status", "U123", db as any, "tenant-abc");
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("No compliance");
    });
  });

  describe("/atlas task", () => {
    it("acknowledges task request", async () => {
      const result = await handleAtlasCommand("task provision new user", "U123", null as any);
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("provision new user");
    });

    it("returns error when no task description provided", async () => {
      const result = await handleAtlasCommand("task", "U123", null as any);
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("description");
    });
  });

  describe("unknown subcommand", () => {
    it("returns help suggestion for unknown subcommands", async () => {
      const result = await handleAtlasCommand("foobar", "U123", null as any);
      expect(result.response_type).toBe("ephemeral");
      expect(result.text).toContain("Unknown");
      expect(result.text).toContain("help");
    });
  });
});

describe("handleEvidenceCommand", () => {
  it("returns evidence details when found", async () => {
    const db = makeMockDb({
      firstResult: {
        trace_id: "ev-123",
        framework: "SOC 2",
        control_ref: "CC6.1",
        status: "verified",
        collected_at: "2026-03-22T10:00:00Z",
        source: "okta-adapter",
      },
    });

    const result = await handleEvidenceCommand("ev-123", db as any, "tenant-abc");
    expect(result.response_type).toBe("ephemeral");
    expect(result.text).toContain("ev-123");
    expect(result.text).toContain("SOC 2");
    expect(result.text).toContain("CC6.1");
  });

  it("returns not found when evidence missing", async () => {
    const db = makeMockDb({ firstResult: null });
    const result = await handleEvidenceCommand("ev-missing", db as any, "tenant-abc");
    expect(result.response_type).toBe("ephemeral");
    expect(result.text).toContain("not found");
  });

  it("returns error when no trace_id provided", async () => {
    const result = await handleEvidenceCommand("", null as any);
    expect(result.response_type).toBe("ephemeral");
    expect(result.text).toContain("trace_id");
  });

  it("returns error when no tenant mapped", async () => {
    const result = await handleEvidenceCommand("ev-123", null as any);
    expect(result.response_type).toBe("ephemeral");
    expect(result.text).toContain("not linked");
  });
});
