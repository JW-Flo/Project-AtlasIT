import type { D1Database } from "@cloudflare/workers-types";

export interface AccessReviewCampaign {
  id: string;
  tenantId: string;
  name: string;
  scope: string;
  status: "draft" | "active" | "completed" | "expired";
  reviewerPolicy: string;
  dueDate: string | null;
  gracePeriodDays: number;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
  totalItems: number;
  approvedItems: number;
  revokedItems: number;
  pendingItems: number;
}

export interface AccessReviewItem {
  id: string;
  campaignId: string;
  tenantId: string;
  userId: string;
  userEmail: string | null;
  appId: string;
  appName: string | null;
  role: string | null;
  reviewerEmail: string | null;
  status: "pending" | "approved" | "revoked" | "skipped";
  decidedAt: string | null;
  decidedBy: string | null;
  notes: string | null;
}

export interface CreateCampaignInput {
  name: string;
  scope?: string;
  reviewerPolicy?: string;
  dueDate?: string | null;
  gracePeriodDays?: number;
  createdBy?: string;
}

function mapCampaignRow(row: any): AccessReviewCampaign {
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
    pendingItems: row.pending_items ?? 0,
  };
}

function mapItemRow(row: any): AccessReviewItem {
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
    notes: row.notes ?? null,
  };
}

export async function listCampaigns(
  db: D1Database,
  tenantId: string,
): Promise<AccessReviewCampaign[]> {
  const result = await db
    .prepare(
      `SELECT
         c.*,
         COUNT(i.id)                                              AS total_items,
         SUM(CASE WHEN i.status = 'approved' THEN 1 ELSE 0 END) AS approved_items,
         SUM(CASE WHEN i.status = 'revoked'  THEN 1 ELSE 0 END) AS revoked_items,
         SUM(CASE WHEN i.status = 'pending'  THEN 1 ELSE 0 END) AS pending_items
       FROM access_review_campaigns c
       LEFT JOIN access_review_items i
         ON i.campaign_id = c.id
       WHERE c.tenant_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
    )
    .bind(tenantId)
    .all();

  return (result.results ?? []).map(mapCampaignRow);
}

export async function getCampaign(
  db: D1Database,
  tenantId: string,
  campaignId: string,
): Promise<AccessReviewCampaign | null> {
  const result = await db
    .prepare(
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
       GROUP BY c.id`,
    )
    .bind(tenantId, campaignId)
    .first();

  return result ? mapCampaignRow(result) : null;
}

export async function createCampaign(
  db: D1Database,
  tenantId: string,
  input: CreateCampaignInput,
): Promise<AccessReviewCampaign> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO access_review_campaigns
         (id, tenant_id, name, scope, status, reviewer_policy, due_date, grace_period_days, created_by, created_at)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      tenantId,
      input.name,
      input.scope ?? "all",
      input.reviewerPolicy ?? "manager",
      input.dueDate ?? null,
      input.gracePeriodDays ?? 7,
      input.createdBy ?? null,
      now,
    )
    .run();

  return {
    id,
    tenantId,
    name: input.name,
    scope: input.scope ?? "all",
    status: "draft",
    reviewerPolicy: input.reviewerPolicy ?? "manager",
    dueDate: input.dueDate ?? null,
    gracePeriodDays: input.gracePeriodDays ?? 7,
    createdBy: input.createdBy ?? null,
    createdAt: now,
    completedAt: null,
    totalItems: 0,
    approvedItems: 0,
    revokedItems: 0,
    pendingItems: 0,
  };
}

export async function listItems(
  db: D1Database,
  tenantId: string,
  campaignId: string,
): Promise<AccessReviewItem[]> {
  const result = await db
    .prepare(
      `SELECT * FROM access_review_items
       WHERE tenant_id = ? AND campaign_id = ?
       ORDER BY user_email, app_name`,
    )
    .bind(tenantId, campaignId)
    .all();

  return (result.results ?? []).map(mapItemRow);
}

export interface CreateItemsInput {
  items: Array<{
    userId: string;
    userEmail?: string;
    appId: string;
    appName?: string;
    role?: string;
    reviewerEmail?: string;
  }>;
}

export async function createItems(
  db: D1Database,
  tenantId: string,
  campaignId: string,
  input: CreateItemsInput,
): Promise<AccessReviewItem[]> {
  const now = new Date().toISOString();
  const created: AccessReviewItem[] = [];

  for (const item of input.items) {
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO access_review_items
           (id, campaign_id, tenant_id, user_id, user_email, app_id, app_name, role, reviewer_email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      )
      .bind(
        id,
        campaignId,
        tenantId,
        item.userId,
        item.userEmail ?? null,
        item.appId,
        item.appName ?? null,
        item.role ?? null,
        item.reviewerEmail ?? null,
      )
      .run();

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
      notes: null,
    });
  }

  return created;
}

export interface SubmitDecisionInput {
  itemId: string;
  decision: "approved" | "revoked";
  decidedBy: string;
  notes?: string;
}

export async function submitDecision(
  db: D1Database,
  tenantId: string,
  campaignId: string,
  input: SubmitDecisionInput,
): Promise<void> {
  const now = new Date().toISOString();
  const decisionId = crypto.randomUUID();

  // Update the item status
  await db
    .prepare(
      `UPDATE access_review_items
       SET status = ?, decided_at = ?, decided_by = ?, notes = ?
       WHERE id = ? AND tenant_id = ? AND campaign_id = ?`,
    )
    .bind(
      input.decision,
      now,
      input.decidedBy,
      input.notes ?? null,
      input.itemId,
      tenantId,
      campaignId,
    )
    .run();

  // Append to decisions log
  await db
    .prepare(
      `INSERT INTO access_review_decisions
         (id, item_id, campaign_id, tenant_id, decision, decided_by, decided_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      decisionId,
      input.itemId,
      campaignId,
      tenantId,
      input.decision,
      input.decidedBy,
      now,
      input.notes ?? null,
    )
    .run();

  // Auto-complete campaign if all items decided
  const pending = await db
    .prepare(
      `SELECT COUNT(*) AS cnt FROM access_review_items
       WHERE campaign_id = ? AND status = 'pending'`,
    )
    .bind(campaignId)
    .first<{ cnt: number }>();

  if ((pending?.cnt ?? 1) === 0) {
    await db
      .prepare(
        `UPDATE access_review_campaigns
         SET status = 'completed', completed_at = ?
         WHERE id = ? AND tenant_id = ?`,
      )
      .bind(now, campaignId, tenantId)
      .run();
  }
}

/** Expire overdue active campaigns (called by a cron or on-demand). */
export async function expireOverdueCampaigns(
  db: D1Database,
  tenantId: string,
): Promise<number> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE access_review_campaigns
       SET status = 'expired'
       WHERE tenant_id = ? AND status = 'active'
         AND due_date IS NOT NULL AND due_date < ?`,
    )
    .bind(tenantId, now)
    .run();

  return result.meta?.changes ?? 0;
}
