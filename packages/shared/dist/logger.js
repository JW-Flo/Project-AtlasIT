const LEVELS = ["debug", "info", "warn", "error"];
function shouldLog(configLevel, messageLevel) {
    return LEVELS.indexOf(messageLevel) >= LEVELS.indexOf(configLevel);
}
export class Logger {
    level;
    service;
    constructor(opts = {}) {
        this.level =
            opts.level ||
                (typeof globalThis.ENV !== "undefined"
                    ? globalThis.ENV.LOG_LEVEL
                    : "info");
        this.service = opts.service;
    }
    format(level, msg, meta) {
        const base = {
            ts: new Date().toISOString(),
            level,
            service: this.service,
            msg,
            ...meta,
        };
        return JSON.stringify(base);
    }
    debug(msg, meta) {
        if (shouldLog(this.level, "debug"))
            console.log(this.format("debug", msg, meta));
    }
    info(msg, meta) {
        if (shouldLog(this.level, "info"))
            console.log(this.format("info", msg, meta));
    }
    warn(msg, meta) {
        if (shouldLog(this.level, "warn"))
            console.warn(this.format("warn", msg, meta));
    }
    error(msg, meta) {
        if (shouldLog(this.level, "error"))
            console.error(this.format("error", msg, meta));
    }
}
export const logger = new Logger({ service: "shared" });
//# sourceMappingURL=logger.js.map