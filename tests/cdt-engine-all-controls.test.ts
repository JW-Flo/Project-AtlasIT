import { describe, it, expect } from "vitest";
import { ALL_CONTROL_IDS, runControlEval } from "../shared/services/cdt/src/evaluation/engine";

describe("CDT engine — ALL_CONTROL_IDS", () => {
  it("exports 60 control IDs", () => {
    expect(ALL_CONTROL_IDS).toHaveLength(60);
  });

  it("has no duplicates", () => {
    const unique = new Set(ALL_CONTROL_IDS);
    expect(unique.size).toBe(ALL_CONTROL_IDS.length);
  });

  it("covers SOC2, ISO27001, HIPAA, NIST CSF, and GDPR frameworks", () => {
    const frameworks = new Set(
      ALL_CONTROL_IDS.map((id) => {
        if (id.startsWith("SOC2-")) return "SOC2";
        if (id.startsWith("ISO-27001-")) return "ISO27001";
        if (id.startsWith("HIPAA-")) return "HIPAA";
        if (id.startsWith("NIST-CSF-")) return "NIST_CSF";
        if (id.startsWith("GDPR-")) return "GDPR";
        return "unknown";
      }),
    );
    expect(frameworks).toEqual(
      new Set(["SOC2", "ISO27001", "HIPAA", "NIST_CSF", "GDPR"]),
    );
  });

  it("every ID maps to a real rule (not 'unknown')", () => {
    const dummyEvent = {
      tenant: "test-tenant",
      type: "test",
      source: "test",
      trace_id: "trace-1",
      payload: {},
    };

    for (const id of ALL_CONTROL_IDS) {
      const result = runControlEval(id, dummyEvent);
      expect(
        result.decision,
        `Control ${id} returned "unknown" — no rule defined`,
      ).not.toBe("unknown");
    }
  });

  it("unknown control ID returns unknown decision", () => {
    const dummyEvent = {
      tenant: "test-tenant",
      type: "test",
      source: "test",
      trace_id: "trace-1",
      payload: {},
    };

    const result = runControlEval("NONEXISTENT-CONTROL", dummyEvent);
    expect(result.decision).toBe("unknown");
  });
});

describe("CDT engine — SOC2 control counts", () => {
  it("has 26 SOC2 controls", () => {
    const soc2 = ALL_CONTROL_IDS.filter((id) => id.startsWith("SOC2-"));
    expect(soc2.length).toBe(26);
  });

  it("has 16 ISO 27001 controls", () => {
    const iso = ALL_CONTROL_IDS.filter((id) => id.startsWith("ISO-27001-"));
    expect(iso.length).toBe(16);
  });

  it("has 6 HIPAA controls", () => {
    const hipaa = ALL_CONTROL_IDS.filter((id) => id.startsWith("HIPAA-"));
    expect(hipaa.length).toBe(6);
  });

  it("has 5 NIST CSF controls", () => {
    const nist = ALL_CONTROL_IDS.filter((id) => id.startsWith("NIST-CSF-"));
    expect(nist.length).toBe(5);
  });

  it("has 7 GDPR controls", () => {
    const gdpr = ALL_CONTROL_IDS.filter((id) => id.startsWith("GDPR-"));
    // GDPR Article 5: Art.5(1)(a) through (f) + Art.5(2) = 7
    expect(gdpr.length).toBe(7);
  });
});
