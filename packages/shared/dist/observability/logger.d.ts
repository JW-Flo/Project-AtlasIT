export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogContext {
  correlationId?: string;
  service?: string;
  environment?: string;
  [key: string]: unknown;
}
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  child(context: LogContext): Logger;
}
export declare function createLogger(
  context?: LogContext,
  minLevel?: LogLevel,
): Logger;
/** @deprecated Use createLogger() instead */
export declare class StructuredLogger implements Logger {
  private readonly logger;
  constructor(service: string, level?: LogLevel);
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
  child(context: LogContext): Logger;
}
//# sourceMappingURL=logger.d.ts.map
