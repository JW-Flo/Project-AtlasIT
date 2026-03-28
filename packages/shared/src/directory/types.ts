/**
 * Non-Human Identity (NHI) Governance Types
 *
 * Extends the directory model to track service accounts, API keys, bot users,
 * and OAuth grants discovered across connected adapters. Each NHI has a
 * directory_users entry (with identity_type != 'human') plus NHI-specific
 * credential metadata in nhi_credentials.
 */

// ── Identity Types ───────────────────────────────────────────────────────────

export type IdentityType = "human" | "service" | "bot" | "api_key" | "oauth_grant";

export type NhiCredentialType =
  | "service_account"
  | "api_key"
  | "deploy_key"
  | "oauth_app"
  | "bot_token"
  | "access_key";

export type NhiStatus = "active" | "expired" | "revoked" | "rotation_pending";

// ── NHI Credential (D1 row shape, camelCase) ─────────────────────────────────

export interface NhiCredential {
  id: string;
  tenantId: string;
  directoryUserId: string;
  credentialType: NhiCredentialType;
  provider: string;
  externalId: string;
  displayName: string;
  ownerEmail: string | null;
  scopes: string[];
  permissions: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastRotatedAt: string | null;
  riskScore: number;
  riskFactors: RiskFactor[];
  status: NhiStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Discovery ────────────────────────────────────────────────────────────────

export interface NhiDiscoveryResult {
  provider: string;
  identities: DiscoveredNhi[];
  discoveredAt: string;
}

export interface DiscoveredNhi {
  externalId: string;
  displayName: string;
  identityType: IdentityType;
  credentialType: NhiCredentialType;
  ownerEmail?: string;
  scopes?: string[];
  permissions?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  lastRotatedAt?: string;
  metadata?: Record<string, unknown>;
}

// ── Risk Scoring ─────────────────────────────────────────────────────────────

export type RiskFactor =
  | "no_expiry"
  | "expired"
  | "expiring_soon"
  | "no_owner"
  | "overprivileged"
  | "stale"
  | "never_rotated"
  | "rotation_overdue";

const RISK_WEIGHTS: Record<RiskFactor, number> = {
  no_expiry: 15,
  expired: 25,
  expiring_soon: 10,
  no_owner: 20,
  overprivileged: 20,
  stale: 10,
  never_rotated: 10,
  rotation_overdue: 15,
};

/**
 * Compute a 0–100 risk score from a set of risk factors.
 * Each factor contributes a weighted amount; the total is capped at 100.
 */
export function computeRiskScore(factors: RiskFactor[]): number {
  const total = factors.reduce((sum, f) => sum + (RISK_WEIGHTS[f] ?? 0), 0);
  return Math.min(100, total);
}

/**
 * Detect risk factors for an NHI credential based on its current state.
 */
export function detectRiskFactors(cred: {
  expiresAt?: string | null;
  ownerEmail?: string | null;
  lastUsedAt?: string | null;
  lastRotatedAt?: string | null;
  scopes?: string[];
  createdAt?: string;
}): RiskFactor[] {
  const now = Date.now();
  const factors: RiskFactor[] = [];

  if (!cred.expiresAt) {
    factors.push("no_expiry");
  } else {
    const expiryMs = new Date(cred.expiresAt).getTime();
    if (expiryMs <= now) {
      factors.push("expired");
    } else if (expiryMs - now < 30 * 24 * 60 * 60 * 1000) {
      factors.push("expiring_soon");
    }
  }

  if (!cred.ownerEmail) {
    factors.push("no_owner");
  }

  if (cred.scopes?.some((s) => /admin|full|write.*all|\*/i.test(s))) {
    factors.push("overprivileged");
  }

  if (cred.lastUsedAt) {
    const lastUsed = new Date(cred.lastUsedAt).getTime();
    if (now - lastUsed > 90 * 24 * 60 * 60 * 1000) {
      factors.push("stale");
    }
  }

  if (!cred.lastRotatedAt) {
    if (cred.createdAt) {
      const created = new Date(cred.createdAt).getTime();
      if (now - created > 30 * 24 * 60 * 60 * 1000) {
        factors.push("never_rotated");
      }
    }
  } else {
    const rotatedAt = new Date(cred.lastRotatedAt).getTime();
    if (now - rotatedAt > 90 * 24 * 60 * 60 * 1000) {
      factors.push("rotation_overdue");
    }
  }

  return factors;
}

// ── NHI Audit Log ────────────────────────────────────────────────────────────

export type NhiAuditAction =
  | "discovered"
  | "rotated"
  | "expired"
  | "revoked"
  | "owner_changed"
  | "risk_changed";

export interface NhiAuditEntry {
  id: string;
  tenantId: string;
  credentialId: string;
  action: NhiAuditAction;
  actor: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}
