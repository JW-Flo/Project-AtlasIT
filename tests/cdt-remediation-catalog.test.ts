import { describe, it, expect } from "vitest";
import { remediationCatalog } from "../shared/services/cdt/src/remediation/catalog";
import { ALL_CONTROL_IDS } from "../shared/services/cdt/src/evaluation/engine";

describe("remediation catalog", () => {
  it("maps at least 30 controls to remediation actions", () => {
    const mapped = Object.keys(remediationCatalog);
    expect(mapped.length).toBeGreaterThanOrEqual(30);
  });

  it("every mapped control ID exists in ALL_CONTROL_IDS", () => {
    const controlSet = new Set(ALL_CONTROL_IDS);
    for (const cid of Object.keys(remediationCatalog)) {
      expect(controlSet.has(cid), `${cid} is not a valid control ID`).toBe(
        true,
      );
    }
  });

  it("every remediation action is a non-empty string", () => {
    for (const [cid, actions] of Object.entries(remediationCatalog)) {
      expect(actions.length, `${cid} has no actions`).toBeGreaterThan(0);
      for (const action of actions) {
        expect(typeof action).toBe("string");
        expect(action.length, `Empty action in ${cid}`).toBeGreaterThan(0);
      }
    }
  });

  it("covers all 5 frameworks", () => {
    const frameworks = new Set(
      Object.keys(remediationCatalog).map((id) => {
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

  it("uses a consistent set of action names", () => {
    const allActions = new Set<string>();
    for (const actions of Object.values(remediationCatalog)) {
      for (const action of actions) allActions.add(action);
    }
    // Should have a reasonable set of distinct actions (not thousands of unique names)
    expect(allActions.size).toBeGreaterThanOrEqual(10);
    expect(allActions.size).toBeLessThanOrEqual(30);
  });
});
