import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import type { ConnectorInvoker } from "../interfaces.js";

export class LambdaConnectorInvoker implements ConnectorInvoker {
  constructor(
    private readonly client: LambdaClient,
    private readonly functionPrefix: string,
  ) {}

  async invoke(workerName: string, req: Request): Promise<Response> {
    const body = await req.text();

    const result = await this.client.send(
      new InvokeCommand({
        FunctionName: `${this.functionPrefix}-${workerName}`,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          httpMethod: req.method,
          path: new URL(req.url).pathname,
          headers: (() => {
            const h: Record<string, string> = {};
            req.headers.forEach((v, k) => {
              h[k] = v;
            });
            return h;
          })(),
          body,
        }),
      }),
    );

    const payload = JSON.parse(new TextDecoder().decode(result.Payload));
    return new Response(payload.body ?? "", {
      status: payload.statusCode ?? 200,
      headers: payload.headers ?? {},
    });
  }
}
