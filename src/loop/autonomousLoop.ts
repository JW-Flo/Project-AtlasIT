import { EventEmitter } from 'events';
import { AutomationDO } from '../domain/AutomationDO';
import { WorkflowDO } from '../domain/WorkflowDO';

export class AutonomousLoop extends EventEmitter {
  private automationDO: AutomationDO;
  private workflowDO: WorkflowDO;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly tickInterval: number;

  constructor(tickIntervalMs: number = 5000) {
    super();
    this.automationDO = new AutomationDO();
    this.workflowDO = new WorkflowDO();
    this.tickInterval = tickIntervalMs;
  }

  start(): void {
    if (this.intervalId !== null) {
      throw new Error('AutonomousLoop is already running');
    }
    this.intervalId = setInterval(() => {
      this.emit('tick');
    }, this.tickInterval);

    this.on('tick', this.handleTick.bind(this));
    this.on('automationTrigger', this.handleAutomationTrigger.bind(this));
    this.on('workflowTrigger', this.handleWorkflowTrigger.bind(this));
  }

  stop(): void {
    if (this.intervalId === null) {
      throw new Error('AutonomousLoop is not running');
    }
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.removeAllListeners();
  }

  private handleTick(): void {
    this.emit('automationTrigger');
    this.emit('workflowTrigger');
  }

  private async handleAutomationTrigger(): void {
    try {
      await this.automationDO.execute();
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async handleWorkflowTrigger(): void {
    try {
      await this.workflowDO.execute();
    } catch (error) {
      this.emit('error', error);
    }
  }
}