import { StateStore } from './state/store';
import { Step } from './steps/step';

interface WorkflowState {
  id: string;
  currentStepIndex: number;
  data: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'checkpointed';
  checkpointTimestamp: number | null;
}

export class Workflow {
  private id: string;
  private stateStore: StateStore;
  private state: WorkflowState;
  private steps: Step[];

  constructor(id: string, stateStore: StateStore, initialData: Record<string, unknown> = {}) {
    this.id = id;
    this.stateStore = stateStore;
    this.steps = [];
    this.state = {
      id,
      currentStepIndex: 0,
      data: initialData,
      status: 'pending',
      checkpointTimestamp: null
    };
  }

  addStep(step: Step): void {
    this.steps.push(step);
  }

  async initialize(): Promise<void> {
    const savedState = await this.stateStore.load(this.id);
    if (savedState) {
      this.state = savedState;
      this.state.status = 'recovered';
    } else {
      await this.stateStore.save(this.state);
    }
  }

  async executeNextStep(): Promise<boolean> {
    if (this.state.currentStepIndex >= this.steps.length) {
      this.state.status = 'completed';
      await this.stateStore.save(this.state);
      return false;
    }

    try {
      this.state.status = 'running';
      await this.stateStore.save(this.state);

      const step = this.steps[this.state.currentStepIndex];
      await step.execute(this.state.data);

      this.state.currentStepIndex++;
      this.state.status = 'checkpointed';
      await this.checkpoint();
      return true;
    } catch (error) {
      this.state.status = 'failed';
      await this.stateStore.save(this.state);
      throw error;
    }
  }

  async checkpoint(): Promise<void> {
    this.state.checkpointTimestamp = Date.now();
    await this.stateStore.save(this.state);
  }

  async recover(): Promise<boolean> {
    const savedState = await this.stateStore.load(this.id);
    if (!savedState) return false;
    
    this.state = savedState;
    return true;
  }

  getState(): WorkflowState {
    return { ...this.state };

  }

  isCompleted(): boolean {
    return this.state.status === 'completed';
  }

  isFailed(): boolean {
    return this.state.status === 'failed';
  }

  getCurrentStepIndex(): number {
    return this.state.currentStepIndex;
  }
}
