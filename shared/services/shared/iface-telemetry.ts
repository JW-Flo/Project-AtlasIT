export interface Telemetry {
  log(level: 'debug'|'info'|'warn'|'error', msg: string, fields?: Record<string, unknown>): void;
  span<T>(name: string, fn: () => Promise<T>): Promise<T>;
  metric(name: string, value: number, labels?: Record<string, string>): void;
}
