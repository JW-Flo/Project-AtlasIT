import { AutomationDO } from './automationDO';
import { WorkflowDO } from './workflowDO';

export class AutonomousLoop {
  private automationDO: AutomationDO;
  private workflowDO: WorkflowDO;

  constructor(automationDO: AutomationDO, workflowDO: WorkflowDO) {
    this.automationDO = automationDO;
    this.workflowDO = workflowDO;
  }

  start(): void {
    // TODO: invoke automationDO and workflowDO on relevant events
  }

  stop(): void {
    // TODO: cleanup
  }
}