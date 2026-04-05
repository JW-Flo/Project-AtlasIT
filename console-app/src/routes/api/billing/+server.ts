import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/** GET /api/billing — returns current tenant billing info, usage, and invoices */
export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = (locals as any).user;
  if (!user?.tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) {
    return json({ error: "Database unavailable" }, { status: 503 });
  }

  const tenantId = user.tenantId;

  try {
    // Fetch billing record
    const billing = await db
      .prepare("SELECT * FROM tenant_billing WHERE tenant_id = ?")
      .bind(tenantId)
      .first();

    // Fetch tenant tier from tenants table as fallback
    const tenant = await db.prepare("SELECT tier FROM tenants WHERE id = ?").bind(tenantId).first();

    // Fetch recent invoices
    const invoicesResult = await db
      .prepare("SELECT * FROM invoices WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 12")
      .bind(tenantId)
      .all();

    // Compute usage summary
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const [userCount, adapterCount, frameworkCount, automationCount] = await Promise.all([
      db
        .prepare("SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND status = 'active'")
        .bind(tenantId)
        .first(),
      db
        .prepare(
          "SELECT COUNT(*) as count FROM integrations WHERE tenant_id = ? AND status = 'active'",
        )
        .bind(tenantId)
        .first(),
      db
        .prepare(
          "SELECT COUNT(DISTINCT framework) as count FROM compliance_controls WHERE tenant_id = ?",
        )
        .bind(tenantId)
        .first()
        .catch(() => ({ count: 0 })),
      db
        .prepare("SELECT COUNT(*) as count FROM automation_rules WHERE tenant_id = ?")
        .bind(tenantId)
        .first()
        .catch(() => ({ count: 0 })),
    ]);

    const plan = billing?.plan || tenant?.tier || "free";

    return json({
      billing: billing
        ? {
            plan: billing.plan,
            billingCycle: billing.billing_cycle,
            status: billing.status,
            billingEmail: billing.billing_email,
            trialEndsAt: billing.trial_ends_at,
            currentPeriodStart: billing.current_period_start,
            currentPeriodEnd: billing.current_period_end,
            canceledAt: billing.canceled_at,
            hasPaymentMethod: !!billing.stripe_customer_id,
          }
        : {
            plan,
            billingCycle: "monthly",
            status: "active",
            billingEmail: null,
            trialEndsAt: null,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            canceledAt: null,
            hasPaymentMethod: false,
          },
      usage: {
        activeUsers: userCount?.count ?? 0,
        connectedAdapters: adapterCount?.count ?? 0,
        complianceFrameworks: frameworkCount?.count ?? 0,
        automationRules: automationCount?.count ?? 0,
      },
      invoices: (invoicesResult?.results ?? []).map((inv: any) => ({
        id: inv.id,
        amountCents: inv.amount_cents,
        currency: inv.currency,
        status: inv.status,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
        paidAt: inv.paid_at,
        pdfUrl: inv.pdf_url,
        createdAt: inv.created_at,
      })),
    });
  } catch (err: any) {
    console.error("Billing fetch error:", err?.message);
    return json({ error: "Failed to load billing data" }, { status: 500 });
  }
};
