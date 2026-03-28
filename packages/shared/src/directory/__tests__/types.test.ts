import { describe, it, expect } from "vitest";
import { computeRiskScore, detectRiskFactors, type RiskFactor } from "../types";

describe("computeRiskScore", () => {
  it("returns 0 for no risk factors", () => {
    expect(computeRiskScore([])).toBe(0);
  });

  it("returns weighted sum for single factor", () => {
    expect(computeRiskScore(["no_expiry"])).toBe(15);
    expect(computeRiskScore(["expired"])).toBe(25);
    expect(computeRiskScore(["no_owner"])).toBe(20);
  });

  it("sums multiple factors", () => {
    expect(computeRiskScore(["no_expiry", "no_owner"])).toBe(35);
  });

  it("caps at 100", () => {
    const allFactors: RiskFactor[] = [
      "no_expiry",
      "expired",
      "expiring_soon",
      "no_owner",
      "overprivileged",
      "stale",
      "never_rotated",
      "rotation_overdue",
    ];
    expect(computeRiskScore(allFactors)).toBe(100);
  });
});

describe("detectRiskFactors", () => {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const daysFromNow = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

  it("flags no_expiry when expiresAt is null", () => {
    const factors = detectRiskFactors({ expiresAt: null });
    expect(factors).toContain("no_expiry");
  });

  it("flags expired when past expiry", () => {
    const factors = detectRiskFactors({ expiresAt: daysAgo(1) });
    expect(factors).toContain("expired");
    expect(factors).not.toContain("no_expiry");
  });

  it("flags expiring_soon when within 30 days", () => {
    const factors = detectRiskFactors({ expiresAt: daysFromNow(15) });
    expect(factors).toContain("expiring_soon");
  });

  it("does not flag expiring_soon when > 30 days away", () => {
    const factors = detectRiskFactors({ expiresAt: daysFromNow(60) });
    expect(factors).not.toContain("expiring_soon");
    expect(factors).not.toContain("expired");
    expect(factors).not.toContain("no_expiry");
  });

  it("flags no_owner when ownerEmail is missing", () => {
    const factors = detectRiskFactors({ ownerEmail: null });
    expect(factors).toContain("no_owner");
  });

  it("does not flag no_owner when ownerEmail is set", () => {
    const factors = detectRiskFactors({ ownerEmail: "admin@corp.com" });
    expect(factors).not.toContain("no_owner");
  });

  it("flags overprivileged for admin scopes", () => {
    expect(detectRiskFactors({ scopes: ["admin"] })).toContain("overprivileged");
    expect(detectRiskFactors({ scopes: ["repo:full"] })).toContain("overprivileged");
    expect(detectRiskFactors({ scopes: ["*"] })).toContain("overprivileged");
    expect(detectRiskFactors({ scopes: ["write:all"] })).toContain("overprivileged");
  });

  it("does not flag overprivileged for narrow scopes", () => {
    expect(detectRiskFactors({ scopes: ["read:org", "repo:read"] })).not.toContain(
      "overprivileged",
    );
  });

  it("flags stale when not used in 90+ days", () => {
    const factors = detectRiskFactors({ lastUsedAt: daysAgo(100) });
    expect(factors).toContain("stale");
  });

  it("does not flag stale when recently used", () => {
    const factors = detectRiskFactors({ lastUsedAt: daysAgo(10) });
    expect(factors).not.toContain("stale");
  });

  it("flags never_rotated when created 30+ days ago with no rotation", () => {
    const factors = detectRiskFactors({ lastRotatedAt: null, createdAt: daysAgo(45) });
    expect(factors).toContain("never_rotated");
  });

  it("does not flag never_rotated when recently created", () => {
    const factors = detectRiskFactors({ lastRotatedAt: null, createdAt: daysAgo(5) });
    expect(factors).not.toContain("never_rotated");
  });

  it("flags rotation_overdue when last rotated 90+ days ago", () => {
    const factors = detectRiskFactors({ lastRotatedAt: daysAgo(100) });
    expect(factors).toContain("rotation_overdue");
  });

  it("does not flag rotation_overdue when recently rotated", () => {
    const factors = detectRiskFactors({ lastRotatedAt: daysAgo(30) });
    expect(factors).not.toContain("rotation_overdue");
  });

  it("detects multiple factors simultaneously", () => {
    const factors = detectRiskFactors({
      expiresAt: null,
      ownerEmail: null,
      scopes: ["admin:all"],
      lastUsedAt: daysAgo(120),
      lastRotatedAt: null,
      createdAt: daysAgo(200),
    });
    expect(factors).toContain("no_expiry");
    expect(factors).toContain("no_owner");
    expect(factors).toContain("overprivileged");
    expect(factors).toContain("stale");
    expect(factors).toContain("never_rotated");
    expect(computeRiskScore(factors)).toBeGreaterThan(50);
  });
});
