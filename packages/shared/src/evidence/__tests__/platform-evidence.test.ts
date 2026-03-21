import { describe, it, expect } from "vitest";
import {
  lookupAuditEvidence,
  AUDIT_EVIDENCE_REGISTRY,
  PLATFORM_STATE_PROBES,
} from "../platform-evidence";
import { parseControlRef } from "../adapter-collector";

describe("AUDIT_EVIDENCE_REGISTRY", () => {
  it("maps all known console audit actions", () => {
    const knownActions = [
      "access_request.created",
      "access_request.approved",
      "access_request.denied",
      "user.invited",
      "user.deleted",
      "user.roles_updated",
      "user.password_changed",
      "directory_group.created",
      "group_member.added",
      "group_member.removed",
      "incident.created",
      "app.connected",
      "app.disconnected",
      "tenant.settings_updated",
      "tenant.impersonate",
    ];
    for (const action of knownActions) {
      expect(lookupAuditEvidence(action)).toBeDefined();
    }
  });

  it("returns undefined for unmapped actions", () => {
    expect(lookupAuditEvidence("some.random.action")).toBeUndefined();
  });

  it("every mapping has valid control refs that parseControlRef can handle", () => {
    for (const mapping of AUDIT_EVIDENCE_REGISTRY) {
      for (const ref of mapping.controlRefs) {
        const { framework, controlId } = parseControlRef(ref);
        expect(framework).not.toBe(ref); // should be split, not echoed back
        expect(controlId.length).toBeGreaterThan(0);
      }
    }
  });

  it("every mapping has a non-empty description and category", () => {
    for (const mapping of AUDIT_EVIDENCE_REGISTRY) {
      expect(mapping.description.length).toBeGreaterThan(0);
      expect(mapping.category.length).toBeGreaterThan(0);
      expect(["positive", "detrimental", "neutral"]).toContain(mapping.impact);
    }
  });
});

describe("lookupAuditEvidence", () => {
  it("returns the correct mapping for access_request.approved", () => {
    const m = lookupAuditEvidence("access_request.approved");
    expect(m).toBeDefined();
    expect(m!.impact).toBe("positive");
    expect(m!.controlRefs).toContain("SOC2-CC6.2");
    expect(m!.category).toBe("access_grant");
  });

  it("returns detrimental for tenant.impersonate", () => {
    const m = lookupAuditEvidence("tenant.impersonate");
    expect(m).toBeDefined();
    expect(m!.impact).toBe("detrimental");
  });
});

describe("PLATFORM_STATE_PROBES", () => {
  it("has at least 10 probes covering major control areas", () => {
    expect(PLATFORM_STATE_PROBES.length).toBeGreaterThanOrEqual(10);
  });

  it("every probe has a valid SQL query", () => {
    for (const probe of PLATFORM_STATE_PROBES) {
      expect(probe.query).toContain("SELECT");
      expect(probe.query).toContain("result");
      expect(probe.id.length).toBeGreaterThan(0);
    }
  });

  it("every probe has valid control refs", () => {
    for (const probe of PLATFORM_STATE_PROBES) {
      expect(probe.controlRefs.length).toBeGreaterThan(0);
      for (const ref of probe.controlRefs) {
        const { framework } = parseControlRef(ref);
        expect(framework).not.toBe(ref);
      }
    }
  });

  it("covers all five frameworks", () => {
    const frameworks = new Set<string>();
    for (const probe of PLATFORM_STATE_PROBES) {
      for (const ref of probe.controlRefs) {
        const { framework } = parseControlRef(ref);
        frameworks.add(framework);
      }
    }
    expect(frameworks).toContain("SOC2");
    expect(frameworks).toContain("ISO27001");
    expect(frameworks).toContain("NIST_CSF");
    expect(frameworks).toContain("HIPAA");
    expect(frameworks).toContain("GDPR");
  });
});
