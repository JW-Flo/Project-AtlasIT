import { LambdaClient } from "@aws-sdk/client-lambda";
import type { ConnectorInvoker } from "../interfaces.js";
export declare class LambdaConnectorInvoker implements ConnectorInvoker {
  private readonly client;
  private readonly functionPrefix;
  constructor(client: LambdaClient, functionPrefix: string);
  invoke(workerName: string, req: Request): Promise<Response>;
}
//# sourceMappingURL=connector-invoker.d.ts.map
