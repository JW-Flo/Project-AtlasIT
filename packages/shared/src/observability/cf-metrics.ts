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

export class CFMetricsEmitter {
  private readonly service: string;
  private readonly environment: string;
  private readonly dataset: AnalyticsEngineDataset | null;
  private readonly buffer: CFMetricPoint[] = [];

  constructor(
    service: string,
    environment: string,
    dataset?: AnalyticsEngineDataset,
  ) {
    this.service = service;
    this.environment = environment;
    this.dataset = dataset ?? null;
  }

  /**
   * Record a counter increment.
   */
  increment(name: string, tags: Record<string, string> = {}): this {
    return this.record(name, 1, tags);
  }

  /**
   * Record a numeric value (latency, size, etc.).
   */
  record(name: string, value: number, tags: Record<string, string> = {}): this {
    this.buffer.push({ name, value, tags });
    return this;
  }

  /**
   * Record request latency with standard tags.
   */
  recordLatency(
    route: string,
    method: string,
    status: number,
    durationMs: number,
  ): this {
    return this.record("http_request_duration_ms", durationMs, {
      route,
      method,
      status: String(status),
    });
  }

  /**
   * Flush all buffered metrics to Analytics Engine or structured logs.
   */
  flush(): void {
    for (const point of this.buffer) {
      if (this.dataset) {
        // Analytics Engine format:
        // blobs[0] = metric name, blobs[1] = service, blobs[2] = env
        // blobs[3..] = tag values
        // doubles[0] = value
        // indexes[0] = metric name (for querying)
        const tagEntries = Object.entries(point.tags);
        const blobs = [
          point.name,
          this.service,
          this.environment,
          ...tagEntries.map(([k, v]) => `${k}=${v}`),
        ];
        this.dataset.writeDataPoint({
          blobs,
          doubles: [point.value],
          indexes: [point.name],
        });
      } else {
        // Fallback: structured JSON log (parseable by log pipeline)
        console.log(
          JSON.stringify({
            _metric: true,
            name: point.name,
            value: point.value,
            service: this.service,
            environment: this.environment,
            tags: point.tags,
            ts: new Date().toISOString(),
          }),
        );
      }
    }
    this.buffer.length = 0;
  }
}

/**
 * Create a metrics emitter for a CF Worker.
 * Pass the Analytics Engine dataset binding if available.
 */
export function createCFMetrics(
  service: string,
  environment: string,
  dataset?: AnalyticsEngineDataset,
): CFMetricsEmitter {
  return new CFMetricsEmitter(service, environment, dataset);
}
