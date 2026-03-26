import { SSMClient } from "@aws-sdk/client-ssm";
import type { SecretResolver } from "../interfaces.js";
export declare class SSMSecretResolver implements SecretResolver {
  private readonly client;
  private readonly prefix;
  constructor(client: SSMClient, prefix: string);
  resolve(secretRef: string): Promise<Uint8Array>;
}
//# sourceMappingURL=secret-resolver.d.ts.map
