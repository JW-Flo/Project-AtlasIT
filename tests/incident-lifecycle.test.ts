import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// SLA computation helper (will live in shared)
// ---------------------------------------------------------------------------

import {
  computeSlaBreachAt,
  DEFAULT_SLA_SECONDS,
  validateStatusTransition,
} from "../packages/shared/src/incidents/lifecycle";

// ---------------------------------------------------------------------------
// Tests: SLA computation
// ---------------------------------------------------------------------------

describe("computeSlaBreachAt", () => {
  it("returns correct breach time for critical severity", () => {
    const created = "2026-03-29T10:00:00Z";
    const result = computeSlaBreachAt(created, "critical", DEFAULT_SLA_SECONDS);
    // critical = 3600s = 1 hour
    expect(result).toBe("2026-03-29T11:00:00.000Z");
  });

  it("returns correct breach time for high severity", () => {
    const created = "2026-03-29T10:00:00Z";
    const result = computeSlaBreachAt(created, "high", DEFAULT_SLA_SECONDS);
    // high = 14400s = 4 hours
    expect(result).toBe("2026-03-29T14:00:00.000Z");
  });

  it("returns correct breach time for medium severity", () => {
    const created = "2026-03-29T10:00:00Z";
    const result = computeSlaBreachAt(created, "medium", DEFAULT_SLA_SECONDS);
    // medium = 86400s = 24 hours
    expect(result).toBe("2026-03-30T10:00:00.000Z");
  });

  it("returns correct breach time for low severity", () => {
    const created = "2026-03-29T10:00:00Z";
    const result = computeSlaBreachAt(created, "low", DEFAULT_SLA_SECONDS);
    // low = 259200s = 72 hours
    expect(result).toBe("2026-04-01T10:00:00.000Z");
  });

  it("uses custom SLA config when provided", () => {
    const created = "2026-03-29T10:00:00Z";
    const custom = { critical: 1800, high: 7200, medium: 43200, low: 172800 };
    const result = computeSlaBreachAt(created, "critical", custom);
    // 1800s = 30 min
    expect(result).toBe("2026-03-29T10:30:00.000Z");
  });

  it("falls back to medium SLA for unknown severity", () => {
    const created = "2026-03-29T10:00:00Z";
    const result = computeSlaBreachAt(created, "unknown" as any, DEFAULT_SLA_SECONDS);
    expect(result).toBe("2026-03-30T10:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// Tests: Status transitions
// ---------------------------------------------------------------------------

describe("validateStatusTransition", () => {
  it("allows open -> investigating", () => {
    expect(validateStatusTransition("open", "investigating")).toBe(true);
  });

  it("allows open -> resolved", () => {
    expect(validateStatusTransition("open", "resolved")).toBe(true);
  });

  it("allows investigating -> resolved", () => {
    expect(validateStatusTransition("investigating", "resolved")).toBe(true);
  });

  it("rejects resolved -> open (no backwards)", () => {
    expect(validateStatusTransition("resolved", "open")).toBe(false);
  });

  it("rejects resolved -> investigating (no backwards)", () => {
    expect(validateStatusTransition("resolved", "investigating")).toBe(false);
  });

  it("rejects investigating -> open (no backwards)", () => {
    expect(validateStatusTransition("investigating", "open")).toBe(false);
  });

  it("rejects same-state transitions", () => {
    expect(validateStatusTransition("open", "open")).toBe(false);
    expect(validateStatusTransition("resolved", "resolved")).toBe(false);
  });

  it("rejects invalid status values", () => {
    expect(validateStatusTransition("open", "closed" as any)).toBe(false);
    expect(validateStatusTransition("unknown" as any, "open")).toBe(false);
  });
});
