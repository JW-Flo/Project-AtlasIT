export interface Queue {
  send(message: unknown): Promise<void>;
}
