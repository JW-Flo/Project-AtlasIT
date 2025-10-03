import type { PolicyTemplateRecord } from "./templates";
import {
  ensurePolicySchema,
  seedPolicyData,
  listPolicyTemplates,
  getPolicyTemplate,
  findGeneratedPolicyByContext,
  saveGeneratedPolicy,
  recordPolicyEvaluation,
  getCoverage,
  upsertControlEvidenceLink,
} from "./store";
import { hashCanonicalJson } from "../../../../src/lib/canonical-json";
import { generatePolicy } from "./generator";
import { evaluatePolicy } from "./evaluation";
import { linkEvidencePack } from "./coverage";

export async function ensurePolicyInfrastructure(db: D1Database) {
  await ensurePolicySchema(db);
  await seedPolicyData(db);
}

export async function listTemplates(
  db: D1Database,
): Promise<PolicyTemplateRecord[]> {
  await ensurePolicyInfrastructure(db);
  return listPolicyTemplates(db);
}

export interface GeneratePolicyOptions {
  db: D1Database;
  tenantId: string;
  templateKey: string;
  input?: Record<string, unknown>;
}

export interface GeneratePolicyResult {
  hash: string;
  content: string;
  contextHash: string;
  createdAt: string;
  sizeBytes: number;
  template: PolicyTemplateRecord;
  reused: boolean;
  inputCanonical: string;
}

export async function generatePolicyDocument(
  options: GeneratePolicyOptions,
): Promise<GeneratePolicyResult> {
  const template = await getPolicyTemplate(options.db, options.templateKey);
  if (!template) {
    throw new Error("policy.template_not_found");
  }

  const generated = await generatePolicy({
    template,
    tenantId: options.tenantId,
    input: options.input,
  });

  const existing = await findGeneratedPolicyByContext(
    options.db,
    options.tenantId,
    template.key,
    generated.contextHash,
  );

  if (existing) {
    return {
      hash: existing.hash,
      content: existing.content,
      contextHash: existing.contextHash,
      createdAt: existing.createdAt,
      sizeBytes: existing.sizeBytes,
      template,
      reused: true,
      inputCanonical: generated.contextCanonical,
    };
  }

  const record = {
    hash: generated.hash,
    tenantId: options.tenantId,
    templateKey: template.key,
    content: generated.content,
    contextHash: generated.contextHash,
    createdAt: generated.generatedAt,
    sizeBytes: generated.sizeBytes,
  };

  await saveGeneratedPolicy(options.db, record, generated.contextCanonical);

  return {
    hash: record.hash,
    content: record.content,
    contextHash: record.contextHash,
    createdAt: record.createdAt,
    sizeBytes: record.sizeBytes,
    template,
    reused: false,
    inputCanonical: generated.contextCanonical,
  };
}

export interface EvaluatePolicyOptions {
  db: D1Database;
  tenantId: string;
  policyKey: string;
  input: Record<string, unknown>;
}

export interface EvaluatePolicyResult {
  hash: string;
  result: Record<string, unknown>;
  canonical: string;
}

export async function evaluatePolicyInput(
  options: EvaluatePolicyOptions,
): Promise<EvaluatePolicyResult> {
  const evaluation = await evaluatePolicy({
    tenantId: options.tenantId,
    policyKey: options.policyKey,
    input: options.input,
  });

  const { hash: inputHash } = await hashCanonicalJson(options.input);
  await recordPolicyEvaluation(options.db, {
    tenantId: options.tenantId,
    policyKey: options.policyKey,
    inputHash,
    resultHash: evaluation.hash,
    resultCanonical: evaluation.canonical,
  });

  return {
    hash: evaluation.hash,
    result: evaluation.result,
    canonical: evaluation.canonical,
  };
}

export async function recordEvidenceControlLink(
  db: D1Database,
  pack: string,
  evidenceHash: string,
  tenantId: string,
) {
  await ensurePolicyInfrastructure(db);
  await linkEvidencePack(db, pack, evidenceHash, tenantId);
}

export async function coverageSummary(
  db: D1Database,
  framework: string,
  tenantId: string,
) {
  await ensurePolicyInfrastructure(db);
  return getCoverage(db, framework, tenantId);
}

export interface ManualControlEvidenceLinkResult {
  created: boolean;
  createdAt: string;
}

export async function manualControlEvidenceLink(
  db: D1Database,
  options: { tenantId: string; controlKey: string; evidenceHash: string },
): Promise<ManualControlEvidenceLinkResult> {
  await ensurePolicyInfrastructure(db);

  const control = await db
    .prepare(
      `SELECT control_key FROM internal_controls WHERE control_key = ? LIMIT 1`,
    )
    .bind(options.controlKey)
    .first<{ control_key: string }>();
  if (!control) {
    throw new Error("control.not_found");
  }

  const evidence = await db
    .prepare(`SELECT tenant_id FROM evidence_index WHERE hash = ? LIMIT 1`)
    .bind(options.evidenceHash)
    .first<{ tenant_id: string }>();
  if (!evidence) {
    throw new Error("evidence.not_found");
  }
  if (evidence.tenant_id !== options.tenantId) {
    throw new Error("evidence.tenant_mismatch");
  }

  const result = await upsertControlEvidenceLink(
    db,
    options.controlKey,
    options.evidenceHash,
    options.tenantId,
  );

  return {
    created: result.created,
    createdAt: result.createdAt,
  };
}
