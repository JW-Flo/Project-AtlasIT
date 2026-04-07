import { sha256Hex } from "../../../src/lib/canonical-json";

interface TokenRecord {
  tenantId: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface TenantContext {
  tenantId: string;
  roles: string[];
  tokenHash: string;
  rawKey: string;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function resolveTokensNamespace(
  env: Record<string, unknown>,
): KVNamespace | undefined {
  return (env.API_TOKENS ?? env.api_tokens ?? env.apiTokens) as
    | KVNamespace
    | undefined;
}

async function fetchToken(
  env: Record<string, unknown>,
  keyHash: string,
): Promise<TokenRecord | null> {
  const namespace = resolveTokensNamespace(env);
  if (!namespace) return null;
  const stored = await namespace.get(`token:${keyHash}`, { type: "json" });
  if (!stored || typeof stored !== "object") return null;
  return stored as TokenRecord;
}

export async function requireTenant(
  request: Request,
  env: Record<string, unknown>,
  requiredRoles: string[] = [],
): Promise<TenantContext> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    throw new AuthError(401, "Missing API key");
  }

  const namespace = resolveTokensNamespace(env);
  if (!namespace) {
    throw new AuthError(501, "API tokens namespace not configured");
  }

  const hash = await sha256Hex(apiKey);
  const record = await namespace.get(`token:${hash}`, { type: "json" });
  if (!record || typeof record !== "object") {
    throw new AuthError(401, "Invalid API key");
  }
  const token = record as TokenRecord;
  if (!token.tenantId || typeof token.tenantId !== "string") {
    throw new AuthError(403, "Token missing tenant scope");
  }
  const roles = Array.isArray(token.roles) ? (token.roles as string[]) : [];
  for (const required of requiredRoles) {
    if (!roles.includes(required)) {
      throw new AuthError(403, `Token missing role: ${required}`);
    }
  }

  // Service tokens (tenantId: "*") may operate on behalf of any tenant.
  // The actual tenant is specified via x-tenant-id header.
  let resolvedTenantId = token.tenantId;
  if (resolvedTenantId === "*") {
    const headerTenant = request.headers.get("x-tenant-id");
    if (!headerTenant) {
      throw new AuthError(400, "Service token requires x-tenant-id header");
    }
    resolvedTenantId = headerTenant;
  }

  return {
    tenantId: resolvedTenantId,
    roles,
    tokenHash: hash,
    rawKey: apiKey,
  };
}
