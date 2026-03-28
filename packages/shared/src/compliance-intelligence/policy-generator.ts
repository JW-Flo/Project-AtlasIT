/**
 * AI Policy Generator
 *
 * Auto-generates security policies (access control, incident response,
 * data handling, password, acceptable use) from control frameworks
 * + tenant's actual configuration, grounded in real operational data.
 */

import { generateAI, type AIMessage } from "../ai";
import type { PolicyType, GeneratedPolicy, PolicySection } from "./types";

export interface TenantContext {
  tenantId: string;
  tenantName: string;
  selectedFrameworks: string[];
  connectedApps: string[];
  automationRuleCount: number;
  complianceScores: Record<string, number>;
  evidenceSummary: string;
}

const POLICY_TEMPLATES: Record<
  PolicyType,
  {
    title: string;
    systemPrompt: string;
    sections: string[];
    relevantFrameworks: string[];
  }
> = {
  access_control: {
    title: "Access Control Policy",
    systemPrompt: `Generate a comprehensive access control policy. Cover user provisioning,
deprovisioning, least privilege, role-based access, periodic reviews, and emergency access.
Reference specific compliance controls from the tenant's frameworks.`,
    sections: [
      "Purpose and Scope",
      "User Access Provisioning",
      "Role-Based Access Control",
      "Least Privilege Principle",
      "Access Reviews and Recertification",
      "Privileged Access Management",
      "Emergency and Break-Glass Access",
      "Access Termination and Offboarding",
      "Monitoring and Enforcement",
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "NIST_CSF", "HIPAA"],
  },
  incident_response: {
    title: "Incident Response Policy",
    systemPrompt: `Generate an incident response policy covering detection, classification,
escalation, containment, eradication, recovery, and lessons learned. Include SLAs for
different severity levels.`,
    sections: [
      "Purpose and Scope",
      "Incident Classification and Severity Levels",
      "Detection and Reporting",
      "Escalation Procedures",
      "Containment and Eradication",
      "Recovery and Restoration",
      "Communication Plan",
      "Post-Incident Review",
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "NIST_CSF"],
  },
  data_handling: {
    title: "Data Handling and Classification Policy",
    systemPrompt: `Generate a data handling policy covering data classification levels,
handling requirements per level, encryption standards, retention, and disposal.
Address cross-border data transfers if GDPR is a framework.`,
    sections: [
      "Purpose and Scope",
      "Data Classification Levels",
      "Handling Requirements by Classification",
      "Encryption Standards",
      "Data Retention and Disposal",
      "Cross-Border Transfers",
      "Third-Party Data Sharing",
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "GDPR", "HIPAA"],
  },
  password: {
    title: "Password and Authentication Policy",
    systemPrompt: `Generate a password and authentication policy covering password
complexity, rotation, MFA requirements, SSO, and service account credentials.`,
    sections: [
      "Purpose and Scope",
      "Password Requirements",
      "Multi-Factor Authentication",
      "Single Sign-On",
      "Service Account and API Key Management",
      "Password Storage and Transmission",
      "Account Lockout and Recovery",
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "NIST_CSF", "HIPAA"],
  },
  acceptable_use: {
    title: "Acceptable Use Policy",
    systemPrompt: `Generate an acceptable use policy covering permitted and prohibited
use of company systems, SaaS applications, AI tools, personal devices, and data access.`,
    sections: [
      "Purpose and Scope",
      "Permitted Use of Company Systems",
      "Prohibited Activities",
      "SaaS and Cloud Application Usage",
      "AI and Generative AI Tool Usage",
      "Personal Device Policy",
      "Monitoring and Enforcement",
      "Violations and Consequences",
    ],
    relevantFrameworks: ["SOC2", "ISO27001", "GDPR"],
  },
};

