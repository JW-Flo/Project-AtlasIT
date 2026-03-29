import { EventEmitter } from 'events';

export class AutonomousLoop extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;

  constructor(intervalMs: number = 1000) {
    super();
    this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.intervalId !== null) {
      return; // already running
    }
    this.emit('starting');
    this.intervalId = setInterval(() => {
      this.emit('tick');
    }, this.intervalMs);
    this.emit('started');
  }

  stop(): void {
    if (this.intervalId === null) {
      return; // not running
    }
    this.emit('stopping');
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.emit('stopped');
  }

  // Placeholder handlers (can be overridden or used externally)
  // Example usage:
  // const loop = new AutonomousLoop(500);
  // loop.on('tick', () => console.log('Tick'));
}

export const defaultLoop = new AutonomousLoop();