import { g as generateAI } from './ai-J0pj_lx1.js';
import { A as ACTION_COMPLIANCE_MAP } from './gap-analyzer-CVZTZ0l9.js';

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
function buildUserPrompt(req) {
  let prompt = `Translate this IT policy into an automation rule:

"${req.prompt}"`;
  if (req.connectedApps?.length) {
    prompt += `

Connected SaaS apps in this tenant: ${req.connectedApps.join(", ")}`;
  }
  if (req.directoryGroups?.length) {
    prompt += `

Directory groups in this tenant: ${req.directoryGroups.join(", ")}`;
  }
  if (req.existingRulesSummary?.length) {
    prompt += `

Existing automation rules (avoid duplicating these):
${req.existingRulesSummary.slice(0, 10).join("\n")}`;
  }
  if (req.complianceGaps?.length) {
    const gapSummary = req.complianceGaps.slice(0, 5).map((g) => `- ${g.framework} ${g.controlId} (${g.controlName}): ${g.gapType}`).join("\n");
    prompt += `

Compliance gaps that need closing (prioritize rules that address these):
${gapSummary}`;
  }
  return prompt;
}
const VALID_TRIGGERS = [
  "user_joined_group",
  "user_left_group",
  "user_created",
  "user_deactivated",
  "app_connected",
  "app_disconnected",
  "app_health_changed",
  "schedule",
  "compliance_score_changed"
];
const VALID_ACTIONS = [
  "provision_app_access",
  "revoke_app_access",
  "assign_role",
  "remove_role",
  "send_notification",
  "run_workflow",
  "sync_directory",
  "create_incident",
  "update_compliance_status",
  "request_access_review"
];
function validateAndNormalize(raw) {
  if (!VALID_TRIGGERS.includes(raw.triggerType)) {
    throw new Error(`Invalid trigger type: ${raw.triggerType}`);
  }
  const actions = [];
  for (const a of raw.actions) {
    if (!VALID_ACTIONS.includes(a.type)) {
      continue;
    }
    actions.push({
      type: a.type,
      config: a.config ?? {},
      order: a.order ?? actions.length + 1
    });
  }
  if (actions.length === 0) {
    throw new Error("No valid actions in generated rule");
  }
  const conditions = (raw.conditions ?? []).filter((c) => c.field && c.operator && c.value !== void 0).map((c) => ({
    field: c.field,
    operator: c.operator,
    value: c.value
  }));
  const rule = {
    name: raw.name || "AI-generated rule",
    description: raw.description,
    triggerType: raw.triggerType,
    triggerConfig: raw.triggerConfig ?? {},
    conditions,
    actions
  };
  return {
    rule,
    confidence: Math.max(0, Math.min(1, raw.confidence ?? 0.5)),
    reasoning: raw.reasoning || "Generated from natural language input"
  };
}
function buildCompliancePreview(actions) {
  const preview = [];
  const seen = /* @__PURE__ */ new Set();
  for (const action of actions) {
    const controls = ACTION_COMPLIANCE_MAP[action.type] ?? [];
    for (const ctrl of controls) {
      const key = `${ctrl.framework}:${ctrl.controlId}:${action.type}`;
      if (seen.has(key))
        continue;
      seen.add(key);
      preview.push({
        framework: ctrl.framework,
        controlId: ctrl.controlId,
        controlName: ctrl.controlName,
        evidenceType: ctrl.evidenceType,
        fromAction: action.type
      });
    }
  }
  return preview;
}
async function buildAutomationFromNL(env, req) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(req) }
  ];
  const response = await generateAI(messages, env, {
    provider: "groq",
    model: "qwen/qwen3-32b",
    temperature: 0.3,
    maxTokens: 1024
  });
  let jsonStr = response.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI returned invalid JSON: ${jsonStr.slice(0, 200)}`);
  }
  const { rule, confidence, reasoning } = validateAndNormalize(parsed);
  const compliancePreview = buildCompliancePreview(rule.actions);
  let closesGaps;
  if (req.complianceGaps?.length) {
    const gapControlIds = new Set(req.complianceGaps.map((g) => `${g.framework}:${g.controlId}`));
    const coveredControls = compliancePreview.map((cp) => `${cp.framework}:${cp.controlId}`);
    closesGaps = coveredControls.filter((c) => gapControlIds.has(c));
    if (closesGaps.length === 0)
      closesGaps = void 0;
  }
  let possibleDuplicate;
  if (req.existingRulesSummary?.length) {
    `${rule.triggerType}:${JSON.stringify(rule.triggerConfig)}`.toLowerCase();
    possibleDuplicate = req.existingRulesSummary.some((summary) => summary.toLowerCase().includes(rule.triggerType) && rule.actions.some((a) => summary.toLowerCase().includes(a.type)));
    if (!possibleDuplicate)
      possibleDuplicate = void 0;
  }
  return {
    rule,
    compliancePreview,
    confidence,
    reasoning,
    prompt: req.prompt,
    closesGaps,
    possibleDuplicate
  };
}

export { buildAutomationFromNL as b };
//# sourceMappingURL=nl-builder-Cpy3_06C.js.map
