import { describe, expect, it } from "vitest";

describe("route registry exposure", () => {
  it("lists registered API routes", async () => {
    await import(
      "../../../JW-Site/apps/jw-immersive/src/pages/api/enhanced-security-scan.ts"
    );
    const { GET } = await import(
      "../../../JW-Site/apps/jw-immersive/src/pages/api/_routes.ts"
    );

    const response = await GET({} as any);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(Array.isArray(payload)).toBe(true);
    const entry = payload.find(
      (item: any) => item.id === "enhanced-security-scan",
    );
    expect(entry).toBeTruthy();
    expect(entry.path).toBe("/api/enhanced-security-scan");
    expect(String(entry.method).toUpperCase()).toBe("POST");
  });
});
