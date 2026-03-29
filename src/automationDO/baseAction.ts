export abstract class BaseAction {
  abstract execute(context: any): Promise<void> | void;
}
