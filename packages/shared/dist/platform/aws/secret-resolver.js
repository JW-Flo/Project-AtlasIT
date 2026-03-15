import { GetParameterCommand } from "@aws-sdk/client-ssm";
export class SSMSecretResolver {
  client;
  prefix;
  constructor(client, prefix) {
    this.client = client;
    this.prefix = prefix;
  }
  async resolve(secretRef) {
    const result = await this.client.send(
      new GetParameterCommand({
        Name: `${this.prefix}/${secretRef}`,
        WithDecryption: true,
      }),
    );
    if (!result.Parameter?.Value) {
      throw new Error(`Secret not found: ${secretRef}`);
    }
    return new TextEncoder().encode(result.Parameter.Value);
  }
}
//# sourceMappingURL=secret-resolver.js.map
