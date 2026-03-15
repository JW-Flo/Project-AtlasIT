import type { ConnectorManifest } from "../../../connector-schema/src/manifest.js";

function generateOAuth2Auth(manifest: ConnectorManifest): string {
  if (manifest.auth.model !== "oauth2") {
    throw new Error("Expected oauth2 auth model");
  }

  const {
    authorizationUrl,
    tokenUrl,
    scopes,
    clientIdEnvVar,
    clientSecretEnvVar,
    pkce,
  } = manifest.auth.oauth2;

  return `import type { Context, Next } from "hono";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

const AUTHORIZATION_URL = "${authorizationUrl}";
const TOKEN_URL = "${tokenUrl}";
const SCOPES = ${JSON.stringify(scopes)};
const PKCE_ENABLED = ${pkce};

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, "-")
    .replace(/\\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\\+/g, "-")
    .replace(/\\//g, "_")
    .replace(/=+$/, "");
}

export function getAuthorizationUrl(env: Record<string, string>, state: string): string {
  const params = new URLSearchParams({
    client_id: env.${clientIdEnvVar},
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  });

  if (PKCE_ENABLED) {
    // In production, generate and store code_verifier per request
    params.set("code_challenge_method", "S256");
  }

  return \`\${AUTHORIZATION_URL}?\${params.toString()}\`;
}

export async function exchangeCodeForToken(
  env: Record<string, string>,
  code: string,
  codeVerifier?: string,
): Promise<TokenResponse> {
  const body: Record<string, string> = {
    grant_type: "authorization_code",
    client_id: env.${clientIdEnvVar},
    client_secret: env.${clientSecretEnvVar},
    redirect_uri: env.OAUTH2_REDIRECT_URI,
    code,
  };

  if (PKCE_ENABLED && codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`Token exchange failed (\${response.status}): \${errorText}\`);
  }

  return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(
  env: Record<string, string>,
  refreshToken: string,
): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.${clientIdEnvVar},
      client_secret: env.${clientSecretEnvVar},
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`Token refresh failed (\${response.status}): \${errorText}\`);
  }

  return response.json() as Promise<TokenResponse>;
}
`;
}

function generateApiKeyAuth(manifest: ConnectorManifest): string {
  if (manifest.auth.model !== "api_key") {
    throw new Error("Expected api_key auth model");
  }

  const { headerName, prefix, envVar } = manifest.auth.apiKey;
  const headerValue = prefix ? `\`${prefix} \${apiKey}\`` : "apiKey";

  return `import type { Context, Next } from "hono";

const HEADER_NAME = "${headerName}";
const HEADER_PREFIX = ${prefix ? `"${prefix}"` : "undefined"};

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
}

export function injectApiKeyHeaders(env: Record<string, string>): Record<string, string> {
  const apiKey = env.${envVar};
  if (!apiKey) {
    throw new Error("API key not configured: ${envVar}");
  }

  return {
    "${headerName}": ${headerValue},
  };
}

export function createAuthenticatedFetch(env: Record<string, string>): typeof fetch {
  const headers = injectApiKeyHeaders(env);
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const mergedInit = {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers ?? {}),
      },
    };
    return fetch(input, mergedInit);
  };
}
`;
}

function generateSamlAuth(_manifest: ConnectorManifest): string {
  return `import type { Context, Next } from "hono";

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
}

export function getSamlMetadataEndpoint(): string {
  return "/saml/metadata";
}

export function getAssertionConsumerServiceUrl(baseUrl: string): string {
  return \`\${baseUrl}/saml/acs\`;
}

export function parseSamlResponse(_samlResponse: string): Record<string, unknown> {
  // SAML response parsing — implement with XML parser in production
  throw new Error("SAML response parsing not yet implemented");
}
`;
}

function generateServiceAccountAuth(_manifest: ConnectorManifest): string {
  return `import type { Context, Next } from "hono";

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }
  await next();
}

export function loadServiceAccountCredentials(env: Record<string, string>): Record<string, string> {
  const credentialsJson = env.SERVICE_ACCOUNT_CREDENTIALS;
  if (!credentialsJson) {
    throw new Error("SERVICE_ACCOUNT_CREDENTIALS not configured");
  }

  try {
    return JSON.parse(credentialsJson) as Record<string, string>;
  } catch {
    throw new Error("SERVICE_ACCOUNT_CREDENTIALS contains invalid JSON");
  }
}
`;
}

function generateNoAuth(): string {
  return `// No authentication required for this connector
export {};
`;
}

export function generateAuthTemplate(manifest: ConnectorManifest): string {
  switch (manifest.auth.model) {
    case "oauth2":
      return generateOAuth2Auth(manifest);
    case "api_key":
      return generateApiKeyAuth(manifest);
    case "saml":
      return generateSamlAuth(manifest);
    case "service_account":
      return generateServiceAccountAuth(manifest);
    case "none":
      return generateNoAuth();
  }
}
