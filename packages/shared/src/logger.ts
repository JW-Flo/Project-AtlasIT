/* Lightweight logger abstraction */
export type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  level?: LogLevel;
  service?: string;
}

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

function shouldLog(configLevel: LogLevel, messageLevel: LogLevel) {
  return LEVELS.indexOf(messageLevel) >= LEVELS.indexOf(configLevel);
}

export class Logger {
  private readonly level: LogLevel;
  private readonly service?: string;

  constructor(opts: LoggerOptions = {}) {
    this.level =
      opts.level ||
      (typeof (globalThis as any).ENV !== "undefined"
        ? ((globalThis as any).ENV.LOG_LEVEL as LogLevel)
        : "info");
    this.service = opts.service;
  }

  private format(level: LogLevel, msg: string, meta?: any) {
    const base = {
      ts: new Date().toISOString(),
      level,
      service: this.service,
      msg,
      ...meta,
    };
    return JSON.stringify(base);
  }

  debug(msg: string, meta?: any) {
    if (shouldLog(this.level, "debug"))
      console.log(this.format("debug", msg, meta));
  }
  info(msg: string, meta?: any) {
    if (shouldLog(this.level, "info"))
      console.log(this.format("info", msg, meta));
  }
  warn(msg: string, meta?: any) {
    if (shouldLog(this.level, "warn"))
      console.warn(this.format("warn", msg, meta));
  }
  error(msg: string, meta?: any) {
    if (shouldLog(this.level, "error"))
      console.error(this.format("error", msg, meta));
  }
}

export const logger = new Logger({ service: "shared" });
