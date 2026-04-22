import { json } from '@sveltejs/kit';
import './gap-analyzer-CVZTZ0l9.js';
import { g as generateAI } from './ai-J0pj_lx1.js';
import { b as buildAutomationFromNL } from './nl-builder-Cpy3_06C.js';
import { b as buildCopilotContext, f as formatContextForPrompt } from './context-builder-4573Ue-F.js';

const BASE_SYSTEM_PROMPT = `You are the AtlasIT Compliance Copilot — an AI compliance officer embedded in an IT automation and compliance platform.

## Your Role
- Answer compliance questions with specific, actionable guidance grounded in the tenant's actual data
- Reference real compliance scores, evidence gaps, connected apps, and remediation status
- When recommending actions, be specific about which controls, frameworks, or apps are involved
- Cite framework control IDs (e.g., SOC 2 CC6.1, ISO 27001 A.9.2.5) when relevant
- Prioritize recommendations by impact on compliance posture

## What You Know
You have access to the tenant's live compliance data including:
- Framework scores and control statuses
- Evidence collection pipeline health
- Connected application and adapter status
- Active remediation plans and their progress
- Automation rules and policy coverage
- Compliance insights (gaps, drift alerts, risk anomalies)

## Guidelines
- Be concise and direct. Lead with the answer, then explain.
- When suggesting next steps, format them as a numbered list with specific actions.
- If you suggest navigating somewhere in the console, mention the page name.
- Don't fabricate data — if something isn't in the context, say you don't have that information.
- For audit prep questions, structure your response as a checklist.
- When creating automation rules, output them in the natural language format the system understands.`;
const WHAT_NEXT_PROMPT = `Based on the tenant's current compliance posture, provide a prioritized list of the 5 most impactful actions they should take next. Consider:
1. Controls with the lowest scores or missing evidence
2. Overdue remediation plans
3. Stale evidence (>30 days old)
4. Disconnected or unhealthy adapters
5. Missing policies for their selected frameworks
6. Open incidents

Format each action with:
- What to do (specific action)
- Why (impact on compliance)
- Where (which page in the console)`;
const AUDIT_PREP_PROMPT = `The tenant wants to prepare for a compliance audit. Generate a comprehensive audit readiness checklist covering:
1. Evidence completeness — controls with missing or stale evidence
2. Policy coverage — required policies that haven't been generated or approved
3. Access reviews — overdue or never-completed reviews
4. Remediation plans — open items that auditors will flag
5. Adapter health — integrations that need attention before audit
6. Control implementation status — controls still in "not started" or "in progress"

Format as a checklist with completion status based on the tenant's actual data.`;
function buildSystemPrompt(tenantContext, quickAction, framework) {
  const contextBlock = formatContextForPrompt(tenantContext);
  let actionPrompt = "";
  if (quickAction === "what_next") {
    actionPrompt = `

## Current Task
${WHAT_NEXT_PROMPT}`;
  } else if (quickAction === "audit_prep") {
    const fw = framework || tenantContext.selectedFrameworks[0] || "SOC 2";
    actionPrompt = `

## Current Task
The tenant is preparing for a ${fw} audit.
${AUDIT_PREP_PROMPT}`;
  } else if (quickAction === "create_rule") {
    actionPrompt = `

## Current Task
The tenant wants to create an automation rule using natural language. Parse their request and output a structured rule definition with trigger, conditions, and actions. Use the natural language builder format.`;
  }
  return `${BASE_SYSTEM_PROMPT}

## Tenant Data (Live)
${contextBlock}${actionPrompt}`;
}
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required. Please log out and log back in." }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  const env = platform?.env ?? {};
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { message, conversationId, quickAction, framework } = body;
  if (!message && !quickAction) {
    return json({ error: "message or quickAction required" }, { status: 400 });
  }
  const kv = platform?.env?.KV_CACHE;
  if (kv) {
    const rateKey = `copilot:rate:${tenantId}`;
    const current = parseInt(await kv.get(rateKey) ?? "0", 10);
    if (current >= 30) {
      return json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    await kv.put(rateKey, String(current + 1), { expirationTtl: 3600 });
  }
  const tenantContext = await buildCopilotContext(db, tenantId);
  let history = [];
  const convId = conversationId ?? crypto.randomUUID();
  if (conversationId) {
    try {
      const row = await db.prepare("SELECT value FROM tenant_preferences WHERE tenant_id = ? AND key = ?").bind(tenantId, `copilot_conv:${conversationId}`).first();
      if (row?.value) {
        history = JSON.parse(row.value);
      }
    } catch {
    }
  }
  const systemPrompt = buildSystemPrompt(tenantContext, quickAction, framework);
  const aiMessages = [{ role: "system", content: systemPrompt }];
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      aiMessages.push({ role: msg.role, content: msg.content });
    }
  }
  const userContent = quickAction && !message ? getQuickActionMessage(quickAction, framework) : message;
  aiMessages.push({ role: "user", content: userContent });
  let nlRuleResult = null;
  if (quickAction === "create_rule" && message) {
    try {
      const [appsResult, rulesResult] = await Promise.all([
        db.prepare("SELECT app_id FROM connected_apps WHERE tenant_id = ? AND status = 'active'").bind(tenantId).all(),
        db.prepare("SELECT name, trigger_type FROM automation_rules WHERE tenant_id = ? LIMIT 20").bind(tenantId).all()
      ]);
      nlRuleResult = await buildAutomationFromNL(env, {
        prompt: message,
        connectedApps: (appsResult.results ?? []).map((r) => r.app_id),
        existingRulesSummary: (rulesResult.results ?? []).map(
          (r) => `${r.name} (${r.trigger_type})`
        )
      });
    } catch {
    }
  }
  let aiResponse;
  try {
    aiResponse = await generateAI(aiMessages, env, {
      provider: env.AI_PROVIDER || "bedrock",
      model: env.COPILOT_MODEL || "us.anthropic.claude-sonnet-4-6",
      temperature: 0.4,
      maxTokens: 2048,
      fallbackProviders: ["groq"]
    });
  } catch (err) {
    console.error("Copilot AI error:", err);
    return json({ error: "AI service temporarily unavailable" }, { status: 503 });
  }
  aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  if (nlRuleResult) {
    aiResponse += `

---
**Generated Rule: ${nlRuleResult.rule.name}**
`;
    aiResponse += `- Trigger: \`${nlRuleResult.rule.triggerType}\`
`;
    aiResponse += `- Actions: ${nlRuleResult.rule.actions.map((a) => `\`${a.type}\``).join(", ")}
