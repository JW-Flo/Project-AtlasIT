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
export function resolveCfApiToken(raw) {
    const target = raw
        ? raw
        : typeof process !== "undefined"
            ? process.env
            : undefined;
    if (!target)
        return undefined;
    const preferred = target.CLOUDFLARE_API_TOKEN || target.CF_API_TOKEN;
    if (preferred && !target.CF_API_TOKEN) {
        target.CF_API_TOKEN = preferred;
    }
    return preferred;
}
//# sourceMappingURL=env.js.map