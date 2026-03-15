export declare class MetricsEmitter {
  private readonly namespace;
  private readonly dimensions;
  private readonly metrics;
  private readonly values;
  private readonly properties;
  constructor(namespace: string);
  setDimension(key: string, value: string): this;
  setProperty(key: string, value: unknown): this;
  putMetric(name: string, value: number, unit?: string): this;
  flush(): void;
}
export declare function createMetrics(
  service: string,
  env: string,
): MetricsEmitter;
//# sourceMappingURL=metrics.d.ts.map
