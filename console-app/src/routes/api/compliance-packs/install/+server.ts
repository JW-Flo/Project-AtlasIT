import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { writeAudit } from "$lib/server/audit";
import { gateFrameworkAdd } from "$lib/server/tier-gate";

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const tierGate = await gateFrameworkAdd(db, user.tenantId, !!user.superAdmin);
  if (tierGate) return tierGate;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { packId, config } = body;
  if (!packId) return json({ error: "packId is required" }, { status: 400 });

  const pack = await db
    .prepare("SELECT * FROM compliance_packs WHERE id = ? AND status = 'published'")
    .bind(packId)
    .first();
  if (!pack) return json({ error: "Pack not found or not published" }, { status: 404 });

  const existing = await db
    .prepare("SELECT id FROM tenant_compliance_packs WHERE tenant_id = ? AND pack_id = ?")
    .bind(user.tenantId, packId)
    .first();
  if (existing) {
    return json({ error: "Pack already installed" }, { status: 409 });
  }

  const installId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO tenant_compliance_packs (id, tenant_id, pack_id, installed_at, config)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(installId, user.tenantId, packId, now, config ? JSON.stringify(config) : null)
    .run();

  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "compliance_pack.install",
    targetType: "compliance_pack",
    targetId: packId,
    detail: JSON.stringify({ packName: pack.name, packSlug: pack.slug }),
  });

  return json({ ok: true, installId }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { packId } = body;
  if (!packId) return json({ error: "packId is required" }, { status: 400 });

  const installation = await db
    .prepare(
      "SELECT tcp.id, cp.name, cp.slug FROM tenant_compliance_packs tcp JOIN compliance_packs cp ON cp.id = tcp.pack_id WHERE tcp.tenant_id = ? AND tcp.pack_id = ?",
    )
    .bind(user.tenantId, packId)
    .first();
  if (!installation) {
    return json({ error: "Pack not installed" }, { status: 404 });
  }

  await db
    .prepare("DELETE FROM tenant_compliance_packs WHERE tenant_id = ? AND pack_id = ?")
    .bind(user.tenantId, packId)
    .run();

  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "compliance_pack.uninstall",
    targetType: "compliance_pack",
    targetId: packId,
    detail: JSON.stringify({ packName: installation.name, packSlug: installation.slug }),
  });

  return json({ ok: true });
};
