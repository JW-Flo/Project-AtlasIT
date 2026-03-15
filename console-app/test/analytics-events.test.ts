import { describe, expect, it, vi } from "vitest";
import { POST } from "../src/routes/api/analytics/events/+server";

describe("analytics events api", () => {
  it("rejects unapproved event names", async () => {
    const res = await POST({
      request: new Request("http://localhost/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "unknown_event", inviteId: "tenant-1" }),
      }),
      platform: {},
    } as any);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_event",
    });
  });

  it("stores allowed events when DB is available", async () => {
    const run = vi.fn().mockResolvedValue({});
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));

    const res = await POST({
      request: new Request("http://localhost/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: "invite_link_copied",
          inviteId: "tenant-1",
        }),
      }),
      platform: { env: { ATLAS_SHARED_DB: { prepare } } },
    } as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, stored: true });
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
