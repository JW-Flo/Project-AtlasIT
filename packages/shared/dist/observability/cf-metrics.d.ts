/**
 * Cloudflare Workers-native metrics emitter.
 *
 * Uses Workers Analytics Engine (AE) when available, falls back to
 * structured JSON logs for local dev / non-AE environments.
 *
 * Analytics Engine write format:
 *   dataset.writeDataPoint({ blobs: string[], doubles: number[], indexes: string[] })
 */
export interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}
export interface CFMetricPoint {
  name: string;
  value: number;
  tags: Record<string, string>;
}
export declare class CFMetricsEmitter {
  private readonly service;
  private readonly environment;
  private readonly dataset;
  private readonly buffer;
  constructor(
    service: string,
    environment: string,
    dataset?: AnalyticsEngineDataset,
  );
  /**
   * Record a counter increment.
   */
  increment(name: string, tags?: Record<string, string>): this;
  /**
   * Record a numeric value (latency, size, etc.).
   */
  record(name: string, value: number, tags?: Record<string, string>): this;
  /**
   * Record request latency with standard tags.
   */
  recordLatency(
    route: string,
    method: string,
    status: number,
    durationMs: number,
  ): this;
  /**
   * Flush all buffered metrics to Analytics Engine or structured logs.
   */
  flush(): void;
}
/**
 * Create a metrics emitter for a CF Worker.
 * Pass the Analytics Engine dataset binding if available.
 */
export declare function createCFMetrics(
  service: string,
  environment: string,
  dataset?: AnalyticsEngineDataset,
): CFMetricsEmitter;
//# sourceMappingURL=cf-metrics.d.ts.map
