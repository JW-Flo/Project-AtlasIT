import { getSessionResponse, getUserProfileResponse } from "./data/session";
import { getDashboardResponse } from "./data/dashboard";
import {
  getCompliancePacksResponse,
  getComplianceTrendResponse,
  getComplianceScoresResponse,
  getComplianceSummaryResponse,
  getEvidenceResponse,
  getControlsRegistryResponse,
} from "./data/compliance";
import { getDirectoryUsersResponse, getDirectoryGroupsResponse, getDirectorySyncStatusResponse } from "./data/directory";
import { getAutomationRulesResponse, getAutomationStatsResponse, getAutomationRunsResponse } from "./data/automation";
import { getPoliciesResponse, getPolicyDetailResponse } from "./data/policies";
import { getAccessReviewsResponse, getAccessRequestsResponse } from "./data/access";
import { getIncidentsResponse } from "./data/incidents";
import { getIntegrationsResponse, getAppsStatusResponse } from "./data/integrations";
import { getSettingsResponse, getBillingResponse } from "./data/settings";
import { getNotificationsResponse } from "./data/notifications";
import { getAuditLogResponse } from "./data/audit-log";
import { getMarketplaceResponse } from "./data/marketplace";
import { resetCounter } from "./data/helpers";

type RouteHandler = (url: string, method: string) => unknown;

const MUTATE_SUCCESS = { status: "ok", data: { success: true } };

const routes: Array<{ pattern: string | RegExp; handler: RouteHandler }> = [
  { pattern: "/api/v1/auth/validate", handler: () => getSessionResponse() },
  { pattern: "/api/auth/session", handler: () => getSessionResponse() },
  { pattern: "/api/v1/user/profile", handler: () => getUserProfileResponse() },
  { pattern: "/api/v1/dashboard", handler: () => getDashboardResponse() },
  { pattern: "/api/compliance/api/v1/compliance-packs/history/aggregate", handler: () => getComplianceTrendResponse() },
  { pattern: "/api/compliance/api/v1/compliance-packs/registry/controls", handler: () => getControlsRegistryResponse() },
  { pattern: "/api/compliance/api/v1/compliance-packs", handler: () => getCompliancePacksResponse() },
  { pattern: "/api/compliance/api/v1/compliance/summary", handler: () => getComplianceSummaryResponse() },
  { pattern: "/api/compliance/api/v1/evidence", handler: () => getEvidenceResponse() },
  { pattern: "/api/tenant-compliance/scores", handler: () => getComplianceScoresResponse() },
  { pattern: "/api/compliance/api/v1/policies/coverage", handler: () => getComplianceScoresResponse() },
  { pattern: "/api/compliance/api/v1/compliance-packs/history", handler: () => getComplianceTrendResponse() },
  {
    pattern: /^\/api\/compliance\/api\/v1\/policies\/([^/]+)\/acknowledgements/,
    handler: () => ({ data: { items: [] } }),
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/policies\/([^/]+)/,
    handler: (url: string) => {
      const match = url.match(/\/policies\/([^/?]+)/);
      return getPolicyDetailResponse(match?.[1] ?? "");
    },
  },
  { pattern: "/api/compliance/api/v1/policies", handler: () => getPoliciesResponse() },
  { pattern: "/api/v1/directory/users", handler: () => getDirectoryUsersResponse() },
  { pattern: "/api/v1/directory/groups", handler: () => getDirectoryGroupsResponse() },
  { pattern: "/api/v1/directory/sync/status", handler: () => getDirectorySyncStatusResponse() },
  { pattern: "/orchestrator/api/v1/automation/stats", handler: () => getAutomationStatsResponse() },
  { pattern: "/orchestrator/api/v1/automation/rules", handler: (_, method) => {
    if (method !== "GET") return MUTATE_SUCCESS;
    return getAutomationRulesResponse();
  }},
  { pattern: "/orchestrator/api/v1/automation/runs", handler: () => getAutomationRunsResponse() },
  { pattern: "/api/compliance/api/v1/access-reviews", handler: (_, method) => {
    if (method !== "GET") return MUTATE_SUCCESS;
    return getAccessReviewsResponse();
  }},
  { pattern: "/api/compliance/api/v1/access-requests", handler: (_, method) => {
    if (method !== "GET") return MUTATE_SUCCESS;
    return getAccessRequestsResponse();
  }},
  { pattern: "/api/access-reviews", handler: (_, method) => {
    if (method !== "GET") return MUTATE_SUCCESS;
    return getAccessReviewsResponse();
  }},
  { pattern: "/api/access-requests", handler: (_, method) => {
    if (method !== "GET") return MUTATE_SUCCESS;
    return getAccessRequestsResponse();
  }},
  { pattern: "/api/compliance/api/v1/incidents", handler: (_, method) => {
    if (method !== "GET") return MUTATE_SUCCESS;
    return getIncidentsResponse();
  }},
  { pattern: "/api/v1/apps/integrations", handler: () => getIntegrationsResponse() },
  { pattern: "/api/v1/apps/status", handler: () => getAppsStatusResponse() },
  { pattern: "/api/apps/status", handler: () => getAppsStatusResponse() },
  { pattern: "/api/v1/apps/connect", handler: () => MUTATE_SUCCESS },
  { pattern: "/api/v1/apps/disconnect", handler: () => MUTATE_SUCCESS },
  { pattern: "/api/v1/apps/test", handler: () => ({ data: { healthy: true } }) },
  { pattern: "/api/v1/marketplace", handler: () => getMarketplaceResponse() },
  { pattern: "/api/marketplace", handler: () => getMarketplaceResponse() },
  { pattern: "/api/v1/tenant/settings", handler: (_, method) => {
    if (method !== "GET") return MUTATE_SUCCESS;
    return getSettingsResponse();
  }},
  { pattern: "/api/v1/tenant/sso", handler: () => ({ data: { enabled: false, provider: null } }) },
  { pattern: "/api/v1/billing", handler: () => getBillingResponse() },
  { pattern: "/api/v1/billing/seats", handler: () => getBillingResponse() },
  { pattern: "/api/compliance/api/v1/notifications", handler: () => getNotificationsResponse() },
  { pattern: "/api/notifications", handler: () => getNotificationsResponse() },
  { pattern: "/api/v1/audit-log", handler: () => getAuditLogResponse() },
  { pattern: "/api/tenant/audit-log", handler: () => getAuditLogResponse() },
  { pattern: "/api/v1/auth/mfa/status", handler: () => ({ data: { enabled: true, method: "totp" } }) },
  { pattern: "/orchestrator/api/v1/events", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/nhi", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/jml", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/dead-letter", handler: () => ({ data: { items: [] } }) },
  { pattern: "/api/health", handler: () => ({ status: "healthy" }) },
  { pattern: "/api/v1/platform/health-deep", handler: () => ({ status: "healthy", services: {} }) },
];

export function getDemoResponse(url: string, method: string): Response | null {
  resetCounter();
  const urlPath = url.split("?")[0];

  for (const route of routes) {
    let matched = false;
    if (typeof route.pattern === "string") {
      matched = urlPath === route.pattern || urlPath.startsWith(route.pattern + "/") || urlPath.startsWith(route.pattern + "?");
    } else {
      matched = route.pattern.test(urlPath);
    }
    if (matched) {
      const body = route.handler(url, method);
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  return null;
}
