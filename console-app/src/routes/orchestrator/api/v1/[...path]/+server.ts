import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { proxyServiceRequest } from "../../../../api/_service-proxy";
import { automationRulesData, automationStatsData } from "$lib/server/dashboard-compat";

async function handle(event: Parameters<RequestHandler>[0]) {
  const path = event.params.path ?? "";
  const user = event.locals.user;
  if (user?.tenantId && event.request.method === "GET") {
    if (path === "automation/rules") {
      return json(await automationRulesData(user.tenantId));
    }
    if (path === "automation/stats") {
      return json(await automationStatsData(user.tenantId));
    }
  }
  return proxyServiceRequest(event, "orchestrator", `/api/v1/${path}`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
