import { describe, it, expect } from "vitest";
import {
  computeSlaBreachAt,
  DEFAULT_SLA_SECONDS,
  validateStatusTransition,
} from "../packages/shared/src/incidents/lifecycle";

describe("SLA breach detection logic", () => {
  it("breach time is in the past for overdue critical incidents", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    const breachAt = computeSlaBreachAt(twoHoursAgo, "critical", DEFAULT_SLA_SECONDS);
    // critical SLA = 1hr, created 2hr ago → breach was 1hr ago
    expect(new Date(breachAt).getTime()).toBeLessThan(Date.now());
  });

  it("breach time is in the future for fresh incidents", () => {
    const now = new Date().toISOString();
    const breachAt = computeSlaBreachAt(now, "low", DEFAULT_SLA_SECONDS);
    // low SLA = 72hr → breach is 72hr from now
    expect(new Date(breachAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("auto-resolve only applies to open automation incidents", () => {
    // These are the conditions checked by Duty 7:
    // auto_resolve = 1 AND status = 'open' AND source = 'automation'
    // The status transition from open -> resolved is valid:
    expect(validateStatusTransition("open", "resolved")).toBe(true);
    // But not from resolved -> open (cannot reopen auto-resolved):
    expect(validateStatusTransition("resolved", "open")).toBe(false);
  });

  it("SLA config allows custom thresholds", () => {
    const created = "2026-03-29T10:00:00Z";
    const customConfig = { critical: 900, high: 1800, medium: 3600, low: 7200 };
    const breachAt = computeSlaBreachAt(created, "critical", customConfig);
    // 900s = 15min
    expect(breachAt).toBe("2026-03-29T10:15:00.000Z");
  });
});
