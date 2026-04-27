import { json } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { queryPg } from "$lib/server/pg";
import { collectAllAdapterEvidence, parseControlRef } from "@atlasit/shared";

const ADAPTER_URLS: Record<string, string> = {
  github: "https://atlasit-adapter-github.kd8jc7v8cd.workers.dev",
  okta: "https://atlasit-okta-connector.kd8jc7v8cd.workers.dev",
  "google-workspace": "https://atlasit-google-workspace.kd8jc7v8cd.workers.dev",
  "microsoft-365": "https://atlasit-adapter-microsoft-365.kd8jc7v8cd.workers.dev",
  aws: "https://atlasit-adapter-aws.kd8jc7v8cd.workers.dev",
  slack: "https://atlasit-adapter-slack.kd8jc7v8cd.workers.dev",
};

export const POST: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET || process.env.INTERNAL_API_KEY;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenants = await queryPg<{ id: string }>(
    `SELECT id FROM tenants WHERE status = 'active' OR status IS NULL ORDER BY created_at`,
  );

  let totalEvidence = 0;
  const errors: string[] = [];

  for (const tenant of tenants) {
    try {
      const results = await collectAllAdapterEvidence(ADAPTER_URLS, tenant.id);

      for (const result of results) {
        if (result.error) {
          errors.push(`${tenant.id}/${result.slug}: ${result.error}`);
          continue;
        }

        for (const item of result.items) {
          for (const controlRef of item.controlRefs) {
            const { framework, controlId } = parseControlRef(controlRef);
            await queryPg(
              `INSERT INTO compliance_evidence
               (id, tenant_id, framework, control_id, control_name, evidence_type, source, source_id, actor, subject, metadata, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
               ON CONFLICT (id) DO NOTHING`,
              [
                crypto.randomUUID(),
                tenant.id,
                framework,
                controlId,
                `${framework}-${controlId}`,
                item.type,
                result.slug,
                `${result.slug}-${item.type}-${Date.now()}`,
                "system:cron",
                `adapter:${result.slug}`,
                JSON.stringify(item.details),
              ],
            );
            totalEvidence++;
          }
        }
      }
    } catch (err) {
      errors.push(`${tenant.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return json({
    collected: totalEvidence,
    tenants: tenants.length,
    errors: errors.slice(0, 20),
    timestamp: new Date().toISOString(),
  });
};
