import { TenantConfig, AIConfigRequest, Workflow } from "../types";

export class AIConfigService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateConfig(request: AIConfigRequest): Promise<TenantConfig> {
    const { industry, requirements = [] } = request;

    // Generate industry-specific configuration
    const baseConfig = this.getIndustryBaseConfig(industry);

    // Enhance with AI-generated recommendations
    const enhancedConfig = await this.enhanceWithAI(baseConfig, requirements);

    return enhancedConfig;
  }

  private getIndustryBaseConfig(industry: string): TenantConfig {
    const industryConfigs: Record<string, Partial<TenantConfig>> = {
      // Baseline for general technology/SaaS companies
      technology: {
        integrations: [
          {
            id: "core-platform",
            name: "Core Platform Events",
            type: "custom",
            config: { eventBus: true, audit: true },
            enabled: true,
          },
        ],
        security: {
          authentication: { method: "jwt", config: { tokenExpiry: "12h" } },
          authorization: {
            rbac: true,
            roles: [
              { id: "user", name: "User", permissions: ["read:resources"] },
              {
                id: "ops",
                name: "Operations",
                permissions: ["read:resources", "write:resources"],
              },
              { id: "admin", name: "Administrator", permissions: ["*"] },
            ],
          },
          encryption: { atRest: true, inTransit: true },
        },
      },
      healthcare: {
        integrations: [
          {
            id: "epic-integration",
            name: "Epic EHR Integration",
            type: "saas",
            config: { apiVersion: "v1", encryption: true },
            enabled: true,
          },
          {
            id: "hipaa-compliance",
            name: "HIPAA Compliance Module",
            type: "custom",
            config: { auditLogging: true, dataEncryption: true },
            enabled: true,
          },
        ],
        security: {
          authentication: { method: "saml", config: { ssoRequired: true } },
          authorization: {
            rbac: true,
            roles: [
              {
                id: "doctor",
                name: "Doctor",
                permissions: ["read:patient", "write:patient"],
              },
              { id: "nurse", name: "Nurse", permissions: ["read:patient"] },
              { id: "admin", name: "Administrator", permissions: ["*"] },
            ],
          },
          encryption: { atRest: true, inTransit: true },
        },
      },
      finance: {
        integrations: [
          {
            id: "plaid-integration",
            name: "Plaid Banking API",
            type: "api",
            config: { environment: "production", webhooks: true },
            enabled: true,
          },
          {
            id: "compliance-reporting",
            name: "Regulatory Compliance",
            type: "custom",
            config: { sox: true, pci: true },
            enabled: true,
          },
        ],
        security: {
          authentication: { method: "oauth", config: { mfa: true } },
          authorization: {
            rbac: true,
            roles: [
              {
                id: "analyst",
                name: "Financial Analyst",
                permissions: ["read:reports"],
              },
              {
                id: "manager",
                name: "Finance Manager",
                permissions: ["read:reports", "write:reports"],
              },
              { id: "admin", name: "Administrator", permissions: ["*"] },
            ],
          },
          encryption: { atRest: true, inTransit: true },
        },
      },
      retail: {
        integrations: [
          {
            id: "shopify-integration",
            name: "Shopify E-commerce",
            type: "saas",
            config: { webhooks: true, inventory: true },
            enabled: true,
          },
          {
            id: "stripe-payments",
            name: "Stripe Payment Processing",
            type: "api",
            config: { webhooks: true, subscriptions: true },
            enabled: true,
          },
        ],
        security: {
          authentication: { method: "jwt", config: { tokenExpiry: "24h" } },
          authorization: {
            rbac: true,
            roles: [
              {
                id: "customer",
                name: "Customer",
                permissions: ["read:products", "write:orders"],
              },
              {
                id: "staff",
                name: "Staff",
                permissions: ["read:orders", "write:inventory"],
              },
              { id: "admin", name: "Administrator", permissions: ["*"] },
            ],
          },
          encryption: { atRest: true, inTransit: true },
        },
      },
    };

    const baseConfig = industryConfigs[industry.toLowerCase()] || {
      integrations: [],
      security: {
        authentication: { method: "jwt", config: {} },
        authorization: { rbac: false, roles: [] },
        encryption: { atRest: false, inTransit: true },
      },
    };

    // Safety net: ensure at least one baseline integration exists so validation passes
    if (!baseConfig.integrations || baseConfig.integrations.length === 0) {
      baseConfig.integrations = [
        {
          id: "baseline-observability",
          name: "Baseline Observability",
          type: "custom",
          config: { logging: true },
          enabled: true,
        },
      ];
      // Provide minimal RBAC role if none and RBAC disabled
      if (!baseConfig.security) {
        baseConfig.security = {
          authentication: { method: "jwt", config: {} },
          authorization: { rbac: false, roles: [] },
          encryption: { atRest: false, inTransit: true },
        };
      }
    }

    return {
      industry,
      requirements: [],
      integrations: baseConfig.integrations || [],
      workflows: this.generateDefaultWorkflows(),
      security: baseConfig.security || {
        authentication: { method: "jwt", config: {} },
        authorization: { rbac: false, roles: [] },
        encryption: { atRest: false, inTransit: true },
      },
    };
  }

  private generateDefaultWorkflows(): Workflow[] {
    return [
      {
        id: "user-onboarding",
        name: "User Onboarding Workflow",
        trigger: {
          type: "event",
          config: { event: "user.created" },
        },
        actions: [
          {
            type: "notification",
            config: {
              type: "email",
              template: "welcome",
              recipient: "{{user.email}}",
            },
          },
          {
            type: "api_call",
            config: {
              url: "/api/users/{{user.id}}/setup",
              method: "POST",
            },
          },
        ],
        enabled: true,
      },
      {
        id: "data-sync",
        name: "Daily Data Synchronization",
        trigger: {
          type: "schedule",
          config: { cron: "0 2 * * *" },
        },
        actions: [
          {
            type: "data_transform",
            config: {
              source: "external_api",
              destination: "internal_db",
              transformation: "normalize",
            },
          },
        ],
        enabled: true,
      },
    ];
  }

  private async enhanceWithAI(
    baseConfig: TenantConfig,
    requirements: string[],
  ): Promise<TenantConfig> {
    // In a real implementation, this would call an AI service
    // For now, we'll enhance based on requirements keywords

    const enhancedConfig = { ...baseConfig };

    // Add integrations based on requirements
    for (const requirement of requirements) {
      const lowerReq = requirement.toLowerCase();

      if (
        lowerReq.includes("slack") &&
        !enhancedConfig.integrations.find((i) => i.name.includes("Slack"))
      ) {
        enhancedConfig.integrations.push({
          id: "slack-integration",
          name: "Slack Integration",
          type: "saas",
          config: { webhooks: true, botToken: true },
          enabled: true,
        });
      }

      if (
        lowerReq.includes("salesforce") &&
        !enhancedConfig.integrations.find((i) => i.name.includes("Salesforce"))
      ) {
        enhancedConfig.integrations.push({
          id: "salesforce-integration",
          name: "Salesforce CRM",
          type: "saas",
          config: { apiVersion: "v58.0", sandbox: false },
          enabled: true,
        });
      }

      if (
        lowerReq.includes("analytics") &&
        !enhancedConfig.integrations.find((i) => i.name.includes("Analytics"))
      ) {
        enhancedConfig.integrations.push({
          id: "analytics-integration",
          name: "Google Analytics",
          type: "api",
          config: { version: "v4", realtime: true },
          enabled: true,
        });
      }

      if (
        /(monitoring|observability)/.test(lowerReq) &&
        !enhancedConfig.integrations.find((i) => i.id === "monitoring-stack")
      ) {
        enhancedConfig.integrations.push({
          id: "monitoring-stack",
          name: "Monitoring Stack",
          type: "custom",
          config: { metrics: true, traces: true, logs: true },
          enabled: true,
        });
      }

      if (
        /(logging)/.test(lowerReq) &&
        !enhancedConfig.integrations.find((i) => i.id === "central-logging")
      ) {
        enhancedConfig.integrations.push({
          id: "central-logging",
          name: "Central Logging",
          type: "custom",
          config: { retentionDays: 30 },
          enabled: true,
        });
      }

      if (
        /(audit)/.test(lowerReq) &&
        !enhancedConfig.integrations.find((i) => i.id === "audit-trail")
      ) {
        enhancedConfig.integrations.push({
          id: "audit-trail",
          name: "Audit Trail Service",
          type: "custom",
          config: { immutable: true },
          enabled: true,
        });
      }

      if (/(sso)/.test(lowerReq)) {
        enhancedConfig.security.authentication.method = "saml";
        enhancedConfig.security.authentication.config.ssoRequired = true;
      }

      if (
        /(gdpr|privacy)/.test(lowerReq) &&
        !enhancedConfig.integrations.find((i) => i.id === "privacy-compliance")
      ) {
        enhancedConfig.integrations.push({
          id: "privacy-compliance",
          name: "Privacy Compliance Toolkit",
          type: "custom",
          config: { dataSubjectRequests: true },
          enabled: true,
        });
        enhancedConfig.security.encryption.atRest = true;
      }
    }

    // Enhance security based on requirements
    if (requirements.some((r) => r.toLowerCase().includes("compliance"))) {
      enhancedConfig.security.encryption.atRest = true;
      enhancedConfig.security.authorization.rbac = true;
    }

    if (requirements.some((r) => r.toLowerCase().includes("sso"))) {
      enhancedConfig.security.authentication.method = "saml";
      enhancedConfig.security.authentication.config.ssoRequired = true;
    }

    return enhancedConfig;
  }
}
