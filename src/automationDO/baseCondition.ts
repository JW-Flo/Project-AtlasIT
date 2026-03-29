export abstract class BaseCondition {
  abstract evaluate(context: any): boolean;
}
