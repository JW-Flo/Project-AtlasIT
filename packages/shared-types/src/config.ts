import { z } from "zod";

export const ConfigSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.string().datetime(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const AuthenticationMethodSchema = z.enum(["jwt", "oauth", "saml"]);

export type AuthenticationMethod = z.infer<typeof AuthenticationMethodSchema>;

export const SecurityConfigSchema = z.object({
  authentication: z.object({
    method: AuthenticationMethodSchema,
  }),
  authorization: z.object({
    rbac: z.boolean(),
    roles: z.array(z.string()),
  }),
  encryption: z.object({
    atRest: z.boolean(),
    inTransit: z.boolean(),
  }),
});

export type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
