export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

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

export function createLogger(
  context: LogContext = {},
  minLevel: LogLevel = "info",
): Logger {
  const minLevelValue = LOG_LEVELS[minLevel];

  function log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (LOG_LEVELS[level] < minLevelValue) return;

    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
      ...data,
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        console.debug(output);
        break;
      default:
        console.log(output);
        break;
    }
  }

  return {
    debug: (msg, data) => log("debug", msg, data),
    info: (msg, data) => log("info", msg, data),
    warn: (msg, data) => log("warn", msg, data),
    error: (msg, data) => log("error", msg, data),
    child: (childContext) =>
      createLogger({ ...context, ...childContext }, minLevel),
  };
}

/** @deprecated Use createLogger() instead */
export class StructuredLogger implements Logger {
  private readonly logger: Logger;

  constructor(service: string, level: LogLevel = "info") {
    this.logger = createLogger({ service }, level);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.logger.error(message, data);
  }

  child(context: LogContext): Logger {
    return this.logger.child(context);
  }
}
