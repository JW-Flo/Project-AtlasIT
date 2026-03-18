import { z } from "zod";
const SecurityHeadersConfigSchema = z.object({
    contentSecurityPolicy: z
        .string()
        .min(1)
        .default("default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"),
    strictTransportSecurity: z
        .string()
        .min(1)
        .default("max-age=63072000; includeSubDomains; preload"),
    frameOptions: z.enum(["DENY", "SAMEORIGIN"]).default("DENY"),
    contentTypeOptions: z.string().min(1).default("nosniff"),
    referrerPolicy: z.string().min(1).default("strict-origin-when-cross-origin"),
});
export function securityHeadersMiddleware(config = {}) {
    const parsed = SecurityHeadersConfigSchema.parse(config);
    return async (c, next) => {
        await next();
        c.header("Content-Security-Policy", parsed.contentSecurityPolicy);
        c.header("Strict-Transport-Security", parsed.strictTransportSecurity);
        c.header("X-Frame-Options", parsed.frameOptions);
        c.header("X-Content-Type-Options", parsed.contentTypeOptions);
        c.header("Referrer-Policy", parsed.referrerPolicy);
    };
}
//# sourceMappingURL=security-headers.js.map