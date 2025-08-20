import { Env } from "../types";
import { handleError } from "../utils/error";
import { validateTenantConfig } from "../utils/validation";
import { generateTemplate } from "../services/template";
import { AIConfigService } from "../services/ai-config";
import { OnboardingErrors, json } from "../utils/errors";

interface OnboardingRequestBody {
  tenantId?: string;
  name?: string;
  industry?: string;
  requirements?: string[];
}

export async function handleOnboarding(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const body: OnboardingRequestBody = await request.json(); // Typed JSON body
    const { tenantId, name, industry, requirements } = body;

    // Validate request
    if (!tenantId || !name || !industry) {
      const missing = [
        !tenantId && "tenantId",
        !name && "name",
        !industry && "industry",
      ].filter(Boolean) as string[];
      return json(OnboardingErrors.MISSING_FIELDS(missing), 400);
    }

    // Industry allowlist validation (Phase 1 hardening)
    const allowedIndustries = ["technology", "healthcare", "finance", "retail"];
    if (industry && !allowedIndustries.includes(industry.toLowerCase())) {
      return json(
        OnboardingErrors.UNSUPPORTED_INDUSTRY(allowedIndustries),
        400,
      );
    }

    // Idempotency: check KV state first
    const existingState = await env.STATE.get(`onboarding:${tenantId}`);
    if (existingState) {
      const parsed = JSON.parse(existingState);
      return json({
        status: "success",
        tenantId,
        config: parsed.config,
        template: parsed.template,
        idempotent: true,
      });
    }

    // Initialize AI configuration service
    const aiConfig = new AIConfigService(env.AI_API_KEY);

    // Generate recommended configuration based on requirements
    const recommendedConfig = await aiConfig.generateConfig({
      industry,
      requirements: requirements || [],
    });

    // Validate configuration
    const validationResult = await validateTenantConfig(recommendedConfig);
    if (!validationResult.isValid) {
      return json(
        OnboardingErrors.INVALID_CONFIG(validationResult.errors),
        400,
      );
    }

    // Generate tenant template
    const template = await generateTemplate(recommendedConfig);

    // Store tenant info and configuration
    await env.DB.prepare(
      "INSERT INTO tenants (id, name, industry, config, created_at) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(
        tenantId,
        name,
        industry,
        JSON.stringify(recommendedConfig),
        new Date().toISOString(),
      )
      .run();

    // Write audit event (best effort)
    try {
      await env.DB.prepare(
        "INSERT INTO audit_events (id, tenant_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)",
      )
        .bind(
          crypto.randomUUID(),
          tenantId,
          "onboarding.completed",
          JSON.stringify({ tenantId, industry }),
          new Date().toISOString(),
        )
        .run();
    } catch (e) {
      // Non-fatal; proceed without blocking success
      console.warn("Audit event insert failed", e);
    }

    // Store onboarding state
    await env.STATE.put(
      `onboarding:${tenantId}`,
      JSON.stringify({
        status: "configured",
        timestamp: new Date().toISOString(),
        config: recommendedConfig,
        template,
      }),
    );

    return json(
      {
        status: "success",
        tenantId,
        config: recommendedConfig,
        template,
      },
      201,
    );
  } catch (error) {
    return handleError(error);
  }
}

// New: generate onboarding questions (stub logic; Phase 1 AI enhancement)
interface OnboardingQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
}
export async function generateOnboardingQuestions(
  industry: string,
  requirements: string[] = [],
): Promise<OnboardingQuestion[]> {
  const baseQuestions: OnboardingQuestion[] = [
    {
      id: "company_size",
      question: "How many employees do you currently have?",
      type: "number",
    },
    {
      id: "mfa_policy",
      question: "Do you currently enforce MFA for all users?",
      type: "boolean",
    },
    {
      id: "primary_saas",
      question:
        "Which primary SaaS platforms do you rely on? (e.g., Google Workspace, Microsoft 365, Slack)",
      type: "multi-select",
    },
  ];
  if (industry.toLowerCase() === "healthcare") {
    baseQuestions.push({
      id: "phi_storage",
      question: "Do you store or process Protected Health Information (PHI)?",
      type: "boolean",
    });
  }
  if (requirements.some((r) => r.toLowerCase().includes("compliance"))) {
    baseQuestions.push({
      id: "audit_frequency",
      question: "How often do you perform internal access audits?",
      type: "select",
      options: ["Monthly", "Quarterly", "Annually", "Never"],
    });
  }
  return baseQuestions;
}
