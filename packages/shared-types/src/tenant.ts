import { z } from "zod";

export const TenantStatusSchema = z.enum(["active", "suspended", "onboarding"]);

export type TenantStatus = z.infer<typeof TenantStatusSchema>;

export const TenantTierSchema = z.enum([
  "free",
  "starter",
  "professional",
  "enterprise",
]);

export type TenantTier = z.infer<typeof TenantTierSchema>;

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  industry: z.string().optional(),
  status: TenantStatusSchema,
  tier: TenantTierSchema,
  config: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Tenant = z.infer<typeof TenantSchema>;
