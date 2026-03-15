import type { MiddlewareHandler } from "hono";
import { z } from "zod";
declare const SecurityHeadersConfigSchema: z.ZodObject<
  {
    contentSecurityPolicy: z.ZodDefault<z.ZodString>;
    strictTransportSecurity: z.ZodDefault<z.ZodString>;
    frameOptions: z.ZodDefault<z.ZodEnum<["DENY", "SAMEORIGIN"]>>;
    contentTypeOptions: z.ZodDefault<z.ZodString>;
    referrerPolicy: z.ZodDefault<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    frameOptions: "DENY" | "SAMEORIGIN";
    contentTypeOptions: string;
    referrerPolicy: string;
  },
  {
    contentSecurityPolicy?: string | undefined;
    strictTransportSecurity?: string | undefined;
    frameOptions?: "DENY" | "SAMEORIGIN" | undefined;
    contentTypeOptions?: string | undefined;
    referrerPolicy?: string | undefined;
  }
>;
export type SecurityHeadersConfig = z.input<typeof SecurityHeadersConfigSchema>;
export declare function securityHeadersMiddleware(
  config?: SecurityHeadersConfig,
): MiddlewareHandler;
export {};
//# sourceMappingURL=security-headers.d.ts.map
