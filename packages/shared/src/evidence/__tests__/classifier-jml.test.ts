import { describe, it, expect } from "vitest";
import { classifyEvent } from "../classifier";

const TENANT = "tenant-abc";

describe("classifyEvent — JML directory event types", () => {
  // ── directory.user.joined ───────────────────────────────────────────────

  describe("directory.user.joined", () => {
    it("classifies as evidence with CC6.1 (logical access provisioning)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.joined",
        "jml-engine",
        "alice@example.com",
        "alice@example.com",
        { jmlAction: "joiner", workflowRunId: "wf-1" },
      );
      expect(result).not.toBeNull();
      const cc61 = result!.controls.find((c) => c.controlId === "CC6.1");
      expect(cc61).toBeDefined();
      expect(cc61!.framework).toBe("SOC2");
      expect(cc61!.impact).toBe("positive");
      expect(cc61!.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("classifies with A.9.2.1 (user registration)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.joined",
        "jml-engine",
        "alice@example.com",
        null,
        {},
      );
      const a921 = result!.controls.find((c) => c.controlId === "A.9.2.1");
      expect(a921).toBeDefined();
      expect(a921!.framework).toBe("ISO27001");
    });

    it("classifies with A.9.2.2 (access provisioning)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.joined",
        "connector:okta",
        "system",
        "bob@example.com",
        {},
      );
      const a922 = result!.controls.find((c) => c.controlId === "A.9.2.2");
      expect(a922).toBeDefined();
    });

    it("classifies with NIST PR.AC-1 (identity management)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.joined",
        "jml-engine",
        "system",
        null,
        {},
      );
      const nist = result!.controls.find((c) => c.controlId === "PR.AC-1");
      expect(nist).toBeDefined();
      expect(nist!.framework).toBe("NIST_CSF");
    });

    it("carries tenantId and eventType in the classified evidence", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.joined",
        "jml-engine",
        "system",
        "new@example.com",
        { jmlAction: "joiner" },
      );
      expect(result!.tenantId).toBe(TENANT);
      expect(result!.eventType).toBe("directory.user.joined");
      expect(result!.subject).toBe("new@example.com");
    });
  });

  // ── directory.user.moved ────────────────────────────────────────────────

  describe("directory.user.moved", () => {
    it("classifies with CC6.3 (access modification on transfer)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.moved",
        "jml-engine",
        "moved@example.com",
        "moved@example.com",
        { jmlAction: "mover", appsToRevoke: ["slack"], appsToProvision: ["jira"] },
      );
      expect(result).not.toBeNull();
      const cc63 = result!.controls.find((c) => c.controlId === "CC6.3");
      expect(cc63).toBeDefined();
      expect(cc63!.framework).toBe("SOC2");
      expect(cc63!.impact).toBe("positive");
    });

    it("classifies with A.9.2.5 (review of user access rights)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.moved",
        "jml-engine",
        "system",
        null,
        {},
      );
      const a925 = result!.controls.find((c) => c.controlId === "A.9.2.5");
      expect(a925).toBeDefined();
      expect(a925!.framework).toBe("ISO27001");
    });

    it("classifies with A.9.2.6 (adjustment of access rights)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.moved",
        "jml-engine",
        "system",
        null,
        {},
      );
      const a926 = result!.controls.find((c) => c.controlId === "A.9.2.6");
      expect(a926).toBeDefined();
    });

    it("classifies with NIST PR.AC-4 (least privilege)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.moved",
        "jml-engine",
        "system",
        null,
        {},
      );
      const nist = result!.controls.find((c) => c.controlId === "PR.AC-4");
      expect(nist).toBeDefined();
      expect(nist!.framework).toBe("NIST_CSF");
    });
  });

  // ── directory.user.left ─────────────────────────────────────────────────

  describe("directory.user.left", () => {
    it("classifies with CC6.3 (access removal on termination)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.left",
        "jml-engine",
        "leaver@example.com",
        "leaver@example.com",
        { jmlAction: "leaver" },
      );
      expect(result).not.toBeNull();
      const cc63 = result!.controls.find((c) => c.controlId === "CC6.3");
      expect(cc63).toBeDefined();
      expect(cc63!.framework).toBe("SOC2");
      expect(cc63!.impact).toBe("positive");
      expect(cc63!.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("classifies with A.9.2.6 (removal of access rights)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.left",
        "connector:okta",
        "system",
        "leaver@example.com",
        {},
      );
      const a926 = result!.controls.find((c) => c.controlId === "A.9.2.6");
      expect(a926).toBeDefined();
      expect(a926!.framework).toBe("ISO27001");
      expect(a926!.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("classifies with A.9.2.1 (user de-registration)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.left",
        "jml-engine",
        "system",
        null,
        {},
      );
      const a921 = result!.controls.find((c) => c.controlId === "A.9.2.1");
      expect(a921).toBeDefined();
    });

    it("classifies with GDPR Art.5(1)(f) (integrity and confidentiality)", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.left",
        "jml-engine",
        "system",
        null,
        {},
      );
      const gdpr = result!.controls.find((c) => c.controlId === "Art.5(1)(f)");
      expect(gdpr).toBeDefined();
      expect(gdpr!.framework).toBe("GDPR");
      expect(gdpr!.impact).toBe("positive");
    });

    it("has at least 5 controls tagged for a leaver event", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.left",
        "jml-engine",
        "system",
        null,
        {},
      );
      expect(result!.controls.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ── Cross-cutting: tenant isolation and null guards ─────────────────────

  describe("tenant isolation", () => {
    it("returns null when tenantId is empty", () => {
      const result = classifyEvent(
        "",
        "directory.user.joined",
        "jml-engine",
        "system",
        null,
        {},
      );
      expect(result).toBeNull();
    });

    it("returns null for unknown event type", () => {
      const result = classifyEvent(
        TENANT,
        "directory.user.unknown_action",
        "jml-engine",
        "system",
        null,
        {},
      );
      expect(result).toBeNull();
    });
  });

  // ── JML action → event type mapping completeness ────────────────────────

  describe("all four JML actions have classifier coverage", () => {
    const jmlEventTypes = [
      "directory.user.joined", // joiner + rehire
      "directory.user.moved",  // mover
      "directory.user.left",   // leaver
    ];

    for (const eventType of jmlEventTypes) {
      it(`${eventType} returns at least 3 controls`, () => {
        const result = classifyEvent(
          TENANT,
          eventType,
          "jml-engine",
          "system",
          null,
          {},
        );
        expect(result).not.toBeNull();
        expect(result!.controls.length).toBeGreaterThanOrEqual(3);
      });

      it(`all controls for ${eventType} have confidence >= 0.8`, () => {
        const result = classifyEvent(
          TENANT,
          eventType,
          "jml-engine",
          "system",
          null,
          {},
        );
        for (const ctrl of result!.controls) {
          expect(ctrl.confidence).toBeGreaterThanOrEqual(0.8);
        }
      });
    }
  });
});
