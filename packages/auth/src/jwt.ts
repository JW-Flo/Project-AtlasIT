import {
  verifyJWT as baseVerify,
  createJWT as baseCreate,
} from "@atlasit/edge-utils";
import type { AuthUser } from "./types";

interface TokenClaims {
  sub: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
  iss?: string;
  aud?: string;
  exp?: number;
}

export async function signUser(
  user: AuthUser,
  secret: string,
  opts: { expiresInSec?: number; iss?: string; aud?: string } = {},
) {
  const exp = Math.floor(Date.now() / 1000) + (opts.expiresInSec ?? 3600);
  return baseCreate(
    {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roles: user.roles,
      iss: opts.iss,
      aud: opts.aud,
      exp,
    },
    secret,
  );
}

export async function verifyToken(
  token: string,
  secret: string,
  expected?: { iss?: string; aud?: string },
) {
  const payload = (await baseVerify(token, secret)) as TokenClaims;
  if (expected?.iss && payload.iss !== expected.iss)
    throw new Error("issuer mismatch");
  if (expected?.aud && payload.aud !== expected.aud)
    throw new Error("audience mismatch");
  const user: AuthUser = {
    id: payload.sub,
    email: payload.email,
    tenantId: payload.tenantId,
    roles: payload.roles,
  };
  return user;
}

// Backwards compatibility alias
export const verifyJWT = verifyToken;
