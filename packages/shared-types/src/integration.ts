import { z } from "zod";

export const IntegrationTypeSchema = z.enum([
  "saas",
  "api",
  "database",
  "custom",
]);

export type IntegrationType = z.infer<typeof IntegrationTypeSchema>;

export const IntegrationStatusSchema = z.enum(["active", "inactive", "error"]);

export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

export const IntegrationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  type: IntegrationTypeSchema,
  provider: z.string(),
  status: IntegrationStatusSchema,
  config: z.record(z.string(), z.unknown()).optional(),
  installedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Integration = z.infer<typeof IntegrationSchema>;
