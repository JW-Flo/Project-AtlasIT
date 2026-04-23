import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

let _cachedSecret: { password: string; fetchedAt: number } | null = null;
const SECRET_CACHE_TTL = 15 * 60 * 1000;

interface RdsSecret {
  username: string;
  password: string;
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
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || process.env.AWS_REGION_APP || "us-east-1",
  });
  const resp = await client.send(new GetSecretValueCommand({ SecretId: secretArn }));

  if (!resp.SecretString) {
    throw new Error("RDS secret has no SecretString");
  }

  const secret: RdsSecret = JSON.parse(resp.SecretString);
  _cachedSecret = { password: secret.password, fetchedAt: now };
  return secret.password;
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

export function getPgPool(): pg.Pool {
  if (!_pool) {
    const secretArn = process.env.RDS_SECRET_ARN;
    const dbUrl = process.env.DATABASE_URL;

    if (secretArn && dbUrl) {
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
    } else if (dbUrl) {
      _pool = new Pool({
        connectionString: dbUrl,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
        ssl: { rejectUnauthorized: false },
      });
    } else {
      throw new Error("DATABASE_URL not configured");
    }

    _pool
      .connect()
      .then((c) => c.release())
      .catch(() => {});
  }
  return _pool;
}

export async function queryPg<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const pool = getPgPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export async function queryPgOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await queryPg<T>(sql, params);
  return rows[0] ?? null;
}
