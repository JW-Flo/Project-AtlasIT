import type { SyncResult, StripeProduct } from "../types.js";
import { listProducts, listSubscriptions } from "../client.js";

async function upsertProduct(
  db: D1Database,
  tenantId: string,
  product: StripeProduct,
): Promise<"created" | "updated"> {
  const externalId = `prod:${product.id}`;

  const existing = await db
    .prepare(
      "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
    )
    .bind(tenantId, externalId)
    .first<{ id: string }>();

  await db
    .prepare(
      `INSERT OR REPLACE INTO directory_groups
       (id, tenant_id, external_id, name, description, updated_at)
       VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(
      existing?.id ?? null,
      tenantId,
      externalId,
      product.name,
      product.description ?? null,
    )
    .run();

  return existing ? "updated" : "created";
}

async function syncSubscriptionMemberships(
  db: D1Database,
  secretKey: string,
  tenantId: string,
): Promise<number> {
  const subscriptions = await listSubscriptions(secretKey, "all");
  let membershipCount = 0;

  for (const sub of subscriptions) {
    // Resolve customer -> directory_user
    const customerExternalId = `cus:${sub.customer}`;
    const userRow = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, customerExternalId)
      .first<{ id: string }>();

    if (!userRow) continue;

    // Each subscription item links to a product -> directory_group
    for (const item of sub.items.data) {
      const productExternalId = `prod:${item.price.product}`;
      const groupRow = await db
        .prepare(
          "SELECT id FROM directory_groups WHERE tenant_id = ? AND external_id = ?",
        )
        .bind(tenantId, productExternalId)
        .first<{ id: string }>();

      if (!groupRow) continue;

      await db
        .prepare(
          `INSERT OR IGNORE INTO directory_memberships (tenant_id, user_id, group_id)
           VALUES (?, ?, ?)`,
        )
        .bind(tenantId, userRow.id, groupRow.id)
        .run();

      membershipCount++;
    }
  }

  return membershipCount;
}

export async function syncGroups(
  db: D1Database,
  secretKey: string,
  tenantId: string,
): Promise<SyncResult & { memberships: number }> {
  let created = 0;
  let updated = 0;
  let total = 0;

  // Sync Stripe Products as directory groups (subscription tiers)
  const products = await listProducts(secretKey, true);

  for (const product of products) {
    const result = await upsertProduct(db, tenantId, product);
    if (result === "created") created++;
    else updated++;
    total++;
  }

  // Sync Subscription-based memberships (Customer <-> Product)
  const memberships = await syncSubscriptionMemberships(
    db,
    secretKey,
    tenantId,
  );

  return { created, updated, total, memberships };
}
