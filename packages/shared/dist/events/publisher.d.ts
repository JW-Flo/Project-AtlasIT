export interface PublishEventOptions {
  orchestratorUrl: string;
  tenantId: string;
  type: string;
  source: string;
  payload?: unknown;
  idempotencyKey?: string;
  correlationId?: string;
}
export declare function publishEvent(options: PublishEventOptions): Promise<{
  id: string;
  status: string;
}>;
//# sourceMappingURL=publisher.d.ts.map
