import { z } from "zod";
export function validateEnv(spec, raw) {
  const schema = z.object(spec);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error("Environment validation failed: " + errors);
  }
  return result.data;
}
export const commonEnvSpec = {
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  AI_PROVIDER: z.enum(["cloudflare", "together", "openai"]).optional(),
};
//# sourceMappingURL=env.js.map
