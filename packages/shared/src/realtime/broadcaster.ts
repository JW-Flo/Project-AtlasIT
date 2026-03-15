export interface BroadcastMessage {
  type: string;
  payload: unknown;
}

export interface Broadcaster {
  broadcast(tenantId: string, message: BroadcastMessage): Promise<void>;
}
