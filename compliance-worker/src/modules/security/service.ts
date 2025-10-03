// Security & Activity Service Module
// Provides schema initialization and helper functions for security incidents and unified activity events.
// Tables (multi-tenant):
//   security_incidents(id INTEGER PK, tenant_id TEXT, title TEXT, severity TEXT, status TEXT, source TEXT,
//                      created_at TEXT DEFAULT CURRENT_TIMESTAMP, resolved_at TEXT, response_ms INTEGER)
//   activity_events(id INTEGER PK, tenant_id TEXT, type TEXT, severity TEXT, ref TEXT, message TEXT,
//                   created_at TEXT DEFAULT CURRENT_TIMESTAMP)
//   access_requests(id INTEGER PK, tenant_id TEXT, subject_ref TEXT, resource TEXT, justification TEXT,
//                   status TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, decided_at TEXT, decided_by TEXT)
// Indices added for frequent filters (tenant_id, created_at DESC), plus severity/status combos.

export interface SecurityIncident {
  id: number;
  tenant_id: string;
  title: string;
  severity: string; // critical|high|medium|low
  status: string; // open|resolved
  source: string | null;
  created_at: string;
  resolved_at?: string | null;
  response_ms?: number | null;
}

export interface ActivityEvent {
  id: number;
  tenant_id: string;
  type: string; // incident|policy|workflow|access_request|integration
  severity: string | null;
  ref: string | null;
  message: string;
  created_at: string;
}

export interface AccessRequestRecord {
  id: number;
  tenant_id: string;
  subject_ref: string;
  resource: string;
  justification: string | null;
  status: string;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
}

export async function ensureExtendedSchema(db: D1Database) {
  // Idempotent schema creation
  const statements = [
    `CREATE TABLE IF NOT EXISTS security_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      source TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      response_ms INTEGER
    );`,
    `CREATE INDEX IF NOT EXISTS idx_incident_tenant_created ON security_incidents(tenant_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_incident_status ON security_incidents(status);`,
    `CREATE INDEX IF NOT EXISTS idx_incident_severity ON security_incidents(severity);`,
    `CREATE TABLE IF NOT EXISTS activity_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT,
      ref TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE INDEX IF NOT EXISTS idx_activity_tenant_created ON activity_events(tenant_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_events(type);`,
    `CREATE TABLE IF NOT EXISTS access_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      subject_ref TEXT NOT NULL,
      resource TEXT NOT NULL,
      justification TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      decided_at TEXT,
      decided_by TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_access_tenant_created ON access_requests(tenant_id, created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_access_status ON access_requests(status);`,
  ];

  // Some runtimes (tests/mocks) may not implement db.batch; fall back to sequential execution.
  const anyDb: any = db as any;
  if (typeof anyDb.batch === "function") {
    await anyDb.batch(statements.map((sql: string) => db.prepare(sql)));
    return;
  }
  for (const sql of statements) {
    try {
      await db.prepare(sql).run();
    } catch (e) {
      // Swallow individual statement errors to keep idempotence; log minimal info in real env
      // (No logging import here to avoid circular dependency.)
    }
  }
}

