import { describe, it, expect, vi } from "vitest";
import { resolveSlackTenant } from "../console-app/src/lib/server/slack/resolve-tenant";

function makeMockDb(rows: any[] = []) {
  const all = vi.fn().mockResolvedValue({ results: rows });
  const bind = vi.fn().mockReturnValue({ all });
  const prepare = vi.fn().mockReturnValue({ bind });
  return { prepare, bind, all };
}

describe("resolveSlackTenant", () => {
  it("returns tenant_id when team_id matches raw_response", async () => {
    const db = makeMockDb([
      {
        tenant_id: "tenant-abc",
        raw_response: JSON.stringify({ team: { id: "T12345" } }),
      },
    ]);

    const result = await resolveSlackTenant(db as any, "T12345");
    expect(result).toBe("tenant-abc");
    expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining("app_oauth_tokens"));
  });

  it("returns null when no matching team_id found", async () => {
    const db = makeMockDb([
      {
        tenant_id: "tenant-abc",
        raw_response: JSON.stringify({ team: { id: "T99999" } }),
      },
    ]);

    const result = await resolveSlackTenant(db as any, "T12345");
    expect(result).toBeNull();
  });

  it("returns null when no slack installations exist", async () => {
    const db = makeMockDb([]);
    const result = await resolveSlackTenant(db as any, "T12345");
    expect(result).toBeNull();
  });

  it("handles malformed raw_response gracefully", async () => {
    const db = makeMockDb([
      { tenant_id: "tenant-abc", raw_response: "not-json" },
      {
        tenant_id: "tenant-def",
        raw_response: JSON.stringify({ team: { id: "T12345" } }),
      },
    ]);

    const result = await resolveSlackTenant(db as any, "T12345");
    expect(result).toBe("tenant-def");
  });

  it("handles raw_response with top-level team_id (bot tokens)", async () => {
    const db = makeMockDb([
      {
        tenant_id: "tenant-bot",
        raw_response: JSON.stringify({ team_id: "T12345", bot_user_id: "U1" }),
      },
    ]);

    const result = await resolveSlackTenant(db as any, "T12345");
    expect(result).toBe("tenant-bot");
  });

  it("returns null when db is null", async () => {
    const result = await resolveSlackTenant(null as any, "T12345");
    expect(result).toBeNull();
  });
});
