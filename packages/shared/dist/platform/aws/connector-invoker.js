import { InvokeCommand } from "@aws-sdk/client-lambda";
export class LambdaConnectorInvoker {
  client;
  functionPrefix;
  constructor(client, functionPrefix) {
    this.client = client;
    this.functionPrefix = functionPrefix;
  }
  async invoke(workerName, req) {
    const body = await req.text();
    const result = await this.client.send(
      new InvokeCommand({
        FunctionName: `${this.functionPrefix}-${workerName}`,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          httpMethod: req.method,
          path: new URL(req.url).pathname,
          headers: (() => {
            const h = {};
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
//# sourceMappingURL=connector-invoker.js.map
