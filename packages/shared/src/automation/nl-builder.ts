/**
 * Natural Language Automation Builder
 *
 * Translates natural language policy descriptions into structured AutomationRule JSON
 * with compliance control mapping preview. This is the core of the "describe a policy,
 * get compliance-mapped automation" demo flow.
 *
 * Uses Groq (qwen3-32b) to interpret intent and map to the AtlasIT automation schema.
 * Falls back through the AI provider chain if Groq is unavailable.
 *
 * Example input:  "When someone leaves the Engineering team, revoke their GitHub and AWS access"
 * Example output: AutomationRule with trigger=user_left_group, actions=[revoke_app_access x2],
 *                 plus compliance preview showing SOC2 CC6.1, CC6.3, ISO27001 A.9.2.6 coverage
 */

import { generateAI, type AIMessage } from "../ai";
import type {
  TriggerType,
  ActionType,
  RuleCondition,
  RuleAction,
  TriggerConfig,
  CreateRuleInput,
} from "./types";
import { ACTION_COMPLIANCE_MAP, type ComplianceControlRef } from "./compliance-mapping";
import type { ComplianceGap } from "../compliance-intelligence/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NLBuildRequest {
  prompt: string;
  /** Optional: tenant's connected apps for context */
  connectedApps?: string[];
  /** Optional: tenant's directory groups for context */
  directoryGroups?: string[];
  /** Optional: existing automation rules summary for dedup detection */
  existingRulesSummary?: string[];
  /** Optional: compliance gaps to bias toward gap-closing rules */
  complianceGaps?: ComplianceGap[];
}

export interface NLBuildResult {
  rule: CreateRuleInput;
  compliancePreview: CompliancePreview[];
  confidence: number;
  reasoning: string;
  /** Original prompt echoed back */
  prompt: string;
  /** Controls this rule would close gaps for (if gap context was provided) */
  closesGaps?: string[];
  /** Whether this rule may duplicate an existing rule */
  possibleDuplicate?: boolean;
}

export interface CompliancePreview {
  framework: string;
  controlId: string;
  controlName: string;
  evidenceType: string;
  /** Which action in the rule triggers this control */
  fromAction: ActionType;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an IT automation policy translator for AtlasIT, a lifecycle management and compliance platform.

Your job: translate natural language descriptions of IT policies into structured JSON automation rules.

## Available Trigger Types
- user_joined_group: fires when a user joins a directory group
- user_left_group: fires when a user leaves a directory group
- user_created: fires when a new user appears in directory sync
- user_deactivated: fires when a user is deactivated/offboarded
- app_connected: fires when a new SaaS app is connected
- app_disconnected: fires when a SaaS app is disconnected
- app_health_changed: fires when an app's health status changes
- schedule: fires on a cron schedule
- compliance_score_changed: fires when a compliance score crosses a threshold

## Available Action Types
- provision_app_access: grant access to a SaaS app
- revoke_app_access: revoke access to a SaaS app
- assign_role: assign a role to a user
- remove_role: remove a role from a user
- send_notification: send a Slack/email notification
- run_workflow: trigger a JML workflow (joiner/mover/leaver)
- sync_directory: trigger a directory sync
- create_incident: create a security/compliance incident
- update_compliance_status: update a compliance control status
- request_access_review: initiate an access review campaign

## Condition Operators
- equals, not_equals, contains, in, not_in, gt, lt

## Output Format
Return ONLY valid JSON (no markdown, no explanation) matching this structure:
{
  "name": "Short descriptive rule name",
  "description": "What this rule does and why",
  "triggerType": "<one of the trigger types above>",
  "triggerConfig": { ... },
  "conditions": [ { "field": "...", "operator": "...", "value": "..." } ],
  "actions": [ { "type": "<action type>", "config": { ... }, "order": 1 } ],
  "confidence": 0.95,
  "reasoning": "Brief explanation of interpretation"
}

## Rules for Translation
1. Pick the MOST specific trigger type that matches the user's intent
2. Use conditions to narrow scope (e.g., specific groups, departments, apps)
3. Order actions logically — revocations before notifications, etc.
4. For group-specific triggers, include groupName in triggerConfig
5. For app-specific actions, include appId/appName in action config
6. Set confidence 0.0-1.0 based on how clear the intent is
7. If the prompt is ambiguous, pick the most likely interpretation and explain in reasoning
8. Always include a send_notification action for security-relevant changes`;

// ── Builder ───────────────────────────────────────────────────────────────────

function buildUserPrompt(req: NLBuildRequest): string {
  let prompt = `Translate this IT policy into an automation rule:\n\n"${req.prompt}"`;

  if (req.connectedApps?.length) {
    prompt += `\n\nConnected SaaS apps in this tenant: ${req.connectedApps.join(", ")}`;
  }
  if (req.directoryGroups?.length) {
    prompt += `\n\nDirectory groups in this tenant: ${req.directoryGroups.join(", ")}`;
  }
  if (req.existingRulesSummary?.length) {
    prompt += `\n\nExisting automation rules (avoid duplicating these):\n${req.existingRulesSummary.slice(0, 10).join("\n")}`;
  }
  if (req.complianceGaps?.length) {
    const gapSummary = req.complianceGaps
      .slice(0, 5)
      .map((g) => `- ${g.framework} ${g.controlId} (${g.controlName}): ${g.gapType}`)
      .join("\n");
    prompt += `\n\nCompliance gaps that need closing (prioritize rules that address these):\n${gapSummary}`;
  }

  return prompt;
}

interface AIRuleResponse {
  name: string;
  description?: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  conditions: Array<{ field: string; operator: string; value: unknown }>;
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
    order: number;
  }>;
  confidence: number;
  reasoning: string;
}

const VALID_TRIGGERS: TriggerType[] = [
  "user_joined_group",
  "user_left_group",
  "user_created",
  "user_deactivated",
  "app_connected",
  "app_disconnected",
  "app_health_changed",
  "schedule",
  "compliance_score_changed",
];

const VALID_ACTIONS: ActionType[] = [
  "provision_app_access",
  "revoke_app_access",
  "assign_role",
  "remove_role",
  "send_notification",
  "run_workflow",
  "sync_directory",
  "create_incident",
  "update_compliance_status",
  "request_access_review",
];

function validateAndNormalize(raw: AIRuleResponse): {
  rule: CreateRuleInput;
  confidence: number;
  reasoning: string;
} {
  if (!VALID_TRIGGERS.includes(raw.triggerType as TriggerType)) {
    throw new Error(`Invalid trigger type: ${raw.triggerType}`);
  }

  const actions: RuleAction[] = [];
  for (const a of raw.actions) {
    if (!VALID_ACTIONS.includes(a.type as ActionType)) {
      continue; // skip invalid action types rather than failing
    }
    actions.push({
      type: a.type as ActionType,
      config: a.config ?? {},
      order: a.order ?? actions.length + 1,
    });
  }

  if (actions.length === 0) {
    throw new Error("No valid actions in generated rule");
  }

  const conditions: RuleCondition[] = (raw.conditions ?? [])
    .filter((c) => c.field && c.operator && c.value !== undefined)
    .map((c) => ({
      field: c.field,
      operator: c.operator as RuleCondition["operator"],
      value: c.value as string | string[] | number,
    }));

  const rule: CreateRuleInput = {
    name: raw.name || "AI-generated rule",
    description: raw.description,
    triggerType: raw.triggerType as TriggerType,
    triggerConfig: (raw.triggerConfig ?? {}) as TriggerConfig,
    conditions,
    actions,
  };

  return {
    rule,
    confidence: Math.max(0, Math.min(1, raw.confidence ?? 0.5)),
    reasoning: raw.reasoning || "Generated from natural language input",
  };
}

function buildCompliancePreview(actions: RuleAction[]): CompliancePreview[] {
  const preview: CompliancePreview[] = [];
  const seen = new Set<string>();

  for (const action of actions) {
    const controls: ComplianceControlRef[] = ACTION_COMPLIANCE_MAP[action.type] ?? [];
    for (const ctrl of controls) {
      const key = `${ctrl.framework}:${ctrl.controlId}:${action.type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      preview.push({
        framework: ctrl.framework,
        controlId: ctrl.controlId,
        controlName: ctrl.controlName,
        evidenceType: ctrl.evidenceType,
        fromAction: action.type,
      });
    }
  }

  return preview;
}

