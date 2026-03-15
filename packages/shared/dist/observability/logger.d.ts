export type LogLevel = "debug" | "info" | "warn" | "error";
export declare class StructuredLogger {
  private readonly service;
  private readonly minLevel;
  constructor(service: string, level?: LogLevel);
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  child(defaults: Record<string, unknown>): ChildLogger;
  private log;
}
declare class ChildLogger {
  private readonly parent;
  private readonly defaults;
  constructor(parent: StructuredLogger, defaults: Record<string, unknown>);
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}
export {};
//# sourceMappingURL=logger.d.ts.map
