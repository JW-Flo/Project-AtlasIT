export interface StoredCredential {
  id: string;
  tenantId: string;
  appId: string;
  encryptedData: string;
  iv: string;
  keyVersion: number;
  createdAt: string;
  updatedAt: string;
}
export interface CredentialInput {
  tenantId: string;
  appId: string;
  credentials: Record<string, string>;
}
//# sourceMappingURL=types.d.ts.map
