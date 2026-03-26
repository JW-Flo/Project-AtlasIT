import type { CredentialInput } from "./types";
export declare function storeCredential(
  db: D1Database,
  masterKey: string,
  input: CredentialInput,
): Promise<string>;
export declare function getCredential(
  db: D1Database,
  masterKey: string,
  tenantId: string,
  appId: string,
): Promise<Record<string, string> | null>;
export declare function deleteCredential(
  db: D1Database,
  tenantId: string,
  appId: string,
): Promise<void>;
export declare function listCredentials(
  db: D1Database,
  tenantId: string,
): Promise<
  Array<{
    id: string;
    appId: string;
    healthy: boolean;
    updatedAt: string;
  }>
>;
export declare function rotateCredential(
  db: D1Database,
  masterKey: string,
  tenantId: string,
  appId: string,
  newCredentials: Record<string, string>,
): Promise<void>;
//# sourceMappingURL=store.d.ts.map
