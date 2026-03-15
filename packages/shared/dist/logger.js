/* Lightweight logger — delegates to observability/logger createLogger */
import { createLogger } from "./observability/logger.js";
/**
 * @deprecated Use createLogger() from observability/logger instead.
 * Kept for backward compatibility with existing `new Logger()` call sites.
 */
export class Logger {
  inner;
  constructor(opts = {}) {
    const level = opts.level ?? "info";
    const context = {};
    if (opts.service) context.service = opts.service;
    this.inner = createLogger(context, level);
  }
  debug(msg, data) {
    this.inner.debug(msg, data);
  }
  info(msg, data) {
    this.inner.info(msg, data);
  }
  warn(msg, data) {
    this.inner.warn(msg, data);
  }
  error(msg, data) {
    this.inner.error(msg, data);
  }
  child(context) {
    return this.inner.child(context);
  }
}
export const logger = new Logger({ service: "shared" });
//# sourceMappingURL=logger.js.map
