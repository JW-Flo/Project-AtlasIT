import { json } from '@sveltejs/kit';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';
import { w as writeAudit } from './audit-DeKPFK-8.js';
import { t as toCamel } from './dto-qzAL3BiV.js';
import './gap-analyzer-CVZTZ0l9.js';
import './pg-BHX2Ay11.js';
import 'events';
import 'util';
import 'crypto';
import 'dns';
import 'fs';
import 'net';
import 'tls';
import 'path';
import 'stream';
import 'string_decoder';

const GET = async ({ url, locals, platform }) => {
  const user = locals.user;
  if (!user) {
    return json({ error: "Authentication required. Please sign in again." }, { status: 401 });
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required. Contact your administrator." }, { status: 403 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) {
    return json({ error: "Database unavailable. Please try again in a moment." }, { status: 503 });
  }
  try {
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const conditions = ["tenant_id = ?"];
    const binds = [tenantId];
    if (search) {
      conditions.push("(email LIKE ? OR display_name LIKE ?)");
      const pattern = `%${search}%`;
      binds.push(pattern, pattern);
    }
    if (status) {
      conditions.push("status = ?");
      binds.push(status);
    }
    const where = conditions.join(" AND ");
    const countRow = await db.prepare(`SELECT COUNT(*) as total FROM directory_users WHERE ${where}`).bind(...binds).first();
    const rows = await db.prepare(
      `SELECT id, external_id, email, display_name, department, title, status, source, console_user_id, created_at, updated_at
         FROM directory_users WHERE ${where}
         ORDER BY display_name ASC
         LIMIT ? OFFSET ?`
    ).bind(...binds, limit, offset).all().then((r) => r.results || []);
    return json({ users: toCamel(rows), total: countRow?.total ?? 0 });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Failed to fetch directory users",
        tenantId,
        error: String(error)
      })
    );
    return json({ error: "Failed to load users. Please try again." }, { status: 500 });
  }
};
const POST = async ({ request, locals, platform }) => {
  const user = locals.user;
  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;
  const tenantId = user.tenantId;
  if (!tenantId) {
    return json({ error: "Tenant context required. Contact your administrator." }, { status: 403 });
  }
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) {
    return json({ error: "Database unavailable. Please try again in a moment." }, { status: 503 });
  }
  try {
    const body = await request.json().catch(() => null);
    if (!body?.email) {
      return json(
        { error: "Email address is required. Please provide a valid email." },
        { status: 422 }
      );
    }
    const { email, displayName, department, title, status = "active" } = body;
    const newId = crypto.randomUUID();
    const externalId = `manual:${newId}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.prepare(
      `INSERT INTO directory_users (id, tenant_id, external_id, email, display_name, department, title, status, source, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?)`
    ).bind(
      newId,
      tenantId,
      externalId,
      email,
      displayName ?? null,
      department ?? null,
      title ?? null,
      status,
      now,
      now
    ).run();
    const created = await db.prepare(
      `SELECT id, external_id, email, display_name, department, title, status, source, created_at, updated_at FROM directory_users WHERE id = ?`
    ).bind(newId).first();
    await writeAudit(db, {
      tenantId,
      actorUserId: user.userId ?? user.id,
      actorEmail: user.email,
      action: "directory_user.created",
      targetType: "directory_user",
      targetId: newId,
      detail: email
    });
    return json({ user: toCamel(created) }, { status: 201 });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Failed to create directory user",
        tenantId,
        error: String(error)
      })
    );
    return json({ error: "Failed to create user. Please try again." }, { status: 500 });
  }
};

export { GET, POST };
//# sourceMappingURL=_server.ts-BD41GAQf.js.map
