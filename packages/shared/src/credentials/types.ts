export interface StoredCredential {
  id: string;
  tenantId: string;
  appId: string;
  encryptedData: string; // base64 AES-GCM encrypted
  iv: string; // base64 initialization vector
  keyVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialInput {
  tenantId: string;
  appId: string;
  credentials: Record<string, string>; // plaintext key-value pairs
}
