import { test, expect } from "@playwright/test";

// Verifies that /api/config returns a complianceBase and snapshot can be fetched.

test("runtime config exposes complianceBase, fallbacks, resolves snapshot", async ({
  request,
}) => {
  let configRes;
  const attempts = 6;
  for (let i = 0; i < attempts; i++) {
    configRes = await request.get("/api/config");
    if (configRes.ok()) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  expect(configRes && configRes.ok()).toBeTruthy();
  const cfg = await configRes.json();
  expect(typeof cfg.complianceBase).toBe("string");
  if (cfg.fallbackBases) {
    expect(Array.isArray(cfg.fallbackBases)).toBeTruthy();
  }
  // resolvedBase may differ if primary unreachable
  const effectiveBase = (cfg.resolvedBase || cfg.complianceBase).replace(
    /\/$/,
    "",
  );
  let snapshotRes;
  for (let i = 0; i < attempts; i++) {
    snapshotRes = await request.get(`${effectiveBase}/snapshot`);
    if (snapshotRes.ok()) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  expect(snapshotRes && snapshotRes.ok()).toBeTruthy();
  const snap = await snapshotRes.json();
  expect(Array.isArray(snap.frameworkSummary)).toBeTruthy();
});
