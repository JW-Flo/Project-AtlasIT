const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
export function createLogger(context = {}, minLevel = "info") {
  const minLevelValue = LOG_LEVELS[minLevel];
  function log(level, message, data) {
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
export class StructuredLogger {
  logger;
  constructor(service, level = "info") {
    this.logger = createLogger({ service }, level);
  }
  debug(message, data) {
    this.logger.debug(message, data);
  }
  info(message, data) {
    this.logger.info(message, data);
  }
  warn(message, data) {
    this.logger.warn(message, data);
  }
  error(message, data) {
    this.logger.error(message, data);
  }
  child(context) {
    return this.logger.child(context);
  }
}
//# sourceMappingURL=logger.js.map
