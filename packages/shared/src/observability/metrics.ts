// CloudWatch Embedded Metrics Format (EMF)
// Lambda automatically parses EMF and creates CloudWatch metrics

interface MetricDefinition {
  Name: string;
  Unit: string;
}

export class MetricsEmitter {
  private readonly dimensions: Record<string, string> = {};
  private readonly metrics: MetricDefinition[] = [];
  private readonly values: Record<string, number> = {};
  private readonly properties: Record<string, unknown> = {};

  constructor(private readonly namespace: string) {}

  setDimension(key: string, value: string): this {
    this.dimensions[key] = value;
    return this;
  }

  setProperty(key: string, value: unknown): this {
    this.properties[key] = value;
    return this;
  }

  putMetric(name: string, value: number, unit = "None"): this {
    if (!this.metrics.find((m) => m.Name === name)) {
      this.metrics.push({ Name: name, Unit: unit });
    }
    this.values[name] = value;
    return this;
  }

  flush(): void {
    const emf = {
      _aws: {
        Timestamp: Date.now(),
        CloudWatchMetrics: [
          {
            Namespace: this.namespace,
            Dimensions: [Object.keys(this.dimensions)],
            Metrics: this.metrics,
          },
        ],
      },
      ...this.dimensions,
      ...this.values,
      ...this.properties,
    };
    console.log(JSON.stringify(emf));
  }
}

export function createMetrics(service: string, env: string): MetricsEmitter {
  return new MetricsEmitter("AtlasIT")
    .setDimension("Service", service)
    .setDimension("Environment", env);
}
