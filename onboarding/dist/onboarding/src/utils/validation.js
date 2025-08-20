import { z } from "zod";
const IntegrationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["saas", "api", "database", "custom"]),
  config: z.record(z.any()),
  enabled: z.boolean(),
});
const WorkflowTriggerSchema = z.object({
  type: z.enum(["webhook", "schedule", "event"]),
  config: z.record(z.any()),
});
const WorkflowActionSchema = z.object({
  type: z.enum(["api_call", "notification", "data_transform", "custom"]),
  config: z.record(z.any()),
});
const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  trigger: WorkflowTriggerSchema,
  actions: z.array(WorkflowActionSchema),
  enabled: z.boolean(),
});
const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
});
const SecurityConfigSchema = z.object({
  authentication: z.object({
    method: z.enum(["jwt", "oauth", "saml"]),
    config: z.record(z.any()),
  }),
  authorization: z.object({
    rbac: z.boolean(),
    roles: z.array(RoleSchema),
  }),
  encryption: z.object({
    atRest: z.boolean(),
    inTransit: z.boolean(),
  }),
});
const TenantConfigSchema = z.object({
  industry: z.string(),
  requirements: z.array(z.string()),
  integrations: z.array(IntegrationSchema),
  workflows: z.array(WorkflowSchema),
  security: SecurityConfigSchema,
});
export async function validateTenantConfig(config) {
  try {
    TenantConfigSchema.parse(config);
    // Additional business logic validation
    const errors = [];
    // Validate at least one integration is enabled
    const enabledIntegrations = config.integrations.filter((i) => i.enabled);
    if (enabledIntegrations.length === 0) {
      errors.push("At least one integration must be enabled");
    }
    // Validate workflow actions have valid triggers
    for (const workflow of config.workflows) {
      if (workflow.enabled && workflow.actions.length === 0) {
        errors.push(
          `Workflow '${workflow.name}' must have at least one action`,
        );
      }
    }
    // Validate security configuration
    if (
      config.security.authorization.rbac &&
      config.security.authorization.roles.length === 0
    ) {
      errors.push("RBAC is enabled but no roles are defined");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      };
    }
    return {
      isValid: false,
      errors: ["Unknown validation error"],
    };
  }
}
export function validateOnboardingRequest(body) {
  const schema = z.object({
    tenantId: z.string().min(1),
    name: z.string().min(1),
    industry: z.string().min(1),
    requirements: z.array(z.string()).optional(),
  });
  try {
    schema.parse(body);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      };
    }
    return {
      isValid: false,
      errors: ["Invalid request format"],
    };
  }
}
//# sourceMappingURL=validation.js.map
