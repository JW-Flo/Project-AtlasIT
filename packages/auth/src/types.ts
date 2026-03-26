export interface AuthUser {
  id: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
}

export interface SessionData {
  id: string;
  user: AuthUser;
  issuedAt: number;
  expiresAt: number;
  revokedAt?: number | null;
  ip?: string | null;
  userAgent?: string | null;
}
