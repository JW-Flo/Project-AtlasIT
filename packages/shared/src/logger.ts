/* Lightweight logger — delegates to observability/logger createLogger */
import { createLogger } from "./observability/logger.js";
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
export class Logger implements ILogger {
  private readonly inner: ILogger;

  constructor(opts: LoggerOptions = {}) {
    const level: LogLevel = opts.level ?? "info";
    const context: LogContext = {};
    if (opts.service) context.service = opts.service;
    this.inner = createLogger(context, level);
  }

  debug(msg: string, data?: Record<string, unknown>): void {
    this.inner.debug(msg, data);
  }

  info(msg: string, data?: Record<string, unknown>): void {
    this.inner.info(msg, data);
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    this.inner.warn(msg, data);
  }

  error(msg: string, data?: Record<string, unknown>): void {
    this.inner.error(msg, data);
  }

  child(context: LogContext): ILogger {
    return this.inner.child(context);
  }
}

export const logger = new Logger({ service: "shared" });
