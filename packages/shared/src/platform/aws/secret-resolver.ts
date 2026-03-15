import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import type { SecretResolver } from "../interfaces.js";

export class SSMSecretResolver implements SecretResolver {
  constructor(
    private readonly client: SSMClient,
    private readonly prefix: string,
  ) {}

  async resolve(secretRef: string): Promise<Uint8Array> {
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