export async function recordActivityEvent(
  db: D1Database,
  evt: {
    tenantId: string;
    type: string;
    message: string;
    severity?: string;
    ref?: string;
  },
) {
  await db
    .prepare(
      `INSERT INTO activity_events (tenant_id, type, severity, ref, message) VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      evt.tenantId,
      evt.type,
      evt.severity || null,
      evt.ref || null,
      evt.message,
    )
    .run();
}

export async function createAccessRequest(
  db: D1Database,
  data: {
    tenantId: string;
    subjectRef: string;
    resource: string;
    justification?: string | null;
    createdBy?: string | null;
  },
): Promise<AccessRequestRecord | null> {
  const inserted = await db
    .prepare(
      `INSERT INTO access_requests (tenant_id, subject_ref, resource, justification) VALUES (?, ?, ?, ?)`,
    )
    .bind(
      data.tenantId,
      data.subjectRef,
      data.resource,
      data.justification ?? null,
    )
    .run();
  const id =
    inserted.meta && typeof inserted.meta.last_row_id === "number"
      ? inserted.meta.last_row_id
      : undefined;
  if (id == null) return null;
  return await db
    .prepare(
      `SELECT * FROM access_requests WHERE tenant_id = ? AND id = ? LIMIT 1`,
    )
    .bind(data.tenantId, id)
    .first<AccessRequestRecord>();
}

export async function listAccessRequests(
  db: D1Database,
  tenantId: string,
  opts: { status?: string; limit?: number; cursor?: number },
): Promise<{ items: AccessRequestRecord[]; nextCursor: number | null }> {
  const limit = Math.min(Math.max(opts.limit || 20, 1), 50) + 1;
  const conditions: string[] = ["tenant_id = ?"];
  const binds: any[] = [tenantId];
  if (opts.status) {
    conditions.push("status = ?");
    binds.push(opts.status);
  }
  if (opts.cursor) {
    conditions.push("id < ?");
    binds.push(opts.cursor);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const stmt = await db
    .prepare(`SELECT * FROM access_requests ${where} ORDER BY id DESC LIMIT ?`)
    .bind(...binds, limit)
    .all<AccessRequestRecord>();
  const rows = (stmt as any)?.results || [];
  const hasNext = rows.length > limit - 1;
  const sliced = hasNext ? rows.slice(0, limit - 1) : rows;
  const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
  return { items: sliced, nextCursor };
}

const ACCESS_TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(["approved", "denied"]),
  approved: new Set(["fulfilled"]),
};

export async function updateAccessRequestStatus(
  db: D1Database,
  opts: {
    tenantId: string;
    id: number;
    nextStatus: "approved" | "denied" | "fulfilled";
    decidedBy?: string;
  },
): Promise<AccessRequestRecord | null> {
  const current = await db
    .prepare(
      `SELECT * FROM access_requests WHERE id = ? AND tenant_id = ? LIMIT 1`,
    )
    .bind(opts.id, opts.tenantId)
    .first<AccessRequestRecord>();
  if (!current) return null;

  const allowed = ACCESS_TRANSITIONS[current.status] || new Set<string>();
  if (!allowed.has(opts.nextStatus)) {
    throw new Error("access.invalid_transition");
  }

  const decidedBy = opts.decidedBy ?? current.decided_by ?? "system";

  if (opts.nextStatus === "approved" || opts.nextStatus === "denied") {
    await db
      .prepare(
        `UPDATE access_requests SET status = ?, decided_at = CURRENT_TIMESTAMP, decided_by = ? WHERE id = ? AND tenant_id = ?`,
      )
      .bind(opts.nextStatus, decidedBy, opts.id, opts.tenantId)
      .run();
  } else if (opts.nextStatus === "fulfilled") {
    await db
      .prepare(
        `UPDATE access_requests SET status = ?, decided_at = CASE WHEN decided_at IS NULL THEN CURRENT_TIMESTAMP ELSE decided_at END, decided_by = COALESCE(decided_by, ?) WHERE id = ? AND tenant_id = ?`,
      )
      .bind(opts.nextStatus, decidedBy, opts.id, opts.tenantId)
      .run();
  }

  return await db
    .prepare(
      `SELECT * FROM access_requests WHERE id = ? AND tenant_id = ? LIMIT 1`,
    )
    .bind(opts.id, opts.tenantId)
    .first<AccessRequestRecord>();
}

export async function createSecurityIncident(
  db: D1Database,
  data: {
    tenantId: string;
    title: string;
    severity: string;
    source?: string | null;
  },
) {
  const inserted = await db
    .prepare(
      `INSERT INTO security_incidents (tenant_id, title, severity, source) VALUES (?, ?, ?, ?)`,
    )
    .bind(data.tenantId, data.title, data.severity, data.source || null)
    .run();
  const id =
    inserted.meta && typeof inserted.meta.last_row_id === "number"
      ? inserted.meta.last_row_id
      : undefined;
  if (id == null) return null;
  return await getIncident(db, data.tenantId, id);
}

export async function resolveSecurityIncident(
  db: D1Database,
  tenantId: string,
  id: number,
) {
  const startRow = await db
    .prepare(
      `SELECT created_at FROM security_incidents WHERE id = ? AND tenant_id = ? LIMIT 1`,
    )
    .bind(id, tenantId)
    .first<{ created_at: string }>();
  await db
    .prepare(
      `UPDATE security_incidents SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, response_ms = CASE WHEN response_ms IS NULL AND ? IS NOT NULL THEN (strftime('%s','now') - strftime('%s', ?)) * 1000 ELSE response_ms END WHERE id = ? AND tenant_id = ?`,
    )
    .bind(
      startRow?.created_at || null,
      startRow?.created_at || null,
      id,
      tenantId,
    )
    .run();
  return await getIncident(db, tenantId, id);
}

export async function getIncident(
  db: D1Database,
  tenantId: string,
  id: number,
) {
  return await db
    .prepare(
      `SELECT * FROM security_incidents WHERE id = ? AND tenant_id = ? LIMIT 1`,
    )
    .bind(id, tenantId)
    .first<SecurityIncident>();
}

export async function listIncidents(
  db: D1Database,
  tenantId: string,
  opts: { status?: string; severity?: string; limit?: number; cursor?: number },
) {
  const limit = Math.min(Math.max(opts.limit || 20, 1), 50) + 1; // fetch one extra for pagination
  const conditions: string[] = ["tenant_id = ?"];
  const binds: any[] = [tenantId];
  if (opts.status) {
    conditions.push("status = ?");
    binds.push(opts.status);
  }
  if (opts.severity) {
    conditions.push("severity = ?");
    binds.push(opts.severity);
  }
  if (opts.cursor) {
    conditions.push("id < ?");
    binds.push(opts.cursor);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const stmt = await db
    .prepare(
      `SELECT * FROM security_incidents ${where} ORDER BY id DESC LIMIT ?`,
    )
    .bind(...binds, limit)
    .all<SecurityIncident>();
  const rows = (stmt as any)?.results || [];
  const hasNext = rows.length > limit - 1;
  const sliced = hasNext ? rows.slice(0, limit - 1) : rows;
  const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
  return { items: sliced, nextCursor };
}

export async function listActivity(
  db: D1Database,
  tenantId: string,
  opts: { type?: string; limit?: number; cursor?: number },
) {
  const limit = Math.min(Math.max(opts.limit || 25, 1), 100) + 1;
  const conditions: string[] = ["tenant_id = ?"];
  const binds: any[] = [tenantId];
  if (opts.type) {
    conditions.push("type = ?");
    binds.push(opts.type);
  }
  if (opts.cursor) {
    conditions.push("id < ?");
    binds.push(opts.cursor);
  }
  const where = `WHERE ${conditions.join(" AND ")}`;
  const stmt = await db
    .prepare(`SELECT * FROM activity_events ${where} ORDER BY id DESC LIMIT ?`)
    .bind(...binds, limit)
    .all<ActivityEvent>();
  const rows = (stmt as any)?.results || [];
  const hasNext = rows.length > limit - 1;
  const sliced = hasNext ? rows.slice(0, limit - 1) : rows;
  const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
  return { items: sliced, nextCursor };
}

export async function summarizeSecurity(db: D1Database, tenantId: string) {
  // Query open and resolved counts
  const counts = await db
    .prepare(
      `SELECT 
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count
      FROM security_incidents WHERE tenant_id = ?`,
    )
    .bind(tenantId)
    .first<{ open_count: number; resolved_count: number }>();

  // Query average response_ms
  const avg = await db
    .prepare(
      `SELECT AVG(response_ms) AS avg_response_ms FROM security_incidents WHERE tenant_id = ? AND response_ms IS NOT NULL`,
    )
    .bind(tenantId)
    .first<{ avg_response_ms: number | null }>();

  // Query open critical and high incidents
  const openSeverities = await db
    .prepare(
      `SELECT 
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_open,
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) AS high_open
      FROM security_incidents WHERE tenant_id = ? AND status = 'open'`,
    )
    .bind(tenantId)
    .first<{ critical_open: number; high_open: number }>();

  const openIncidents = counts?.open_count ?? 0;
  const resolvedIncidents = counts?.resolved_count ?? 0;
  const avgResponseMsRaw =
    avg?.avg_response_ms != null ? Number(avg.avg_response_ms) : null;
  const avgResponseMs =
    avgResponseMsRaw != null && Number.isFinite(avgResponseMsRaw)
      ? Math.round(avgResponseMsRaw)
      : null;
  const criticalOpen = openSeverities?.critical_open ?? 0;
  const highOpen = openSeverities?.high_open ?? 0;

  let threatLevel: "normal" | "elevated" | "critical" = "normal";
  let basis = "baseline";

  if (criticalOpen > 0) {
    threatLevel = "critical";
    basis = `critical_open=${criticalOpen}`;
  } else if (highOpen >= 2) {
    threatLevel = "elevated";
    basis = `high_open=${highOpen}`;
  } else if (
    highOpen >= 1 &&
    avgResponseMs != null &&
    avgResponseMs > 10 * 60 * 1000
  ) {
    threatLevel = "elevated";
    basis = `high_open=${highOpen},avg_response_ms=${avgResponseMs}`;
  } else {
    basis = `high_open=${highOpen}`;
    if (avgResponseMs != null) {
      basis += `,avg_response_ms=${avgResponseMs}`;
    }
  }

  return {
    threatLevel,
    threatBasis: basis,
    basis,
    openIncidents,
    resolvedIncidents,
    avgResponseMs,
  };
}