function buildSystemPrompt(policyType: PolicyType, tenantContext: TenantContext): string {
  const template = POLICY_TEMPLATES[policyType];
  const applicableFrameworks = template.relevantFrameworks.filter((f) =>
    tenantContext.selectedFrameworks.includes(f),
  );

  return `You are a compliance policy writer for "${tenantContext.tenantName}".

${template.systemPrompt}

## Context
- Compliance frameworks: ${applicableFrameworks.join(", ") || tenantContext.selectedFrameworks.join(", ")}
- Connected applications: ${tenantContext.connectedApps.join(", ") || "none yet"}
- Active automation rules: ${tenantContext.automationRuleCount}
- Current compliance scores: ${
    Object.entries(tenantContext.complianceScores)
      .map(([k, v]) => `${k}: ${v}%`)
      .join(", ") || "not yet scored"
  }
- Evidence status: ${tenantContext.evidenceSummary}

## Required Sections
${template.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Output Format
Return a JSON object with sections array:
{
  "sections": [
    { "title": "Section Title", "content": "Section content in markdown..." },
    ...
  ]
}

Write professional, actionable policy language. Reference the tenant's actual connected
apps and automation setup where relevant. Each section should be 2-4 paragraphs.
Do not include disclaimers about being AI-generated.`;
}

/**
 * Generate a security policy grounded in tenant's actual configuration.
 *
 * Uses Groq AI when available, falls back to template-based generation
 * when AI_DETERMINISTIC is set (testing) or no AI provider is configured.
 */
export async function generateSecurityPolicy(
  env: Record<string, unknown>,
  tenantContext: TenantContext,
  policyType: PolicyType,
): Promise<GeneratedPolicy> {
  const template = POLICY_TEMPLATES[policyType];
  const applicableFrameworks = template.relevantFrameworks.filter((f) =>
    tenantContext.selectedFrameworks.includes(f),
  );
  const basedOn =
    applicableFrameworks.length > 0 ? applicableFrameworks : tenantContext.selectedFrameworks;

  // In deterministic/test mode or when no AI is configured, use template fallback
  const isDeterministic = env.AI_DETERMINISTIC === "1";
  if (isDeterministic || (!env.GROQ_API_KEY && !env.OPENAI_API_KEY)) {
    return buildTemplateFallback(policyType, tenantContext, basedOn);
  }

  const messages: AIMessage[] = [
    { role: "system", content: buildSystemPrompt(policyType, tenantContext) },
    {
      role: "user",
      content: `Generate the ${template.title} for ${tenantContext.tenantName} following the required sections.`,
    },
  ];

  const response = await generateAI(messages, env as Record<string, any>, {
    provider: "groq",
    model: "qwen/qwen3-32b",
    temperature: 0.4,
    maxTokens: 4096,
  });

  let jsonStr = response.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  jsonStr = jsonStr.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  let sections: PolicySection[];
  try {
    const parsed = JSON.parse(jsonStr);
    sections = parsed.sections ?? [];
  } catch {
    // If AI response isn't valid JSON, wrap it as a single section
    sections = [{ title: template.title, content: jsonStr }];
  }

  return {
    title: template.title,
    type: policyType,
    sections,
    generatedAt: new Date().toISOString(),
    basedOn,
  };
}

function buildTemplateFallback(
  policyType: PolicyType,
  tenantContext: TenantContext,
  basedOn: string[],
): GeneratedPolicy {
  const template = POLICY_TEMPLATES[policyType];
  const apps = tenantContext.connectedApps.join(", ") || "connected applications";

  const sections: PolicySection[] = template.sections.map((sectionTitle) => ({
    title: sectionTitle,
    content:
      `This section addresses ${sectionTitle.toLowerCase()} requirements for ${tenantContext.tenantName}. ` +
      `The organization uses ${apps} as part of its IT infrastructure. ` +
      `Compliance with ${basedOn.join(", ")} framework requirements is maintained through automated controls ` +
      `(${tenantContext.automationRuleCount} active rules) and continuous evidence collection. ` +
      `${tenantContext.evidenceSummary}.`,
  }));

  return {
    title: template.title,
    type: policyType,
    sections,
    generatedAt: new Date().toISOString(),
    basedOn,
  };
}
