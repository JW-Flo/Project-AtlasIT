import { z } from "zod";

export const HealthCheckStatusSchema = z.enum(["pass", "fail", "warn"]);

export type HealthCheckStatus = z.infer<typeof HealthCheckStatusSchema>;

export const HealthCheckSchema = z.object({
  status: HealthCheckStatusSchema,
  message: z.string().optional(),
});

export type HealthCheck = z.infer<typeof HealthCheckSchema>;

export const HealthResponseSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  timestamp: z.string().datetime(),
  version: z.string(),
  service: z.string(),
  checks: z.record(z.string(), HealthCheckSchema).optional(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ApiErrorSchema = z.object({
  status: z.literal("error"),
  code: z.string(),
  message: z.string(),
  correlationId: z.string().uuid(),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ApiSuccessSchema = z.object({
  status: z.literal("success"),
  data: z.unknown(),
  correlationId: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export type ApiSuccess = z.infer<typeof ApiSuccessSchema>;
