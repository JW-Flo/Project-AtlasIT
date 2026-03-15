import type { EventBridgeEvent } from "aws-lambda";

export async function handler(
  event: EventBridgeEvent<string, unknown>,
): Promise<void> {
  // TODO: Implement scheduled tasks
  console.log("Scheduler invoked", event);
}