`;
    aiResponse += `- Confidence: ${Math.round(nlRuleResult.confidence * 100)}%
`;
    if (nlRuleResult.compliancePreview.length > 0) {
      aiResponse += `- Compliance coverage: ${nlRuleResult.compliancePreview.map((c) => `${c.framework} ${c.controlId}`).join(", ")}
`;
    }
    if (nlRuleResult.possibleDuplicate) {
      aiResponse += `
> **Note:** This may overlap with an existing rule. Review before saving.
`;
    }
  }
  const actions = extractActions(aiResponse);
  if (nlRuleResult) {
    actions.unshift({
      type: "create_rule",
      label: `Create rule: ${nlRuleResult.rule.name}`,
      href: "/console/automation",
      payload: { rule: nlRuleResult.rule }
    });
  }
  const userMsg = {
    id: crypto.randomUUID(),
    role: "user",
    content: userContent,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  const assistantMsg = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: aiResponse,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    actions: actions.length > 0 ? actions : void 0
  };
  const updatedHistory = [...history, userMsg, assistantMsg].slice(-50);
  try {
    await db.prepare(
      `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
         VALUES (?, ?, ?, datetime('now'))
         ON CONFLICT(tenant_id, key) DO UPDATE SET value = ?, updated_at = datetime('now')`
    ).bind(
      tenantId,
      `copilot_conv:${convId}`,
      JSON.stringify(updatedHistory),
      JSON.stringify(updatedHistory)
    ).run();
  } catch {
  }
  return json({
    conversationId: convId,
    message: assistantMsg
  });
};
const GET = async ({ locals, platform, url }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db || !tenantId) return json({ conversations: [] });
  const { results } = await db.prepare(
    `SELECT key, updated_at FROM tenant_preferences
       WHERE tenant_id = ? AND key LIKE 'copilot_conv:%'
       ORDER BY updated_at DESC LIMIT 20`
  ).bind(tenantId).all();
  const conversations = (results ?? []).map((r) => ({
    id: r.key.replace("copilot_conv:", ""),
    updatedAt: r.updated_at
  }));
  return json({ conversations });
};
function getQuickActionMessage(action, framework) {
  switch (action) {
    case "what_next":
      return "What should I do next to improve my compliance posture?";
    case "audit_prep":
      return `Help me prepare for my ${framework || "SOC 2"} audit. What's missing?`;
    case "create_rule":
      return "I want to create a new automation rule. Help me set it up.";
    default:
      return "How can you help me with compliance?";
  }
}
function extractActions(response) {
  const actions = [];
  const pageMap = {
    compliance: "/console/compliance",
    controls: "/console/compliance",
    evidence: "/console/compliance/feed",
    policies: "/console/policies",
    automation: "/console/automation",
    rules: "/console/automation",
    "access review": "/console/access-reviews",
    incidents: "/console/incidents",
    directory: "/console/directory",
    apps: "/console/apps",
    marketplace: "/console/marketplace",
    remediation: "/console/compliance",
    attestation: "/console/compliance/attestations",
    insights: "/console/insights",
    settings: "/console/settings"
  };
  const lowerResponse = response.toLowerCase();
  for (const [keyword, href] of Object.entries(pageMap)) {
    if (lowerResponse.includes(keyword)) {
      const label = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (!actions.some((a) => a.href === href)) {
        actions.push({ type: "navigate", label: `Go to ${label}`, href });
      }
    }
  }
  return actions.slice(0, 5);
}

export { GET, POST };
//# sourceMappingURL=_server.ts-umOOuAPh.js.map
