export class Logger {
  constructor(component) {
    this.component = component;
  }

  formatMessage(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      ...metadata
    });
  }

  info(message, metadata = {}) {
    console.log(this.formatMessage('INFO', message, metadata));
  }

  warn(message, metadata = {}) {
    console.warn(this.formatMessage('WARN', message, metadata));
  }

  error(message, metadata = {}) {
    console.error(this.formatMessage('ERROR', message, metadata));
  }

  debug(message, metadata = {}) {
    if (process.env.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, metadata));
    }
  }
} 