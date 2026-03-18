/**
 * Auto-revoke: after a campaign expires with unreviewed items, revoke access
 * via the relevant adapter for each pending item.
 *
 * Called from a scheduled cron trigger or on-demand via the queue consumer.
 */

import type { D1Database } from "@cloudflare/workers-types";

interface ExpiredItem {
  id: string;
  campaign_id: string;
  tenant_id: string;
  user_id: string;
  user_email: string | null;
  app_id: string;
  app_name: string | null;
  role: string | null;
}

export interface AutoRevokeContext {
  sharedDb: D1Database;
  adapterUrls: Record<string, string>;
}

export interface AutoRevokeResult {
  campaignId: string;
  tenantId: string;
  revoked: number;
  failed: number;
  skipped: number;
}

/**
 * Finds all expired campaigns with pending items, attempts to revoke access
 * via adapters, and marks items as revoked (or skipped if no adapter found).
 */
export async function processExpiredCampaigns(
  ctx: AutoRevokeContext,
): Promise<AutoRevokeResult[]> {
  const now = new Date().toISOString();

  // Mark overdue active campaigns as expired
  await ctx.sharedDb
    .prepare(
      `UPDATE access_review_campaigns
       SET status = 'expired'
       WHERE status = 'active' AND due_date IS NOT NULL AND due_date < ?`,
    )
    .bind(now)
    .run();

  // Find pending items in expired campaigns
  const { results: pendingItems } = await ctx.sharedDb
    .prepare(
      `SELECT i.id, i.campaign_id, i.tenant_id, i.user_id, i.user_email,
              i.app_id, i.app_name, i.role
       FROM access_review_items i
       JOIN access_review_campaigns c ON c.id = i.campaign_id
       WHERE c.status = 'expired' AND i.status = 'pending'
       ORDER BY i.campaign_id`,
    )
    .all<ExpiredItem>();

  if (!pendingItems?.length) return [];

  // Group by campaign
  const byCampaign = new Map<string, ExpiredItem[]>();
  for (const item of pendingItems) {
    const key = `${item.tenant_id}::${item.campaign_id}`;
    if (!byCampaign.has(key)) byCampaign.set(key, []);
    byCampaign.get(key)!.push(item);
  }

  const results: AutoRevokeResult[] = [];

  for (const [key, items] of byCampaign) {
    const [tenantId, campaignId] = key.split("::");
    const result: AutoRevokeResult = {
      campaignId,
      tenantId,
      revoked: 0,
      failed: 0,
      skipped: 0,
    };

    for (const item of items) {
      const adapterUrl = resolveAdapterUrl(item.app_id, ctx.adapterUrls);
      const revokeStatus = adapterUrl
        ? await revokeViaAdapter(adapterUrl, item, tenantId)
        : "skipped";

      const finalStatus = revokeStatus === "ok" ? "revoked" : "skipped";
      const revokedAt = new Date().toISOString();

      await ctx.sharedDb
        .prepare(
          `UPDATE access_review_items
           SET status = ?, decided_at = ?, decided_by = 'system', notes = ?
           WHERE id = ?`,
        )
        .bind(
          finalStatus,
          revokedAt,
          revokeStatus === "ok"
            ? "Auto-revoked: campaign expired with unreviewed access"
            : "Skipped: no adapter configured for this app",
          item.id,
        )
        .run();

      // Append decision log entry
      await ctx.sharedDb
        .prepare(
          `INSERT INTO access_review_decisions
             (id, item_id, campaign_id, tenant_id, decision, decided_by, decided_at, notes)
           VALUES (?, ?, ?, ?, ?, 'system', ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          item.id,
          campaignId,
          tenantId,
          finalStatus,
          revokedAt,
          finalStatus === "revoked"
            ? "Auto-revoked on campaign expiry"
            : "Skipped — no adapter available",
        )
        .run();

      if (finalStatus === "revoked") result.revoked++;
      else result.skipped++;
    }

    results.push(result);
  }

  return results;
}

function resolveAdapterUrl(
  appId: string,
  adapterUrls: Record<string, string>,
): string | null {
  return adapterUrls[appId] ?? null;
}

async function revokeViaAdapter(
  adapterUrl: string,
  item: ExpiredItem,
  tenantId: string,
): Promise<"ok" | "failed"> {
  try {
    const res = await fetch(`${adapterUrl}/api/deprovision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": tenantId,
      },
      body: JSON.stringify({
        tenantId,
        userId: item.user_id,
        userEmail: item.user_email,
        appId: item.app_id,
        role: item.role,
        reason: "access_review_expired",
      }),
    });
    return res.ok ? "ok" : "failed";
  } catch {
    return "failed";
  }
}
