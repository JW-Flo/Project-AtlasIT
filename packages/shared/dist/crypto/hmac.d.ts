export declare function signPayload(
  payload: string,
  secret: string,
): Promise<string>;
export declare function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean>;
//# sourceMappingURL=hmac.d.ts.map
