import { queryPg } from './pg-BHX2Ay11.js';

function mapCampaignRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    scope: row.scope ?? "all",
    status: row.status,
    reviewerPolicy: row.reviewer_policy ?? "manager",
    dueDate: row.due_date ?? null,
    gracePeriodDays: row.grace_period_days ?? 7,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? null,
    totalItems: row.total_items ?? 0,
    approvedItems: row.approved_items ?? 0,
    revokedItems: row.revoked_items ?? 0,
    pendingItems: row.pending_items ?? 0
  };
}
function mapItemRow(row) {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userEmail: row.user_email ?? null,
    appId: row.app_id,
    appName: row.app_name ?? null,
    role: row.role ?? null,
    reviewerEmail: row.reviewer_email ?? null,
    status: row.status,
    decidedAt: row.decided_at ?? null,
    decidedBy: row.decided_by ?? null,
    notes: row.notes ?? null
  };
}
async function getCampaign(db, tenantId, campaignId) {
  const result = await db.prepare(
    `SELECT
         c.*,
         COUNT(i.id)                                              AS total_items,
         SUM(CASE WHEN i.status = 'approved' THEN 1 ELSE 0 END) AS approved_items,
         SUM(CASE WHEN i.status = 'revoked'  THEN 1 ELSE 0 END) AS revoked_items,
         SUM(CASE WHEN i.status = 'pending'  THEN 1 ELSE 0 END) AS pending_items
       FROM access_review_campaigns c
       LEFT JOIN access_review_items i
         ON i.campaign_id = c.id
       WHERE c.tenant_id = ? AND c.id = ?
       GROUP BY c.id`
  ).bind(tenantId, campaignId).first();
  return result ? mapCampaignRow(result) : null;
}
async function listItems(db, tenantId, campaignId) {
  const result = await db.prepare(
    `SELECT * FROM access_review_items
       WHERE tenant_id = ? AND campaign_id = ?
       ORDER BY user_email, app_name`
  ).bind(tenantId, campaignId).all();
  return (result.results ?? []).map(mapItemRow);
}
async function createItems(db, tenantId, campaignId, input) {
  (/* @__PURE__ */ new Date()).toISOString();
  const created = [];
  for (const item of input.items) {
    const id = crypto.randomUUID();
    await db.prepare(
      `INSERT INTO access_review_items
           (id, campaign_id, tenant_id, user_id, user_email, app_id, app_name, role, reviewer_email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(
      id,
      campaignId,
      tenantId,
      item.userId,
      item.userEmail ?? null,
      item.appId,
      item.appName ?? null,
      item.role ?? null,
      item.reviewerEmail ?? null
    ).run();
    created.push({
      id,
      campaignId,
      tenantId,
      userId: item.userId,
      userEmail: item.userEmail ?? null,
      appId: item.appId,
      appName: item.appName ?? null,
      role: item.role ?? null,
      reviewerEmail: item.reviewerEmail ?? null,
      status: "pending",
      decidedAt: null,
      decidedBy: null,
      notes: null
    });
  }
  return created;
}
async function submitDecision(db, tenantId, campaignId, input) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const decisionId = crypto.randomUUID();
  await db.prepare(
    `UPDATE access_review_items
       SET status = ?, decided_at = ?, decided_by = ?, notes = ?
       WHERE id = ? AND tenant_id = ? AND campaign_id = ?`
  ).bind(
    input.decision,
    now,
    input.decidedBy,
    input.notes ?? null,
    input.itemId,
    tenantId,
    campaignId
  ).run();
  await db.prepare(
    `INSERT INTO access_review_decisions
         (id, item_id, campaign_id, tenant_id, decision, decided_by, decided_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    decisionId,
    input.itemId,
    campaignId,
    tenantId,
    input.decision,
    input.decidedBy,
    now,
    input.notes ?? null
  ).run();
  const pending = await db.prepare(
    `SELECT COUNT(*) AS cnt FROM access_review_items
       WHERE campaign_id = ? AND status = 'pending'`
  ).bind(campaignId).first();
  if ((pending?.cnt ?? 1) === 0) {
    await db.prepare(
      `UPDATE access_review_campaigns
         SET status = 'completed', completed_at = ?
         WHERE id = ? AND tenant_id = ?`
    ).bind(now, campaignId, tenantId).run();
  }
}
async function updateCampaignStatus(db, tenantId, campaignId, status) {
  const completedAt = status === "completed" ? (/* @__PURE__ */ new Date()).toISOString() : null;
  await db.prepare(
    `UPDATE access_review_campaigns
       SET status = ?, updated_at = datetime('now'), completed_at = COALESCE(?, completed_at)
       WHERE id = ? AND tenant_id = ?`
  ).bind(status, completedAt, campaignId, tenantId).run();
}
async function listCampaignsPg(tenantId) {
  const rows = await queryPg(
    `SELECT
       c.*,
       COUNT(i.id)                                              AS total_items,
       SUM(CASE WHEN i.status = 'approved' THEN 1 ELSE 0 END) AS approved_items,
       SUM(CASE WHEN i.status = 'revoked'  THEN 1 ELSE 0 END) AS revoked_items,
       SUM(CASE WHEN i.status = 'pending'  THEN 1 ELSE 0 END) AS pending_items
     FROM access_review_campaigns c
     LEFT JOIN access_review_items i ON i.campaign_id = c.id
     WHERE c.tenant_id = $1
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [tenantId]
  );
  return rows.map(mapCampaignRow);
}
async function createCampaignPg(tenantId, input) {
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const scope = input.scope ?? "all";
  await queryPg(
    `INSERT INTO access_review_campaigns
       (id, tenant_id, name, scope, status, reviewer_policy, due_date, grace_period_days, created_by, created_at)
     VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9)`,
    [
      id,
      tenantId,
      input.name,
      scope,
      input.reviewerPolicy ?? "manager",
      input.dueDate ?? null,
      input.gracePeriodDays ?? 7,
      input.createdBy ?? null,
      now
    ]
  );
  let totalItems = 0;
  if (scope.startsWith("nhi")) {
    const nhiItems = await populateNhiItemsPg(tenantId, id, scope);
    totalItems = nhiItems.length;
  }
  return {
    id,
    tenantId,
    name: input.name,
    scope,
    status: "draft",
    reviewerPolicy: input.reviewerPolicy ?? "manager",
    dueDate: input.dueDate ?? null,
    gracePeriodDays: input.gracePeriodDays ?? 7,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    completedAt: null,
    totalItems,
    approvedItems: 0,
    revokedItems: 0,
    pendingItems: totalItems
  };
}
async function populateNhiItemsPg(tenantId, campaignId, scope) {
  const scopeParts = scope.split(":");
  const credentialTypeFilter = scopeParts.length > 1 ? scopeParts[1] : null;
  let sql = `SELECT nc.id, nc.display_name, nc.credential_type, nc.provider,
                    nc.owner_email, nc.scopes, nc.risk_score
             FROM nhi_credentials nc
             WHERE nc.tenant_id = $1 AND nc.status = 'active'`;
  const binds = [tenantId];
  if (credentialTypeFilter) {
    sql += ` AND nc.credential_type = $2`;
    binds.push(credentialTypeFilter);
  }
  sql += ` ORDER BY nc.risk_score DESC LIMIT 500`;
  const nhis = await queryPg(sql, binds);
  if (!nhis || nhis.length === 0) return [];
  const items = [];
  for (const nhi of nhis) {
    const id = crypto.randomUUID();
    await queryPg(
      `INSERT INTO access_review_items
         (id, campaign_id, tenant_id, user_id, user_email, app_id, app_name, role, reviewer_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')`,
      [
        id,
        campaignId,
        tenantId,
        nhi.id,
        nhi.display_name,
        nhi.provider,
        `${nhi.provider} - ${nhi.credential_type}`,
        nhi.credential_type,
        nhi.owner_email ?? null
      ]
    );
    items.push({
      id,
      campaignId,
      tenantId,
      userId: nhi.id,
      userEmail: nhi.display_name,
      appId: nhi.provider,
      appName: `${nhi.provider} - ${nhi.credential_type}`,
      role: nhi.credential_type,
      reviewerEmail: nhi.owner_email ?? null,
      status: "pending",
      decidedAt: null,
      decidedBy: null,
      notes: null
    });
  }
  return items;
}

export { listItems as a, createItems as b, createCampaignPg as c, getCampaign as g, listCampaignsPg as l, submitDecision as s, updateCampaignStatus as u };
//# sourceMappingURL=access-reviews-BTht9KY_.js.map
