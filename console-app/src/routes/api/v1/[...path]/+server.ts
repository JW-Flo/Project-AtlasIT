import type { RequestHandler } from "./$types";
import { json } from "@sveltejs/kit";
import { proxyServiceRequest } from "../../_service-proxy";
import { dashboardData, integrationsData, tenantSettingsData } from "$lib/server/dashboard-compat";

function targetFor(path: string) {
  return path.startsWith("trust/questionnaire/") ? "compliance" : "core";
}

async function handle(event: Parameters<RequestHandler>[0]) {
  const path = event.params.path ?? "";
  const user = event.locals.user;
  if (user?.tenantId) {
    if (event.request.method === "GET" && path === "dashboard") {
      return json(await dashboardData(user));
    }
    if (event.request.method === "GET" && path === "apps/integrations") {
      return json(await integrationsData(user.tenantId));
    }
    if (event.request.method === "GET" && path === "tenant/settings") {
      const settings = await tenantSettingsData(user.tenantId);
      return settings ? json(settings) : json({ error: "Tenant not found" }, { status: 404 });
    }
  }
  const target = targetFor(path);
  return proxyServiceRequest(event, target, `/api/v1/${path}`);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
