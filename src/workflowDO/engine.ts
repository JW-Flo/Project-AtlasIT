import { Workflow } from './workflow';
import { StateStore } from './state/store';
import { Step } from './steps/step';

/**
 * Manages persistent workflow execution with checkpointing and recovery.
 * Stores workflow state after each step to enable recovery from failures.
 */
export class WorkflowEngine {
  private store: StateStore;

  constructor(store: StateStore) {
    this.store = store;
  }

  /**
   * Executes a workflow from start to finish with automatic checkpointing.
   * Resumes from the last checkpoint if workflow state exists.
   * @param workflow - The workflow to execute
   * @throws If any step execution fails
   */
  async executeWorkflow(workflow: Workflow): Promise<void> {
    const workflowId = workflow.id;
    let savedState = await this.store.loadState(workflowId);
    let context: any = {};
    let startStepIndex = 0;

    if (savedState && typeof savedState === 'object') {
      context = savedState.context || {};
      startStepIndex = savedState.currentStepIndex ?? 0;
    }

    const steps = workflow.steps;
    for (let i = startStepIndex; i < steps.length; i++) {
      const step = steps[i];
      try {
        context = await step.execute(context);
        await this.checkpoint(workflowId, i + 1, context);
      } catch (error) {
        await this.checkpoint(workflowId, i, context);
        throw new Error(`Workflow step ${i} failed: ${error.message}`);
      }
    }

    await this.store.saveState(workflowId, null);
  }

  /**
   * Saves workflow execution state as a checkpoint.
   * @param workflowId - Unique identifier of the workflow
   * @param nextStepIndex - Index of the next step to execute
   * @param context - Current workflow context/data
   */
  private async checkpoint(
    workflowId: string,
    nextStepIndex: number,
    context: any
  ): Promise<void> {
    const state = {
      currentStepIndex: nextStepIndex,
      context,
      timestamp: Date.now()
    };
    await this.store.saveState(workflowId, state);
  }

  /**
   * Retrieves the latest checkpoint state for a workflow.
   * @param workflowId - Unique identifier of the workflow
   * @returns The saved state or null if none exists
   */
  async getState(workflowId: string): Promise<any | null> {
    return await this.store.loadState(workflowId);
  }

  /**
   * Clears the saved state for a workflow (typically after completion).
   * @param workflowId - Unique identifier of the workflow
   */
  async clearState(workflowId: string): Promise<void> {
    await this.store.saveState(workflowId, null);
  }
}
