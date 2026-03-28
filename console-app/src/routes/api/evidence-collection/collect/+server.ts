import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

/**
 * POST /api/evidence-collection/collect
 * Triggers on-demand evidence collection from connected adapters for a specific control.
 * Called from the Insights "Collect Now" button.
 */
export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: { controlId?: string; framework?: string; adapters?: string[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.controlId || !body.framework) {
    return json({ error: "controlId and framework are required" }, { status: 400 });
  }

  const env = (platform?.env as Record<string, unknown>) ?? {};

  // Try to trigger evidence collection via the orchestrator
  const orchestratorUrl = env.ORCHESTRATOR_URL as string | undefined;
  if (orchestratorUrl) {
    try {
      const res = await fetch(`${orchestratorUrl}/api/v1/evidence/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          tenantId,
          controlId: body.controlId,
          framework: body.framework,
          adapters: body.adapters ?? [],
        }),
      });

      if (res.ok) {
        return json({
          message: "Evidence collection triggered",
          controlId: body.controlId,
          adapters: body.adapters,
        });
      }
    } catch {
      // Fall through to direct adapter collection
    }
  }

  // Fallback: collect directly from adapter URLs if available
  const adapterUrls: Record<string, string> = {};
  const ADAPTER_URL_KEYS = [
    "OKTA_ADAPTER_URL",
    "GITHUB_ADAPTER_URL",
    "GOOGLE_WORKSPACE_ADAPTER_URL",
    "M365_ADAPTER_URL",
    "AWS_ADAPTER_URL",
    "SLACK_ADAPTER_URL",
  ];

  const SLUG_MAP: Record<string, string> = {
    OKTA_ADAPTER_URL: "okta",
    GITHUB_ADAPTER_URL: "github",
    GOOGLE_WORKSPACE_ADAPTER_URL: "google-workspace",
    M365_ADAPTER_URL: "microsoft-365",
    AWS_ADAPTER_URL: "aws",
    SLACK_ADAPTER_URL: "slack",
  };

  for (const key of ADAPTER_URL_KEYS) {
    const url = env[key] as string | undefined;
    if (url) {
      adapterUrls[SLUG_MAP[key]] = url;
    }
  }

  const requestedAdapters = body.adapters ?? [];
  const collected: string[] = [];
  const failed: string[] = [];

  for (const slug of requestedAdapters) {
    const url = adapterUrls[slug];
    if (!url) {
      failed.push(slug);
      continue;
    }

    try {
      const res = await fetch(`${url}/api/evidence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
        },
        body: JSON.stringify({ tenantId }),
      });

      if (res.ok) {
        collected.push(slug);
      } else {
        failed.push(slug);
      }
    } catch {
      failed.push(slug);
    }
  }

  return json({
    message: `Evidence collection completed`,
    controlId: body.controlId,
    collected,
    failed,
  });
};
