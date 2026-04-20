import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { requireTenantRole } from "$lib/server/guards";
import { writeAudit } from "$lib/server/audit";

export const GET: RequestHandler = async ({ url, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ packs: [] });

  const framework = url.searchParams.get("framework");
  const status = url.searchParams.get("status");

  let query = `
    SELECT
      p.id, p.name, p.slug, p.description, p.author, p.version,
      p.framework_id, p.controls_count, p.status, p.is_builtin,
      p.config_schema, p.created_at, p.updated_at,
      CASE WHEN tcp.pack_id IS NOT NULL THEN 1 ELSE 0 END AS installed
    FROM compliance_packs p
    LEFT JOIN tenant_compliance_packs tcp
      ON tcp.pack_id = p.id AND tcp.tenant_id = ?
    WHERE 1=1
  `;
  const bindings: any[] = [user.tenantId];

  if (framework) {
    query += " AND p.framework_id = ?";
    bindings.push(framework);
  }
  if (status) {
    query += " AND p.status = ?";
    bindings.push(status);
  }

  query += " ORDER BY p.is_builtin DESC, p.name ASC";

  try {
    const result = await db
      .prepare(query)
      .bind(...bindings)
      .all();
    const packs = (result.results ?? []).map((p: any) => ({
      ...p,
      installed: p.installed === 1,
      is_builtin: p.is_builtin === 1,
    }));

    return json({ packs });
  } catch (e) {
    console.error("Compliance packs list error:", e);
    return json({ packs: [] });
  }
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });

  const guard = requireTenantRole(user, ["owner", "admin"]);
  if (guard) return guard;

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  // Check tenant tier — custom compliance packs require professional or enterprise
  const billing = await db
    .prepare("SELECT plan FROM tenant_billing WHERE tenant_id = ?")
    .bind(user.tenantId)
    .first();
  const plan: string = billing?.plan ?? "free";
  if (plan !== "professional" && plan !== "enterprise" && !user.superAdmin) {
    return json(
      {
        error: "Custom compliance packs require a Professional or Enterprise plan",
        action: {
          label: "Upgrade Plan",
          url: "/console/settings/billing",
        },
      },
      { status: 403 },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, slug, description, frameworkId, controls } = body;
  if (!name || !slug || !frameworkId) {
    return json({ error: "name, slug, and frameworkId are required" }, { status: 400 });
  }

  const packId = crypto.randomUUID();
  const now = new Date().toISOString();
  const controlsCount = Array.isArray(controls) ? controls.length : 0;

  await db
    .prepare(
      `INSERT INTO compliance_packs
       (id, name, slug, description, author, version, framework_id, controls_count, status, is_builtin, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      packId,
      name,
      slug,
      description ?? null,
      user.email,
      "1.0.0",
      frameworkId,
      controlsCount,
      "draft",
      0,
      now,
      now,
    )
    .run();

  if (Array.isArray(controls) && controls.length > 0) {
    for (let i = 0; i < controls.length; i++) {
      const ctrl = controls[i];
      await db
        .prepare(
          `INSERT INTO compliance_pack_controls
           (id, pack_id, control_ref, title, description, evidence_types, weight, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          packId,
          ctrl.controlRef,
          ctrl.title,
          ctrl.description ?? null,
          ctrl.evidenceTypes ? JSON.stringify(ctrl.evidenceTypes) : null,
          ctrl.weight ?? 1.0,
          i,
        )
        .run();
    }
  }

  const pack = await db.prepare("SELECT * FROM compliance_packs WHERE id = ?").bind(packId).first();

  await writeAudit(db, {
    tenantId: user.tenantId,
    actorUserId: user.userId,
    actorEmail: user.email,
    action: "compliance_pack.create",
    targetType: "compliance_pack",
    targetId: packId,
    detail: JSON.stringify({ name, slug, frameworkId }),
  });

  return json({ pack }, { status: 201 });
};
