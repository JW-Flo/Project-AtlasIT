import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  buildCopilotContext,
  buildSystemPrompt,
  generateAI,
  buildAutomationFromNL,
  type AIMessage,
  type CopilotMessage,
  type CopilotChatRequest,
  type CopilotAction,
} from "@atlasit/shared";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId)
    return json(
      { error: "Tenant context required. Please log out and log back in." },
      { status: 403 },
    );

  // buildCopilotContext still uses D1 - will be migrated in shared package
  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  const env = (platform?.env ?? {}) as Record<string, any>;

  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  let body: CopilotChatRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, conversationId, quickAction, framework } = body;
  if (!message && !quickAction) {
    return json({ error: "message or quickAction required" }, { status: 400 });
  }

  // Rate limit: max 30 copilot requests per tenant per hour
  const kv = (platform?.env as any)?.KV_CACHE;
  if (kv) {
    const rateKey = `copilot:rate:${tenantId}`;
    const current = parseInt((await kv.get(rateKey)) ?? "0", 10);
    if (current >= 30) {
      return json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }
    await kv.put(rateKey, String(current + 1), { expirationTtl: 3600 });
  }

  // Build tenant context for the system prompt
  const tenantContext = await buildCopilotContext(db, tenantId);

  // Load conversation history if continuing
  let history: CopilotMessage[] = [];
  const convId = conversationId ?? crypto.randomUUID();
  if (conversationId) {
    try {
      const row = await queryPgOne<{ value: string }>(
        "SELECT value FROM tenant_preferences WHERE tenant_id = $1 AND key = $2",
        [tenantId, `copilot_conv:${conversationId}`],
      );
      if (row?.value) {
        history = JSON.parse(row.value);
      }
    } catch {
      /* fresh conversation */
    }
  }

  // Build messages for AI
  const systemPrompt = buildSystemPrompt(tenantContext, quickAction, framework);
  const aiMessages: AIMessage[] = [{ role: "system", content: systemPrompt }];

  // Include conversation history (last 10 messages to stay within token limits)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      aiMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current user message
  const userContent =
    quickAction && !message ? getQuickActionMessage(quickAction, framework) : message;
  aiMessages.push({ role: "user", content: userContent });

  // Handle NL rule creation — if the user provides a rule description in conversation,
  // try to build a structured automation rule via the NL builder
  let nlRuleResult: any = null;
  if (quickAction === "create_rule" && message) {
    try {
      // Fetch connected apps and existing rules for context
      const [appsResult, rulesResult] = await Promise.all([
        queryPg<{ app_id: string }>(
          "SELECT app_id FROM connected_apps WHERE tenant_id = $1 AND status = $2",
          [tenantId, "active"],
        ),
        queryPg<{ name: string; trigger_type: string }>(
          "SELECT name, trigger_type FROM automation_rules WHERE tenant_id = $1 LIMIT 20",
          [tenantId],
        ),
      ]);

      nlRuleResult = await buildAutomationFromNL(env, {
        prompt: message,
        connectedApps: appsResult.map((r) => r.app_id),
        existingRulesSummary: rulesResult.map((r) => `${r.name} (${r.trigger_type})`),
      });
    } catch {
      // Fall through to normal AI response if NL builder fails
    }
  }

  // Call AI (Bedrock primary, Groq fallback)
  let aiResponse: string;
  try {
    aiResponse = await generateAI(aiMessages, env, {
      provider: (env.AI_PROVIDER as any) || "bedrock",
      model: env.COPILOT_MODEL || "us.anthropic.claude-sonnet-4-6",
      temperature: 0.4,
      maxTokens: 2048,
      fallbackProviders: ["groq"],
    });
  } catch (err) {
    console.error("Copilot AI error:", err);
    return json({ error: "AI service temporarily unavailable" }, { status: 503 });
  }

  // Strip thinking tags if present
  aiResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // If NL rule was built, append it to the response
  if (nlRuleResult) {
    aiResponse += `\n\n---\n**Generated Rule: ${nlRuleResult.rule.name}**\n`;
    aiResponse += `- Trigger: \`${nlRuleResult.rule.triggerType}\`\n`;
    aiResponse += `- Actions: ${nlRuleResult.rule.actions.map((a: any) => `\`${a.type}\``).join(", ")}\n`;
    aiResponse += `- Confidence: ${Math.round(nlRuleResult.confidence * 100)}%\n`;
    if (nlRuleResult.compliancePreview.length > 0) {
      aiResponse += `- Compliance coverage: ${nlRuleResult.compliancePreview.map((c: any) => `${c.framework} ${c.controlId}`).join(", ")}\n`;
    }
    if (nlRuleResult.possibleDuplicate) {
      aiResponse += `\n> **Note:** This may overlap with an existing rule. Review before saving.\n`;
    }
  }

  // Parse any structured actions from the response
  const actions = extractActions(aiResponse);

  // Add rule creation action if NL rule was built
  if (nlRuleResult) {
    actions.unshift({
      type: "create_rule",
      label: `Create rule: ${nlRuleResult.rule.name}`,
      href: "/console/automation",
      payload: { rule: nlRuleResult.rule },
    });
  }

  const userMsg: CopilotMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: userContent,
    timestamp: new Date().toISOString(),
  };

  const assistantMsg: CopilotMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: aiResponse,
    timestamp: new Date().toISOString(),
    actions: actions.length > 0 ? actions : undefined,
  };

  // Persist conversation (keep last 50 messages)
  const updatedHistory = [...history, userMsg, assistantMsg].slice(-50);
  try {
    await queryPg(
      `INSERT INTO tenant_preferences (tenant_id, key, value, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT(tenant_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [tenantId, `copilot_conv:${convId}`, JSON.stringify(updatedHistory)],
    );
  } catch {
    /* best-effort persistence */
  }

  return json({
    conversationId: convId,
    message: assistantMsg,
  });
};

/** GET conversations list for the current user */
export const GET: RequestHandler = async ({ locals, platform, url }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ conversations: [] });

  const results = await queryPg<{ key: string; updated_at: string }>(
    `SELECT key, updated_at FROM tenant_preferences
     WHERE tenant_id = $1 AND key LIKE $2
     ORDER BY updated_at DESC LIMIT 20`,
    [tenantId, "copilot_conv:%"],
  );

  const conversations = results.map((r) => ({
    id: r.key.replace("copilot_conv:", ""),
    updatedAt: r.updated_at,
  }));

  return json({ conversations });
};

function getQuickActionMessage(action: string, framework?: string): string {
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

function extractActions(response: string): CopilotAction[] {
  const actions: CopilotAction[] = [];

  // Detect page references and create navigation actions
  const pageMap: Record<string, string> = {
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
    settings: "/console/settings",
  };

  const lowerResponse = response.toLowerCase();
  for (const [keyword, href] of Object.entries(pageMap)) {
    if (lowerResponse.includes(keyword)) {
      const label = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      // Avoid duplicate hrefs
      if (!actions.some((a) => a.href === href)) {
        actions.push({ type: "navigate", label: `Go to ${label}`, href });
      }
    }
  }

  return actions.slice(0, 5);
}
