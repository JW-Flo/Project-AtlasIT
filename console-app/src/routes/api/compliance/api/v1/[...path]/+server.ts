import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { proxyServiceRequest } from "../../../../_service-proxy";
import {
  compliancePacksData,
  complianceSummaryData,
  evidenceData,
  packTrendData,
  notificationsData,
} from "$lib/server/dashboard-compat";

async function handle(event: Parameters<RequestHandler>[0]) {
  const path = event.params.path ?? "";
  const user = event.locals.user;
  if (user?.tenantId && event.request.method === "GET") {
    if (path === "compliance-packs") {
      return json(await compliancePacksData(user.tenantId));
    }
    if (path === "compliance-packs/installed") {
      return json(await compliancePacksData(user.tenantId, true));
    }
    if (path === "compliance-packs/history/aggregate") {
      return json(await packTrendData(user.tenantId, event.url));
    }
    if (path === "compliance/summary") {
      return json(await complianceSummaryData(user.tenantId));
    }
    if (path === "evidence") {
      return json(await evidenceData(user.tenantId, event.url));
    }
    if (path === "notifications") {
      return json(await notificationsData(user, event.url.searchParams.get("unread") === "true"));
    }
  }
  return proxyServiceRequest(event, "compliance", `/api/v1/${path}`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
