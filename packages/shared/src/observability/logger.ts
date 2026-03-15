export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  service: string;
  timestamp: string;
  traceId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class StructuredLogger {
  private readonly minLevel: number;

  constructor(
    private readonly service: string,
    level: LogLevel = "info",
  ) {
    this.minLevel = LEVEL_ORDER[level];
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  child(defaults: Record<string, unknown>): ChildLogger {
    return new ChildLogger(this, defaults);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (LEVEL_ORDER[level] < this.minLevel) return;
    const entry: LogEntry = {
      level,
      message,
      service: this.service,
      timestamp: new Date().toISOString(),
      ...data,
    };
    const output = JSON.stringify(entry);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
  }
}

class ChildLogger {
  constructor(
    private readonly parent: StructuredLogger,
    private readonly defaults: Record<string, unknown>,
  ) {}

  debug(message: string, data?: Record<string, unknown>): void {
    this.parent.debug(message, { ...this.defaults, ...data });
  }
  info(message: string, data?: Record<string, unknown>): void {
    this.parent.info(message, { ...this.defaults, ...data });
  }
  warn(message: string, data?: Record<string, unknown>): void {
    this.parent.warn(message, { ...this.defaults, ...data });
  }
  error(message: string, data?: Record<string, unknown>): void {
    this.parent.error(message, { ...this.defaults, ...data });
  }
}
