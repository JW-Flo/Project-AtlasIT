import { describe, it, expect, beforeAll } from "vitest";
import { initRegistry } from "../../src/runtime/registry/registry";
import "../../src/runtime/data/siteMetadataProvider";
import { registerFeature } from "../../src/runtime/features/registry";
import { fetchProvider, listProviders } from "../../src/runtime/data/providers";

describe("data providers", () => {
  beforeAll(() => {
    initRegistry();
    registerFeature({
      id: "dp-test",
      kind: "data",
      version: "1",
      async fetch(params?: Record<string, unknown>) {
        return { ok: true, echo: params?.q ?? null };
      },
    } as any);
  });

  it("lists provider", () => {
    const list = listProviders();
    expect(list.find((p) => p.id === "dp-test")).toBeTruthy();
  });

  it("fetches provider output", async () => {
    const result = await fetchProvider("dp-test", { params: { q: "value" } });
    expect(result).toHaveProperty("ok", true);
    expect(result).toHaveProperty("echo", "value");
  });
});
