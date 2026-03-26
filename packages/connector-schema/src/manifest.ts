import { z } from "zod";

export const AuthModelSchema = z.enum([
  "oauth2",
  "api_key",
  "service_account",
  "saml",
  "none",
]);

export type AuthModel = z.infer<typeof AuthModelSchema>;

export const OAuth2ConfigSchema = z.object({
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  scopes: z.array(z.string()),
  clientIdEnvVar: z.string(),
  clientSecretEnvVar: z.string(),
  pkce: z.boolean(),
});

export type OAuth2Config = z.infer<typeof OAuth2ConfigSchema>;

export const ApiKeyConfigSchema = z.object({
  headerName: z.string(),
  prefix: z.string().optional(),
  envVar: z.string(),
});

export type ApiKeyConfig = z.infer<typeof ApiKeyConfigSchema>;

export const AuthConfigSchema = z.discriminatedUnion("model", [
  z.object({
    model: z.literal("oauth2"),
    oauth2: OAuth2ConfigSchema,
  }),
  z.object({
    model: z.literal("api_key"),
    apiKey: ApiKeyConfigSchema,
  }),
  z.object({
    model: z.literal("service_account"),
  }),
  z.object({
    model: z.literal("saml"),
  }),
  z.object({
    model: z.literal("none"),
  }),
]);

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

export const CapabilitySchema = z.enum([
  "user-provisioning",
  "user-deprovisioning",
  "group-sync",
  "group-management",
  "sso",
  "directory-sync",
  "notifications",
  "approvals",
  "incident-management",
  "issue-tracking",
  "workflow-automation",
  "compliance-scanning",
  "evidence-collection",
  "custom",
]);

export type Capability = z.infer<typeof CapabilitySchema>;

export const ConfigFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["string", "number", "boolean", "select", "secret", "url"]),
  required: z.boolean(),
  description: z.string(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  options: z.array(z.string()).optional(),
  validation: z
    .object({
      pattern: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export type ConfigField = z.infer<typeof ConfigFieldSchema>;

export const WebhookEndpointSchema = z.object({
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  description: z.string(),
  authRequired: z.boolean(),
});

export type WebhookEndpoint = z.infer<typeof WebhookEndpointSchema>;

const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export const ConnectorManifestSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.string().regex(semverRegex, "Must be valid semver"),
  description: z.string(),
  provider: z.string(),
  category: z.string(),
  logoUrl: z.string().url().optional(),
  documentationUrl: z.string().url().optional(),
  auth: AuthConfigSchema,
  capabilities: z.array(CapabilitySchema).min(1),
  configFields: z.array(ConfigFieldSchema),
  webhookEndpoints: z.array(WebhookEndpointSchema).optional(),
  events: z
    .object({
      emits: z.array(z.string()),
      subscribes: z.array(z.string()),
    })
    .optional(),
  lifecycle: z
    .object({
      hooks: z.array(
        z.enum([
          "onInstall",
          "onUninstall",
          "onEnable",
          "onDisable",
          "onConfigUpdate",
        ]),
      ),
    })
    .optional(),
  rateLimit: z
    .object({
      requestsPerSecond: z.number().positive(),
      burstSize: z.number().positive().optional(),
    })
    .optional(),
  minimumTier: z
    .enum(["free", "starter", "professional", "enterprise"])
    .optional(),
});

export type ConnectorManifest = z.infer<typeof ConnectorManifestSchema>;
