export class MetricsCollector {
  constructor() {
    this.metrics = new Map();
    this.operationCounts = new Map();
    this.operationDurations = new Map();
    this.operationErrors = new Map();
  }

  async init() {
    // Initialize metrics collection
    this.startTime = Date.now();
  }

  async recordOperation(component, operation, duration, success) {
    const key = `${component}.${operation}`;
    
    // Update operation counts
    this.operationCounts.set(key, (this.operationCounts.get(key) || 0) + 1);
    
    // Update operation durations
    const durations = this.operationDurations.get(key) || [];
    durations.push(duration);
    this.operationDurations.set(key, durations);
    
    // Update error counts
    if (!success) {
      this.operationErrors.set(key, (this.operationErrors.get(key) || 0) + 1);
    }
  }

  async getMetrics(target) {
    const metrics = {
      uptime: Date.now() - this.startTime,
      operations: {},
      errors: {}
    };

    // Calculate operation metrics
    for (const [key, count] of this.operationCounts) {
      const durations = this.operationDurations.get(key) || [];
      const errors = this.operationErrors.get(key) || 0;
      
      metrics.operations[key] = {
        count,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        errorRate: errors / count
      };
    }

    // Add target-specific metrics if provided
    if (target) {
      metrics.target = {
        name: target,
        status: 'healthy', // This should be determined by actual health checks
        lastChecked: new Date().toISOString()
      };
    }

    return metrics;
  }

  async close() {
    // Clean up any resources
    this.metrics.clear();
    this.operationCounts.clear();
    this.operationDurations.clear();
    this.operationErrors.clear();
  }
} 