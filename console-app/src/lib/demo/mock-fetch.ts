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
import {
  getDirectoryUsersResponse,
  getDirectoryGroupsResponse,
  getDirectorySyncStatusResponse,
} from "./data/directory";
import {
  getAutomationRulesResponse,
  getAutomationStatsResponse,
  getAutomationRunsResponse,
} from "./data/automation";
import { getPoliciesResponse, getPolicyDetailResponse } from "./data/policies";
import {
  getAccessReviewsResponse,
  getAccessReviewItemsResponse,
  getAccessRequestsResponse,
} from "./data/access";
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
  { pattern: "/api/user/preferences", handler: () => getUserProfileResponse() },
  { pattern: "/api/user", handler: () => getUserProfileResponse() },
  { pattern: "/api/v1/dashboard", handler: () => getDashboardResponse() },
  {
    pattern: "/api/compliance/api/v1/compliance-packs/history/aggregate",
    handler: () => getComplianceTrendResponse(),
  },
  {
    pattern: "/api/compliance/api/v1/compliance-packs/registry/controls",
    handler: () => getControlsRegistryResponse(),
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/compliance-packs\/([^/]+)\/evaluate$/,
    handler: () => ({
      status: "success",
      data: {
        packId: "soc2",
        controlCount: 42,
        passCount: 38,
        failCount: 2,
        unknownCount: 2,
        score: 90,
        durationMs: 234,
      },
    }),
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/compliance-packs\/([^/]+)$/,
    handler: (url: string) => {
      const match = url.match(/\/compliance-packs\/([^/?]+)/);
      const packId = match?.[1] ?? "soc2";
      const packs = getCompliancePacksResponse();
      const pack = packs.data?.installed?.find((p: any) => p.id === packId);
      return { status: "success", data: pack ?? null };
    },
  },
  {
    pattern: "/api/compliance/api/v1/compliance-packs",
    handler: () => getCompliancePacksResponse(),
  },
  {
    pattern: "/api/compliance/api/v1/compliance/summary",
    handler: () => getComplianceSummaryResponse(),
  },
  { pattern: "/api/compliance/api/v1/evidence", handler: () => getEvidenceResponse() },
  { pattern: "/api/tenant-compliance/scores", handler: () => getComplianceScoresResponse() },
  {
    pattern: "/api/compliance/api/v1/policies/coverage",
    handler: () => getComplianceScoresResponse(),
  },
  {
    pattern: "/api/compliance/api/v1/compliance-packs/history",
    handler: () => getComplianceTrendResponse(),
  },
  {
    pattern: /^\/api\/compliance\/api\/v1\/policies\/([^/]+)\/acknowledgements/,
    handler: () => ({
      status: "success",
      data: {
        items: [
          {
            id: "att-1",
            policy_id: "demo-pol-1",
            acknowledged_by: "alex@acmecorp.io",
            acknowledged_at: "2026-04-01T10:00:00Z",
            version: "1.0",
          },
        ],
      },
    }),
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
  {
    pattern: "/orchestrator/api/v1/automation/rules",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAutomationRulesResponse();
    },
  },
  { pattern: "/orchestrator/api/v1/automation/runs", handler: () => getAutomationRunsResponse() },
  {
    pattern: "/api/compliance/api/v1/access-reviews",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessReviewsResponse();
    },
  },
  {
    pattern: "/api/compliance/api/v1/access-requests",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessRequestsResponse();
    },
  },
  {
    pattern: /^\/api\/access-reviews\/[^/]+\/items/,
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessReviewItemsResponse();
    },
  },
  {
    pattern: /^\/api\/access-reviews\/[^/]+\/decisions/,
    handler: () => MUTATE_SUCCESS,
  },
  {
    pattern: "/api/access-reviews",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessReviewsResponse();
    },
  },
  {
    pattern: "/api/access-requests",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getAccessRequestsResponse();
    },
  },
  {
    pattern: "/api/compliance/api/v1/incidents",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getIncidentsResponse();
    },
  },
  { pattern: "/api/v1/apps/integrations", handler: () => getIntegrationsResponse() },
  { pattern: "/api/v1/apps/status", handler: () => getAppsStatusResponse() },
  { pattern: "/api/apps/status", handler: () => getAppsStatusResponse() },
  { pattern: "/api/v1/apps/connect", handler: () => MUTATE_SUCCESS },
  { pattern: "/api/v1/apps/disconnect", handler: () => MUTATE_SUCCESS },
  { pattern: "/api/v1/apps/test", handler: () => ({ data: { healthy: true } }) },
  { pattern: "/api/v1/marketplace", handler: () => getMarketplaceResponse() },
  { pattern: "/api/marketplace", handler: () => getMarketplaceResponse() },
  {
    pattern: "/api/v1/tenant/settings",
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return getSettingsResponse();
    },
  },
  { pattern: "/api/v1/tenant/sso", handler: () => ({ data: { enabled: false, provider: null } }) },
  { pattern: "/api/v1/billing", handler: () => getBillingResponse() },
  { pattern: "/api/v1/billing/seats", handler: () => getBillingResponse() },
  { pattern: "/api/compliance/api/v1/notifications", handler: () => getNotificationsResponse() },
  { pattern: "/api/notifications", handler: () => getNotificationsResponse() },
  { pattern: "/api/v1/audit-log", handler: () => getAuditLogResponse() },
  { pattern: "/api/tenant/audit-log", handler: () => getAuditLogResponse() },
  {
    pattern: "/api/v1/auth/mfa/status",
    handler: () => ({ data: { enabled: true, method: "totp" } }),
  },
  {
    pattern: "/api/v1/auth/forgot-password",
    handler: () => ({ status: "success", message: "Reset link sent" }),
  },
  { pattern: "/orchestrator/api/v1/events", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/nhi/discover", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/nhi", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/jml/changelog", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/jml/policy", handler: () => ({ data: { policy: null } }) },
  { pattern: "/orchestrator/api/v1/jml/runs", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/jml", handler: () => ({ data: { items: [] } }) },
  { pattern: "/orchestrator/api/v1/automation/runs", handler: () => getAutomationRunsResponse() },
  { pattern: "/orchestrator/api/v1/dead-letter", handler: () => ({ data: { items: [] } }) },
  { pattern: "/api/health", handler: () => ({ status: "healthy" }) },
  { pattern: "/api/v1/platform/health-deep", handler: () => ({ status: "healthy", services: {} }) },
  // Questionnaire AI
  {
    pattern: "/api/v1/trust/questionnaire/list",
    handler: () => ({
      status: "success",
      questionnaires: [
        {
          id: "demo-q-1",
          name: "Acme Corp Vendor Security Review",
          question_count: 12,
          source_format: "text",
          created_at: "2026-04-15T14:30:00Z",
        },
        {
          id: "demo-q-2",
          name: "BigBank Third-Party Risk Assessment",
          question_count: 8,
          source_format: "csv",
          created_at: "2026-04-10T09:00:00Z",
        },
      ],
    }),
  },
  {
    pattern: "/api/v1/trust/questionnaire/parse",
    handler: () => ({
      mappings: [
        {
          questionIndex: 0,
          questionText: "Do you enforce multi-factor authentication for all users?",
          section: "ACCESS CONTROL",
          mappedControls: ["CC6.2", "A.9.4.2"],
          confidence: 0.6,
        },
        {
          questionIndex: 1,
          questionText: "How do you handle access removal upon employee termination?",
          section: "ACCESS CONTROL",
          mappedControls: ["CC6.3"],
          confidence: 0.3,
        },
        {
          questionIndex: 2,
          questionText: "Describe your vulnerability management and scanning process.",
          section: "SECURITY OPERATIONS",
          mappedControls: ["CC7.1", "CC7.2"],
          confidence: 0.6,
        },
        {
          questionIndex: 3,
          questionText: "What incident response procedures are in place?",
          section: "SECURITY OPERATIONS",
          mappedControls: ["CC7.3"],
          confidence: 0.3,
        },
        {
          questionIndex: 4,
          questionText: "How is sensitive data encrypted at rest and in transit?",
          section: "DATA PROTECTION",
          mappedControls: ["Art.5(1)(f)"],
          confidence: 0.3,
        },
      ],
      questionnaireId: "demo-q-new",
    }),
  },
  {
    pattern: "/api/v1/trust/questionnaire/generate",
    handler: () => ({
      responses: [
        {
          questionIndex: 0,
          questionText: "Do you enforce multi-factor authentication for all users?",
          response:
            "Yes. All users are required to authenticate using TOTP-based multi-factor authentication. Our platform enforces MFA at login for all roles including administrators. 47 MFA enrollment records collected in the last 90 days confirm active enforcement.",
          evidenceRefs: ["CC6.2", "A.9.4.2"],
          mappedControls: ["CC6.2", "A.9.4.2"],
        },
        {
          questionIndex: 1,
          questionText: "How do you handle access removal upon employee termination?",
          response:
            "Access is revoked within 24 hours of termination through automated JML (Joiner/Mover/Leaver) workflows. Our system integrates with Okta and Azure AD to automatically disable accounts and revoke all access grants when an employee's status changes to terminated.",
          evidenceRefs: ["CC6.3"],
          mappedControls: ["CC6.3"],
        },
        {
          questionIndex: 2,
          questionText: "Describe your vulnerability management and scanning process.",
          response:
            "We run continuous vulnerability scans via CrowdStrike and Qualys integrations. Configuration changes are monitored in real-time, with alerts triggered for any deviation from baseline. 23 configuration audit records from the last 90 days.",
          evidenceRefs: ["CC7.1", "CC7.2"],
          mappedControls: ["CC7.1", "CC7.2"],
        },
        {
          questionIndex: 3,
          questionText: "What incident response procedures are in place?",
          response:
            "We maintain a documented incident response plan with defined severity levels, escalation paths, and communication templates. Incidents are tracked through our compliance platform with SLA-based resolution targets. Post-incident reviews are conducted for all P1/P2 incidents.",
          evidenceRefs: ["CC7.3"],
          mappedControls: ["CC7.3"],
        },
        {
          questionIndex: 4,
          questionText: "How is sensitive data encrypted at rest and in transit?",
          response:
            "All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Database encryption is managed through AWS KMS with automatic key rotation. Evidence of encryption configuration is continuously collected from our infrastructure adapters.",
          evidenceRefs: ["Art.5(1)(f)"],
          mappedControls: ["Art.5(1)(f)"],
        },
      ],
    }),
  },
  { pattern: "/api/v1/trust/questionnaire/feedback", handler: () => MUTATE_SUCCESS },
  // Tenant info (for trust settings page)
  {
    pattern: /^\/api\/v1\/tenants\//,
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return {
        data: {
          id: "demo-tenant-001",
          name: "Acme Corp",
          slug: "acme-corp",
          config: { trust_center_public: true },
        },
      };
    },
  },
  // Trust center access requests
  { pattern: "/api/compliance/api/v1/trust/access-requests", handler: () => ({ requests: [] }) },
  // Catch-all for compliance-packs operations (install/uninstall)
  {
    pattern: /^\/api\/compliance\/api\/v1\/compliance-packs\/[^/]+\/(install|uninstall)$/,
    handler: () => MUTATE_SUCCESS,
  },
  // Catch-all for any unmapped POST/PUT/PATCH/DELETE operations
  {
    pattern: /.*/,
    handler: (_, method) => {
      if (method !== "GET") return MUTATE_SUCCESS;
      return { status: "success", data: null, items: [] };
    },
  },
];

export function getDemoResponse(url: string, method: string): Response | null {
  resetCounter();
  const urlPath = url.split("?")[0];

  for (const route of routes) {
    let matched = false;
    if (typeof route.pattern === "string") {
      matched =
        urlPath === route.pattern ||
        urlPath.startsWith(route.pattern + "/") ||
        urlPath.startsWith(route.pattern + "?");
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
