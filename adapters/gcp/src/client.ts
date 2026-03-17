import type {
  GcpIamPolicy,
  GcpGroupsListResponse,
  GcpMembershipsListResponse,
  GcpGroup,
  GcpMembership,
  ServiceAccountCredentials,
} from "./types.js";

const CRM_BASE = "https://cloudresourcemanager.googleapis.com/v1";
const IDENTITY_BASE = "https://cloudidentity.googleapis.com/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// -- Rate limiting --

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  // GCP uses HTTP 429 for rate limits rather than headers.
  // We track a sliding window locally to pre-empt 429s.
  const retryAfter = headers.get("Retry-After");
  if (retryAfter) {
    const waitSec = parseInt(retryAfter, 10);
    return { remaining: 0, resetAt: Date.now() + waitSec * 1000 };
  }
  return { remaining: 60, resetAt: 0 };
}

async function waitForRateLimit(rateLimit: RateLimitInfo): Promise<void> {
  if (rateLimit.remaining > 1) return;
  const waitMs = Math.max(0, rateLimit.resetAt - Date.now()) + 100;
  if (waitMs > 0 && waitMs < 60_000) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

// -- JWT-based auth for service accounts --

function base64UrlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function textToBase64Url(text: string): string {
  return base64UrlEncode(new TextEncoder().encode(text));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [\w\s]+-----/, "")
    .replace(/-----END [\w\s]+-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function createSignedJwt(
  credentials: ServiceAccountCredentials,
  scopes: string[],
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: scopes.join(" "),
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const headerB64 = textToBase64Url(JSON.stringify(header));
  const payloadB64 = textToBase64Url(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const keyData = pemToArrayBuffer(credentials.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${unsignedToken}.${signatureB64}`;
}

/**
 * Exchange a signed JWT for a GCP access token.
 */
export async function getAccessToken(
  credentials: ServiceAccountCredentials,
  scopes: string[] = [
    "https://www.googleapis.com/auth/cloud-platform.read-only",
    "https://www.googleapis.com/auth/cloud-identity.groups.readonly",
  ],
): Promise<string> {
  const jwt = await createSignedJwt(credentials, scopes);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`GCP token exchange failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

// -- Generic GCP fetch with rate-limit handling --

async function gcpFetch<T>(
  url: string,
  accessToken: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const init: RequestInit = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (response.status === 429) {
    const rateLimit = parseRateLimit(response.headers);
    await waitForRateLimit(rateLimit);
    // Retry once after waiting
    const retryResponse = await fetch(url, init);
    if (!retryResponse.ok) {
      const errorBody = await retryResponse.text().catch(() => "Unknown error");
      throw new Error(`GCP API error (${retryResponse.status}): ${errorBody}`);
    }
    return (await retryResponse.json()) as T;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`GCP API error (${response.status}): ${errorBody}`);
  }

  const rateLimit = parseRateLimit(response.headers);
  await waitForRateLimit(rateLimit);

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// -- Cloud Resource Manager: IAM Policy --

export async function getProjectIamPolicy(
  projectId: string,
  accessToken: string,
): Promise<GcpIamPolicy> {
  const url = `${CRM_BASE}/projects/${encodeURIComponent(projectId)}:getIamPolicy`;
  return gcpFetch<GcpIamPolicy>(url, accessToken, "POST", {
    options: { requestedPolicyVersion: 3 },
  });
}

// -- Cloud Identity: Groups --

export async function listGroups(
  customerId: string,
  accessToken: string,
): Promise<GcpGroup[]> {
  const results: GcpGroup[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      parent: `customers/${customerId}`,
      pageSize: "200",
      view: "FULL",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const url = `${IDENTITY_BASE}/groups?${params.toString()}`;
    const response = await gcpFetch<GcpGroupsListResponse>(url, accessToken);

    if (response.groups) {
      results.push(...response.groups);
    }
    pageToken = response.nextPageToken;
  } while (pageToken);

  return results;
}

export async function listGroupMemberships(
  groupName: string,
  accessToken: string,
): Promise<GcpMembership[]> {
  const results: GcpMembership[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "200",
      view: "FULL",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const url = `${IDENTITY_BASE}/${groupName}/memberships?${params.toString()}`;
    const response = await gcpFetch<GcpMembershipsListResponse>(url, accessToken);

    if (response.memberships) {
      results.push(...response.memberships);
    }
    pageToken = response.nextPageToken;
  } while (pageToken);

  return results;
}
