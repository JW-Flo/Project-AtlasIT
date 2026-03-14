/**
 * Cloudflare-compatible OPA policy evaluator stub.
 *
 * For the controlled MVP, this evaluator works in two modes:
 * 1. Bundle mode: loads OPA WASM bundle from R2 (future)
 * 2. Inline mode: evaluates policies via a simple rule engine (MVP)
 *
 * All evaluations produce decision logs stored as evidence.
 */

import type { PolicyEvaluator } from "../interfaces.js";

export interface PolicyDecisionLog {
  decisionId: string;
  bundleRevision: string;
  query: string;
  input: unknown;
  result: { allow: boolean; deny?: string[] };
  timestamp: string;
}

export class CloudflarePolicyEvaluator implements PolicyEvaluator {
  private readonly bundleRevision: string;
  private readonly decisionLogs: PolicyDecisionLog[] = [];

  constructor(bundleRevision = "inline-v1") {
    this.bundleRevision = bundleRevision;
  }

  async evaluate(input: unknown): Promise<{
    decision: unknown;
    decisionId: string;
    bundleRevision: string;
  }> {
    const decisionId = crypto.randomUUID();
    const typedInput = input as Record<string, unknown>;
    const action = (typedInput.action as string) ?? "";
    const roles = ((typedInput.subject as Record<string, unknown>)?.roles as string[]) ?? [];

    // Default-deny evaluation
    let allow = false;
    const deny: string[] = [];

    // Check authorization rules
    if (action === "workflow.execute" && roles.includes("automation:execute")) {
      allow = true;
    } else if (action === "evidence.read" && roles.includes("evidence:read")) {
      allow = true;
    } else if (roles.some((r) => r.startsWith("admin:"))) {
      allow = true;
    }

    // Check deny rules
    if (action === "retention.purge" && !roles.includes("admin:retention")) {
      deny.push("missing required role admin:retention");
      allow = false;
    }

    const decision = { allow, deny: deny.length > 0 ? deny : undefined };

    // Record decision log
    const log: PolicyDecisionLog = {
      decisionId,
      bundleRevision: this.bundleRevision,
      query: `data.atlasit.authz.allow`,
      input,
      result: { allow, deny },
      timestamp: new Date().toISOString(),
    };
    this.decisionLogs.push(log);

    return {
      decision,
      decisionId,
      bundleRevision: this.bundleRevision,
    };
  }

  /** Retrieve accumulated decision logs (for evidence emission). */
  getDecisionLogs(): PolicyDecisionLog[] {
    return [...this.decisionLogs];
  }

  /** Flush decision logs after they've been persisted as evidence. */
  flushDecisionLogs(): void {
    this.decisionLogs.length = 0;
  }
}
