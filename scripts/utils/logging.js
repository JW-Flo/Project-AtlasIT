export class LoggingAPI {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
    }

    async logInfo(component, message) {
        this._log('info', component, message);
    }

    async logWarning(component, message) {
        this._log('warn', component, message);
    }

    async logError(component, error) {
        this._log('error', component, error);
    }

    _log(level, component, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            component,
            ...(typeof data === 'string' ? { message: data } : data)
        };

        // In production, this would send to your logging service
        // For now, we'll just console.log with proper formatting
        console.log(JSON.stringify(logEntry, null, 2));
    }
} 