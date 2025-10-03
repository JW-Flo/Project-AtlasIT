import { z } from "zod";
export interface BaseEnvSpec {
    [key: string]: z.ZodTypeAny;
}
export declare function validateEnv<T extends BaseEnvSpec>(spec: T, raw: Record<string, any>): z.infer<z.ZodObject<T>>;
export declare const commonEnvSpec: {
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    AI_PROVIDER: z.ZodOptional<z.ZodEnum<["cloudflare", "together", "openai"]>>;
};
export type CommonEnv = z.infer<z.ZodObject<typeof commonEnvSpec>>;
export declare function resolveCfApiToken<T extends Record<string, any>>(raw?: T): string | undefined;
//# sourceMappingURL=env.d.ts.map