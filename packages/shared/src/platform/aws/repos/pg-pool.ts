/**
 * Shared PostgreSQL connection pool — singleton across Lambda warm invocations.
 *
 * Supports two modes:
 *   1. Static DATABASE_URL (existing behavior, no Secrets Manager dependency)
 *   2. Secrets Manager rotation — set RDS_SECRET_ARN env var and the pool
 *      fetches the current password at startup + every 15 min.
 *
 * Usage:
 *   import { getPool } from "@atlasit/shared/platform/aws/repos/pg-pool.js";
 *   const pool = getPool();
 *   const result = await pool.query("SELECT ...", [...]);
 */

import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

// Cached secret for rotation-safe connections
let _cachedSecret: { password: string; fetchedAt: number } | null = null;
const SECRET_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface RdsSecret {
  username: string;
  password: string;
  engine: string;
  host: string;
  port: number;
  dbname: string;
}

async function fetchRdsPassword(secretArn: string): Promise<string> {
  const now = Date.now();
  if (_cachedSecret && now - _cachedSecret.fetchedAt < SECRET_CACHE_TTL) {
    return _cachedSecret.password;
  }

  const { SecretsManagerClient, GetSecretValueCommand } =
    await import("@aws-sdk/client-secrets-manager");
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || "us-east-1" });
  const resp = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));

  if (!resp.SecretString) {
    throw new Error("RDS secret has no SecretString");
  }

  const secret: RdsSecret = JSON.parse(resp.SecretString);
  _cachedSecret = { password: secret.password, fetchedAt: now };
  return secret.password;
}

export function getPool(): pg.Pool {
  if (!_pool) {
    const secretArn = process.env.RDS_SECRET_ARN;

    if (secretArn) {
      // Rotation-safe mode: create pool with async password callback
      // Parse host/port/dbname from existing DATABASE_URL for initial connection
      const dbUrl = process.env.DATABASE_URL || "";
      const parsed = parseDbUrl(dbUrl);

      _pool = new Pool({
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
        user: parsed.user,
        password: () => fetchRdsPassword(secretArn),
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      // Static mode: use DATABASE_URL as-is
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: { rejectUnauthorized: false },
      });
    }

    // Warm the pool
    _pool
      .connect()
      .then((c) => c.release())
      .catch(() => {});
  }
  return _pool;
}

function parseDbUrl(url: string): { host: string; port: number; database: string; user: string } {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port || "5432", 10),
      database: u.pathname.replace(/^\//, ""),
      user: u.username,
    };
  } catch {
    return { host: "localhost", port: 5432, database: "atlasit", user: "atlasit_app" };
  }
}

/**
 * Force the pool to reconnect with a fresh secret.
 * Call this if you detect an auth failure that might be caused by rotation.
 */
export async function refreshPool(): Promise<void> {
  _cachedSecret = null;
  if (_pool) {
    await _pool.end().catch(() => {});
    _pool = null;
  }
  getPool();
}
