export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.failures = 0;
    this.lastFailureTime = null;
    this.isOpen = false;
  }

  async execute(operation) {
    if (this.isOpen) {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.reset();
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.reset();
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.isOpen = true;
      }

      throw error;
    }
  }

  reset() {
    this.failures = 0;
    this.lastFailureTime = null;
    this.isOpen = false;
  }
} 