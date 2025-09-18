export type LogLevel = "debug" | "info" | "warn" | "error";
interface LoggerOptions {
    level?: LogLevel;
    service?: string;
}
export declare class Logger {
    private readonly level;
    private readonly service?;
    constructor(opts?: LoggerOptions);
    private format;
    debug(msg: string, meta?: any): void;
    info(msg: string, meta?: any): void;
    warn(msg: string, meta?: any): void;
    error(msg: string, meta?: any): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map