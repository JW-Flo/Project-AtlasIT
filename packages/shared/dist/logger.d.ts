import type {
  LogLevel,
  LogContext,
  Logger as ILogger,
} from "./observability/logger.js";
interface LoggerOptions {
  level?: LogLevel;
  service?: string;
}
/**
 * @deprecated Use createLogger() from observability/logger instead.
 * Kept for backward compatibility with existing `new Logger()` call sites.
 */
export declare class Logger implements ILogger {
  private readonly inner;
  constructor(opts?: LoggerOptions);
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
  child(context: LogContext): ILogger;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map
