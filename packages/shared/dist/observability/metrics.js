// CloudWatch Embedded Metrics Format (EMF)
// Lambda automatically parses EMF and creates CloudWatch metrics
export class MetricsEmitter {
  namespace;
  dimensions = {};
  metrics = [];
  values = {};
  properties = {};
  constructor(namespace) {
    this.namespace = namespace;
  }
  setDimension(key, value) {
    this.dimensions[key] = value;
    return this;
  }
  setProperty(key, value) {
    this.properties[key] = value;
    return this;
  }
  putMetric(name, value, unit = "None") {
    if (!this.metrics.find((m) => m.Name === name)) {
      this.metrics.push({ Name: name, Unit: unit });
    }
    this.values[name] = value;
    return this;
  }
  flush() {
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
export function createMetrics(service, env) {
  return new MetricsEmitter("AtlasIT")
    .setDimension("Service", service)
    .setDimension("Environment", env);
}
//# sourceMappingURL=metrics.js.map
