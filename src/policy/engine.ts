import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type ControlId =
  | "MFA_REQUIRED"
  | "PASSWORD_MIN_LENGTH"
  | "DEVICE_POSTURE_HEALTHY";

export interface PolicySubject {
  /** Unique identifier for the subject under evaluation (user, device, etc.). */
  id: string;
  mfaEnabled?: boolean;
  passwordLength?: number;
  devicePosture?: string;
}

export type EvidenceResultStatus = "pass" | "fail";

export interface EvidenceResult {
  status: EvidenceResultStatus;
  reason?: string;
}

export interface EvidenceRecord {
  control: ControlId;
  subject: string;
  result: EvidenceResult;
  timestamp: string;
  hash: string;
}

interface ControlEvaluationContext {
  subject: PolicySubject;
  timestamp: string;
}

const PASSWORD_MIN_LENGTH = 12;

function createEvidenceHash(record: Omit<EvidenceRecord, "hash">): string {
  const digest = createHash("sha256")
    .update(JSON.stringify(record))
    .digest("hex");
  return digest;
}

function baseRecord(
  control: ControlId,
  ctx: ControlEvaluationContext,
  status: EvidenceResultStatus,
  reason?: string,
): EvidenceRecord {
  const partial: Omit<EvidenceRecord, "hash"> = {
    control,
    subject: ctx.subject.id,
    result: { status, reason },
    timestamp: ctx.timestamp,
  };

  return {
    ...partial,
    hash: createEvidenceHash(partial),
  };
}

function evaluateMfa(ctx: ControlEvaluationContext): EvidenceRecord {
  const enabled = ctx.subject.mfaEnabled === true;
  return baseRecord(
    "MFA_REQUIRED",
    ctx,
    enabled ? "pass" : "fail",
    enabled ? undefined : "Multi-factor authentication is not enabled",
  );
}

function evaluatePassword(ctx: ControlEvaluationContext): EvidenceRecord {
  const length = ctx.subject.passwordLength ?? 0;
  const passed = length >= PASSWORD_MIN_LENGTH;
  return baseRecord(
    "PASSWORD_MIN_LENGTH",
    ctx,
    passed ? "pass" : "fail",
    passed
      ? undefined
      : `Password length ${length} is below minimum of ${PASSWORD_MIN_LENGTH}`,
  );
}

function evaluateDevicePosture(ctx: ControlEvaluationContext): EvidenceRecord {
  const posture = (ctx.subject.devicePosture ?? "").toLowerCase();
  const passed = posture === "healthy";
  return baseRecord(
    "DEVICE_POSTURE_HEALTHY",
    ctx,
    passed ? "pass" : "fail",
    passed ? undefined : `Reported posture '${ctx.subject.devicePosture ?? "unknown"}' is not healthy`,
  );
}

/**
 * Evaluate the defined policy controls for a single subject.
 */
export function evaluateSubject(subject: PolicySubject, evaluationDate = new Date()): EvidenceRecord[] {
  if (!subject?.id) {
    throw new Error("Policy subject must include an id");
  }

  const ctx: ControlEvaluationContext = {
    subject,
    timestamp: evaluationDate.toISOString(),
  };

  return [evaluateMfa(ctx), evaluatePassword(ctx), evaluateDevicePosture(ctx)];
}

/**
 * Evaluate and persist evidence for a list of subjects.
 */
export async function generateEvidence(
  subjects: PolicySubject[],
  outputPath: string,
  evaluationDate = new Date(),
): Promise<EvidenceRecord[]> {
  const evidence = subjects.flatMap((subject) => evaluateSubject(subject, evaluationDate));
  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return evidence;
}
