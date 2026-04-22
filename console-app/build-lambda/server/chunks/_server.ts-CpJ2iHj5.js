import { json } from '@sveltejs/kit';
import { w as writeAudit } from './audit-DeKPFK-8.js';
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

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const row = await db.prepare(
    "SELECT id, email, display_name, roles, tenant_id, created_at FROM console_users WHERE id = ? LIMIT 1"
  ).bind(user.userId).first();
  if (!row) {
    return json({
      email: user.email,
      displayName: user.displayName || user.email,
      roles: user.roles || [],
      tenantId: user.tenantId
    });
  }
  let roles;
  try {
    roles = JSON.parse(row.roles || '["admin"]');
  } catch {
    roles = ["admin"];
  }
  return json({
    email: row.email,
    displayName: row.display_name || row.email,
    roles,
    tenantId: row.tenant_id,
    createdAt: row.created_at
  });
};
const PATCH = async ({
  request,
  locals,
  platform,
  cookies
}) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const env = platform?.env || {};
  const db = env.ATLAS_SHARED_DB;
  const kv = env.KV_SESSIONS;
  if (!db) return json({ error: "DB unavailable" }, { status: 500 });
  const body = await request.json().catch(() => ({}));
  const { displayName } = body;
  if (!displayName || !displayName.trim()) {
    return json({ error: "Display name is required" }, { status: 400 });
  }
  if (displayName.length > 100) {
    return json(
      { error: "Display name must be 100 characters or less" },
      { status: 400 }
    );
  }
  await db.prepare("UPDATE console_users SET display_name = ? WHERE id = ?").bind(displayName.trim(), user.userId).run();
  if (kv) {
    const sid = cookies.get("atlas_session");
    if (sid) {
      try {
        const raw = await kv.get(sid);
        if (raw) {
          const sessionData = JSON.parse(raw);
          sessionData.displayName = displayName.trim();
          await kv.put(sid, JSON.stringify(sessionData), {
            expirationTtl: 604800
          });
        }
      } catch {
      }
    }
  }
  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "user.profile_updated",
    targetType: "user",
    targetId: user.userId,
    detail: JSON.stringify({ displayName: displayName.trim() })
  });
  return json({ success: true });
};

export { GET, PATCH };
//# sourceMappingURL=_server.ts-CpJ2iHj5.js.map