/**
 * Translate a natural language policy description into a structured automation rule
 * with compliance control mapping preview.
 */
export async function buildAutomationFromNL(
  env: Record<string, unknown>,
  req: NLBuildRequest,
): Promise<NLBuildResult> {
  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(req) },
  ];

  const response = await generateAI(messages, env, {
    provider: "groq",
    model: "qwen/qwen3-32b",
    temperature: 0.3,
    maxTokens: 1024,
  });

  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = response.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  // Strip <think> blocks if present (qwen3 reasoning)
  jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  let parsed: AIRuleResponse;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI returned invalid JSON: ${jsonStr.slice(0, 200)}`);
  }

  const { rule, confidence, reasoning } = validateAndNormalize(parsed);
  const compliancePreview = buildCompliancePreview(rule.actions);

  // Determine which compliance gaps this rule would close
  let closesGaps: string[] | undefined;
  if (req.complianceGaps?.length) {
    const gapControlIds = new Set(req.complianceGaps.map((g) => `${g.framework}:${g.controlId}`));
    const coveredControls = compliancePreview.map((cp) => `${cp.framework}:${cp.controlId}`);
    closesGaps = coveredControls.filter((c) => gapControlIds.has(c));
    if (closesGaps.length === 0) closesGaps = undefined;
  }

  // Check for possible duplicate against existing rules
  let possibleDuplicate: boolean | undefined;
  if (req.existingRulesSummary?.length) {
    const ruleKey = `${rule.triggerType}:${JSON.stringify(rule.triggerConfig)}`.toLowerCase();
    possibleDuplicate = req.existingRulesSummary.some(
      (summary) =>
        summary.toLowerCase().includes(rule.triggerType) &&
        rule.actions.some((a) => summary.toLowerCase().includes(a.type)),
    );
    if (!possibleDuplicate) possibleDuplicate = undefined;
  }

  return {
    rule,
    compliancePreview,
    confidence,
    reasoning,
    prompt: req.prompt,
    closesGaps,
    possibleDuplicate,
  };
}
