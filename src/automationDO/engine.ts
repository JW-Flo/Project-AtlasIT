import { Rule } from './rule';

class MultipleErrors extends Error {
  constructor(public errors: Error[]) {
    super(`Multiple errors occurred: ${errors.map(e => e.message).join(', ')}`);
    this.name = 'MultipleErrors';
  }
}

export class Engine {
  private rules: Rule[] = [];

  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  removeRule(rule: Rule): void {
    const index = this.rules.indexOf(rule);
    if (index > -1) {
      this.rules.splice(index, 1);
    }
  }

  async evaluateAll(context: any): Promise<void> {
    const results = await Promise.allSettled(
      this.rules.map(rule => rule.evaluateAndExecute(context))
    );
    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason);

    if (errors.length > 0) {
      throw new MultipleErrors(errors);
    }
  }
}
