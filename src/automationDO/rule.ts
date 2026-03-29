import { BaseCondition } from './baseCondition';
import { BaseAction } from './baseAction';

export class Rule {
  constructor(
    private condition: BaseCondition,
    private action: BaseAction
  ) {}

  async evaluateAndExecute(context: any): Promise<void> {
    if (this.condition.evaluate(context)) {
      const result = this.action.execute(context);
      if (result instanceof Promise) {
        await result;
      }
    }
  }
}
