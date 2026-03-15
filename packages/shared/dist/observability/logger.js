const LEVEL_ORDER = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
export class StructuredLogger {
  service;
  minLevel;
  constructor(service, level = "info") {
    this.service = service;
    this.minLevel = LEVEL_ORDER[level];
  }
  debug(message, data) {
    this.log("debug", message, data);
  }
  info(message, data) {
    this.log("info", message, data);
  }
  warn(message, data) {
    this.log("warn", message, data);
  }
  error(message, data) {
    this.log("error", message, data);
  }
  child(defaults) {
    return new ChildLogger(this, defaults);
  }
  log(level, message, data) {
    if (LEVEL_ORDER[level] < this.minLevel) return;
    const entry = {
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
  parent;
  defaults;
  constructor(parent, defaults) {
    this.parent = parent;
    this.defaults = defaults;
  }
  debug(message, data) {
    this.parent.debug(message, { ...this.defaults, ...data });
  }
  info(message, data) {
    this.parent.info(message, { ...this.defaults, ...data });
  }
  warn(message, data) {
    this.parent.warn(message, { ...this.defaults, ...data });
  }
  error(message, data) {
    this.parent.error(message, { ...this.defaults, ...data });
  }
}
//# sourceMappingURL=logger.js.map
