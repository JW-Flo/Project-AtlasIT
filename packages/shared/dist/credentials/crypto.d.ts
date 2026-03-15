export declare function generateDataKey(): Promise<{
  key: CryptoKey;
  exportedKey: string;
}>;
export declare function encrypt(
  plaintext: string,
  masterKey: string,
): Promise<{
  ciphertext: string;
  iv: string;
}>;
export declare function decrypt(
  ciphertext: string,
  iv: string,
  masterKey: string,
): Promise<string>;
//# sourceMappingURL=crypto.d.ts.map
