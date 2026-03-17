/**
 * AWS Signature Version 4 implementation for Cloudflare Workers.
 *
 * Uses crypto.subtle (Web Crypto API) — no Node.js dependencies.
 * Reference: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-signing.html
 */

const encoder = new TextEncoder();

// --- Low-level crypto helpers ---

async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  data: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? (key.buffer as ArrayBuffer) : key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return bufferToHex(hash);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// --- Signing key derivation ---

async function deriveSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(
    encoder.encode("AWS4" + secretAccessKey),
    dateStamp,
  );
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

// --- Canonical request construction ---

export interface SignedRequestParams {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
}

function getDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function getAmzDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Build the canonical request string per AWS Sig V4 spec.
 *
 * CanonicalRequest =
 *   HTTPRequestMethod + '\n' +
 *   CanonicalURI + '\n' +
 *   CanonicalQueryString + '\n' +
 *   CanonicalHeaders + '\n' +
 *   SignedHeaders + '\n' +
 *   HexEncode(Hash(RequestPayload))
 */
export function buildCanonicalRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  payloadHash: string,
): { canonical: string; signedHeaders: string } {
  const canonicalUri = url.pathname || "/";

  // Sort query parameters
  const params = Array.from(url.searchParams.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const canonicalQueryString = params
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  // Lowercase header names, sort, trim values
  const headerEntries = Object.entries(headers)
    .map(([k, v]) => [k.toLowerCase(), v.trim()] as const)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders =
    headerEntries.map(([k, v]) => `${k}:${v}`).join("\n") + "\n";
  const signedHeaders = headerEntries.map(([k]) => k).join(";");

  const canonical = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  return { canonical, signedHeaders };
}

/**
 * Build the string-to-sign.
 *
 * StringToSign =
 *   Algorithm + '\n' +
 *   RequestDateTime + '\n' +
 *   CredentialScope + '\n' +
 *   HexEncode(Hash(CanonicalRequest))
 */
export async function buildStringToSign(
  amzDate: string,
  credentialScope: string,
  canonicalRequest: string,
): Promise<string> {
  const hashedCanonical = await sha256Hex(canonicalRequest);
  return ["AWS4-HMAC-SHA256", amzDate, credentialScope, hashedCanonical].join(
    "\n",
  );
}

/**
 * Calculate the final signature.
 */
export async function calculateSignature(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
  stringToSign: string,
): Promise<string> {
  const signingKey = await deriveSigningKey(
    secretAccessKey,
    dateStamp,
    region,
    service,
  );
  const signature = await hmacSha256(signingKey, stringToSign);
  return bufferToHex(signature);
}

/**
 * Sign an HTTP request with AWS Signature V4.
 *
 * Returns the headers map with Authorization, X-Amz-Date, and host populated.
 */
export async function signRequest(
  params: SignedRequestParams,
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = getAmzDate(now);
  const dateStamp = getDateStamp(now);

  const url = new URL(params.url);
  const service = params.service;
  const credentialScope = `${dateStamp}/${params.region}/${service}/aws4_request`;

  // Compute payload hash
  const payloadHash = await sha256Hex(params.body);

  // Build headers for signing (must include host and x-amz-date)
  const headersToSign: Record<string, string> = {
    ...params.headers,
    host: url.host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  const { canonical, signedHeaders } = buildCanonicalRequest(
    params.method,
    url,
    headersToSign,
    payloadHash,
  );

  const stringToSign = await buildStringToSign(
    amzDate,
    credentialScope,
    canonical,
  );

  const signature = await calculateSignature(
    params.secretAccessKey,
    dateStamp,
    params.region,
    service,
    stringToSign,
  );

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${params.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  return {
    ...headersToSign,
    Authorization: authorization,
  };
}
