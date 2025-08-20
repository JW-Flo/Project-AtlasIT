import { z } from "zod";

export interface BaseEnvSpec {
  [key: string]: z.ZodTypeAny;
}

export function validateEnv<T extends BaseEnvSpec>(
  spec: T,
  raw: Record<string, any>,
): z.infer<z.ZodObject<T>> {
  const schema = z.object(spec);
  const result = schema.safeParse(raw);
  if (!result.success) {
    const errors = result.error.issues
      .map((i: any) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error("Environment validation failed: " + errors);
  }
  return result.data as any;
}

export const commonEnvSpec = {
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  AI_PROVIDER: z.enum(["cloudflare", "together", "openai"]).optional(),
};

export type CommonEnv = z.infer<z.ZodObject<typeof commonEnvSpec>>;
