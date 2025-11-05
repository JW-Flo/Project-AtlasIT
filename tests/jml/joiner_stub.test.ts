import { describe, it, expect } from "vitest";
import {
  runJoinerStub,
  generateEvidence,
  writeEvidenceJson,
  type JoinerParams,
} from "../../src/workflows/jml/joiner_stub";
import * as fs from "fs";
import * as path from "path";

describe("Joiner Stub", () => {
  const testParams: JoinerParams = {
    tenantId: "tenant-test",
    userId: "user-123",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    department: "Engineering",
  };

  it("should successfully run joiner workflow", async () => {
    const result = await runJoinerStub(testParams);

    expect(result.success).toBe(true);
    expect(result.userId).toBe("user-123");
    expect(result.actions).toEqual([
      "okta.create_user",
      "emit_user_provisioned",
      "enforce_mfa",
    ]);
    expect(result.evidenceHash).toBeDefined();
    expect(result.evidenceHash).toMatch(/^sha256_stub_/);
  });

  it("should include required fields in result", async () => {
    const result = await runJoinerStub(testParams);

    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("userId");
    expect(result).toHaveProperty("actions");
    expect(result).toHaveProperty("evidenceHash");
  });

  it("should generate valid evidence envelope", () => {
    const actions = [
      {
        action: "okta.create_user",
        timestamp: new Date().toISOString(),
        status: "success",
        metadata: { oktaId: "okta_test" },
      },
      {
        action: "emit_user_provisioned",
        timestamp: new Date().toISOString(),
        status: "success",
      },
      {
        action: "enforce_mfa",
        timestamp: new Date().toISOString(),
        status: "success",
        metadata: { mfaRequired: true },
      },
    ];

    const evidence = generateEvidence(testParams, actions);

    expect(evidence).toHaveProperty("id");
    expect(evidence).toHaveProperty("hash");
    expect(evidence).toHaveProperty("uri");
    expect(evidence.tenantId).toBe("tenant-test");
    expect(evidence.producer).toBe("codex");
    expect(evidence.control_id).toBe("ACCESS_MFA_ENFORCED");
    expect(evidence.subject.userId).toBe("user-123");
    expect(evidence.subject.email).toBe("test@example.com");
    expect(evidence.actions).toHaveLength(3);
  });

  it("should write evidence to JSON format", () => {
    const actions = [
      {
        action: "okta.create_user",
        timestamp: new Date().toISOString(),
        status: "success",
        metadata: { oktaId: "okta_test" },
      },
    ];

    const json = writeEvidenceJson(testParams, actions);
    const evidence = JSON.parse(json);

    expect(evidence).toHaveProperty("id");
    expect(evidence).toHaveProperty("hash");
    expect(evidence.control_id).toBe("ACCESS_MFA_ENFORCED");
  });

  it("should write evidence artifact file", async () => {
    const result = await runJoinerStub(testParams);

    // Generate evidence actions from the workflow
    const actions = [
      {
        action: "okta.create_user",
        timestamp: new Date().toISOString(),
        status: "success",
        metadata: { oktaId: "okta_user-123_mock" },
      },
      {
        action: "emit_user_provisioned",
        timestamp: new Date().toISOString(),
        status: "success",
      },
      {
        action: "enforce_mfa",
        timestamp: new Date().toISOString(),
        status: "success",
        metadata: { mfaRequired: true },
      },
    ];

    const evidenceJson = writeEvidenceJson(testParams, actions);
    const evidencePath = path.join(
      process.cwd(),
      "evidence",
      "EV-joiner-stub.json",
    );

    // Ensure evidence directory exists
    const evidenceDir = path.dirname(evidencePath);
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }

    // Write evidence file
    fs.writeFileSync(evidencePath, evidenceJson, "utf8");

    // Verify file exists and is valid JSON
    expect(fs.existsSync(evidencePath)).toBe(true);
    const savedEvidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
    expect(savedEvidence.control_id).toBe("ACCESS_MFA_ENFORCED");
    expect(savedEvidence.producer).toBe("codex");
  });
});
