/**
 * PostgreSQL-backed audit repo — replaces D1 audit_log queries.
 * Uses pg (node-postgres) with DATABASE_URL from environment.
 */

import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return _pool;
}

export interface AuditEntry {
  id: string;
  tenantId: string;
  actorId?: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  correlationId?: string;
  createdAt: string;
}

export class PgAuditRepo {
  async log(entry: Omit<AuditEntry, "id" | "createdAt">): Promise<string> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO audit_log (id, tenant_id, actor_id, actor_type, action, resource_type, resource_id, details, ip_address, correlation_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        entry.tenantId,
        entry.actorId ?? null,
        entry.actorType,
        entry.action,
        entry.resourceType,
        entry.resourceId ?? null,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ipAddress ?? null,
        entry.correlationId ?? null,
      ],
    );
    return result.rows[0].id;
  }

  async list(
    tenantId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<AuditEntry[]> {
    const pool = getPool();
    const { limit = 50, offset = 0 } = opts;
    const result = await pool.query(
      `SELECT id, tenant_id as "tenantId", actor_id as "actorId", actor_type as "actorType",
              action, resource_type as "resourceType", resource_id as "resourceId",
              details, ip_address as "ipAddress", correlation_id as "correlationId",
              created_at as "createdAt"
       FROM audit_log
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
    return result.rows;
  }
}
