export type LogLevel = "debug" | "info" | "warn" | "error";

const levelToConsole: Record<LogLevel, keyof Console> = {
  debug: typeof console.debug === "function" ? "debug" : "log",
  info: "log",
  warn: "warn",
  error: "error",
};

export function log(
  level: LogLevel,
  event: string,
  payload?: Record<string, unknown>,
): void {
  const method = levelToConsole[level] as keyof Console;
  const message = `[runtime:${event}]`;
  if (payload) {
    (console[method] as (...args: unknown[]) => void)(message, payload);
  } else {
    (console[method] as (...args: unknown[]) => void)(message);
  }
}
