import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { evaluateSubject, generateEvidence } from "../src/policy/engine";

const SUBJECT_PASS = {
  id: "user-1",
  mfaEnabled: true,
  passwordLength: 16,
  devicePosture: "healthy",
};

const SUBJECT_FAIL = {
  id: "user-2",
  mfaEnabled: false,
  passwordLength: 8,
  devicePosture: "risky",
};

describe("policy engine", () => {
  it("generates evidence records for a subject", () => {
    const evidence = evaluateSubject(SUBJECT_PASS);
    expect(evidence).toHaveLength(3);
    expect(evidence.every((record) => record.hash && record.hash.length === 64)).toBe(true);
    expect(evidence.map((record) => record.result.status)).toEqual([
      "pass",
      "pass",
      "pass",
    ]);
  });

  it("flags control failures with reasons", () => {
    const evidence = evaluateSubject(SUBJECT_FAIL);
    const statuses = evidence.reduce((acc, record) => {
      acc[record.control] = record.result;
      return acc;
    }, {} as Record<string, (typeof evidence)[number]["result"]>);

    expect(statuses.MFA_REQUIRED.status).toBe("fail");
    expect(statuses.PASSWORD_MIN_LENGTH.reason).toContain("below minimum");
    expect(statuses.DEVICE_POSTURE_HEALTHY.reason).toContain("not healthy");
  });

  it("writes evidence to disk", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "atlasit-evidence-"));
    const output = path.join(tmp, "evidence.json");

    try {
      const evidence = await generateEvidence([SUBJECT_PASS, SUBJECT_FAIL], output);
      expect(evidence).toHaveLength(6);

      const stored = JSON.parse(await readFile(output, "utf8"));
      expect(stored).toHaveLength(6);
      expect(stored[0].hash).toBeDefined();
      expect(stored[1].result.status).toBeDefined();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
