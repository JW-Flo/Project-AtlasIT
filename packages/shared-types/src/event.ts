import { z } from "zod";

export const EventStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export type EventStatus = z.infer<typeof EventStatusSchema>;

export const EventSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  type: z.string(),
  source: z.string(),
  payload: z.unknown(),
  status: EventStatusSchema,
  retryCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  processedAt: z.string().datetime().optional(),
});

export type Event = z.infer<typeof EventSchema>;
