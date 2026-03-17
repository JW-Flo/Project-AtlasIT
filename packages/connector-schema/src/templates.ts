import type { ConnectorManifest } from "./manifest.js";

// ---------------------------------------------------------------------------
// Existing manifests (Slack, Google Workspace, Okta)
// ---------------------------------------------------------------------------

export const SLACK_MANIFEST: ConnectorManifest = {
  id: "slack",
  name: "Slack",
  slug: "slack",
  version: "1.0.0",
  description:
    "Integrate with Slack for team notifications, approval workflows, and incident communication",
  provider: "Slack Technologies",
  category: "communication",
  logoUrl: "https://cdn.atlasit.dev/connectors/slack.svg",
  documentationUrl: "https://api.slack.com/docs",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      scopes: [
        "chat:write",
        "channels:read",
        "users:read",
        "users:read.email",
        "im:write",
      ],
      clientIdEnvVar: "SLACK_CLIENT_ID",
      clientSecretEnvVar: "SLACK_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["notifications", "approvals"],
  configFields: [
    {
      key: "defaultChannel",
      label: "Default Channel",
      type: "string",
      required: false,
      description: "Default Slack channel for notifications (e.g., #it-alerts)",
    },
    {
      key: "notifyOnIncident",
      label: "Notify on Incident",
      type: "boolean",
      required: false,
      description: "Send Slack messages when incidents are created",
      default: true,
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/slack/events",
      method: "POST",
      description: "Receives Slack event callbacks",
      authRequired: true,
    },
    {
      path: "/webhooks/slack/interactions",
      method: "POST",
      description: "Receives Slack interactive component payloads",
      authRequired: true,
    },
  ],
  events: {
    emits: ["notification.sent", "approval.requested", "approval.completed"],
    subscribes: [
      "incident.created",
      "incident.updated",
      "access-request.created",
      "approval.needed",
    ],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 1,
    burstSize: 5,
  },
  minimumTier: "starter",
};

export const GOOGLE_WORKSPACE_MANIFEST: ConnectorManifest = {
  id: "google-workspace",
  name: "Google Workspace",
  slug: "google-workspace",
  version: "1.0.0",
  description:
    "Sync users and groups from Google Workspace directory, enable SSO, and automate provisioning",
  provider: "Google",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/google-workspace.svg",
  documentationUrl: "https://developers.google.com/admin-sdk",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.group",
        "https://www.googleapis.com/auth/admin.directory.orgunit",
      ],
      clientIdEnvVar: "GOOGLE_CLIENT_ID",
      clientSecretEnvVar: "GOOGLE_CLIENT_SECRET",
      pkce: true,
    },
  },
  capabilities: ["user-provisioning", "group-sync", "sso"],
  configFields: [
    {
      key: "domain",
      label: "Google Workspace Domain",
      type: "string",
      required: true,
      description: "Your Google Workspace domain (e.g., company.com)",
      validation: {
        pattern: "^[a-zA-Z0-9][a-zA-Z0-9-]*\\.[a-zA-Z]{2,}$",
      },
    },
    {
      key: "adminEmail",
      label: "Admin Email",
      type: "string",
      required: true,
      description: "Google Workspace admin email for delegated access",
    },
    {
      key: "syncInterval",
      label: "Sync Interval (minutes)",
      type: "number",
      required: false,
      description: "How often to sync directory data",
      default: 60,
      validation: {
        min: 15,
        max: 1440,
      },
    },
  ],
  events: {
    emits: ["user.provisioned", "user.deprovisioned", "group.synced"],
    subscribes: ["user.created", "user.deleted", "group.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const OKTA_MANIFEST: ConnectorManifest = {
  id: "okta",
  name: "Okta",
  slug: "okta",
  version: "1.0.0",
  description:
    "Connect Okta for user lifecycle management, group synchronization, and SSO federation",
  provider: "Okta",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/okta.svg",
  documentationUrl: "https://developer.okta.com/docs/",
  auth: {
    model: "api_key",
    apiKey: {
      headerName: "Authorization",
      prefix: "SSWS",
      envVar: "OKTA_API_TOKEN",
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-management",
    "sso",
  ],
  configFields: [
    {
      key: "orgUrl",
      label: "Okta Org URL",
      type: "url",
      required: true,
      description:
        "Your Okta organization URL (e.g., https://company.okta.com)",
    },
    {
      key: "defaultGroupId",
      label: "Default Group ID",
      type: "string",
      required: false,
      description: "Okta group ID to assign new users to by default",
    },
    {
      key: "deprovisionAction",
      label: "Deprovisioning Action",
      type: "select",
      required: true,
      description: "What to do when a user is deprovisioned",
      default: "suspend",
      options: ["suspend", "deactivate", "delete"],
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/okta/events",
      method: "POST",
      description: "Receives Okta event hook payloads",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "user.suspended",
      "group.updated",
    ],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 50,
    burstSize: 75,
  },
  minimumTier: "professional",
};

// ---------------------------------------------------------------------------
// Productivity
// ---------------------------------------------------------------------------

export const MICROSOFT_365_MANIFEST: ConnectorManifest = {
  id: "microsoft-365",
  name: "Microsoft 365",
  slug: "microsoft-365",
  version: "1.0.0",
  description:
    "Manage users, groups, and licenses via Microsoft Graph API for Microsoft 365 tenants",
  provider: "Microsoft",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/microsoft-365.svg",
  documentationUrl: "https://learn.microsoft.com/en-us/graph/overview",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      scopes: [
        "User.ReadWrite.All",
        "Group.ReadWrite.All",
        "Directory.ReadWrite.All",
        "Organization.Read.All",
      ],
      clientIdEnvVar: "MICROSOFT_CLIENT_ID",
      clientSecretEnvVar: "MICROSOFT_CLIENT_SECRET",
      pkce: true,
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-sync",
    "sso",
  ],
  configFields: [
    {
      key: "tenantId",
      label: "Azure AD Tenant ID",
      type: "string",
      required: true,
      description: "Your Azure AD tenant ID (GUID)",
    },
    {
      key: "syncInterval",
      label: "Sync Interval (minutes)",
      type: "number",
      required: false,
      description: "How often to sync directory data",
      default: 30,
      validation: { min: 15, max: 1440 },
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/microsoft/notifications",
      method: "POST",
      description: "Receives Microsoft Graph change notifications",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "group.synced",
      "license.assigned",
    ],
    subscribes: [
      "user.created",
      "user.deleted",
      "user.updated",
      "group.updated",
    ],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 20,
    burstSize: 40,
  },
  minimumTier: "professional",
};

export const JIRA_MANIFEST: ConnectorManifest = {
  id: "jira",
  name: "Jira",
  slug: "jira",
  version: "1.0.0",
  description:
    "Manage Atlassian Cloud users and project access via SCIM and REST API",
  provider: "Atlassian",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/jira.svg",
  documentationUrl:
    "https://developer.atlassian.com/cloud/jira/platform/rest/v3/",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      scopes: [
        "read:jira-user",
        "write:jira-work",
        "manage:jira-project",
        "read:me",
      ],
      clientIdEnvVar: "JIRA_CLIENT_ID",
      clientSecretEnvVar: "JIRA_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-sync",
    "issue-tracking",
  ],
  configFields: [
    {
      key: "cloudId",
      label: "Atlassian Cloud ID",
      type: "string",
      required: true,
      description: "Your Atlassian Cloud site ID",
    },
    {
      key: "directoryId",
      label: "SCIM Directory ID",
      type: "string",
      required: false,
      description:
        "Directory ID for SCIM provisioning (requires Atlassian Guard)",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/jira/events",
      method: "POST",
      description: "Receives Jira webhook event payloads",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "issue.created",
      "issue.updated",
    ],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const CONFLUENCE_MANIFEST: ConnectorManifest = {
  id: "confluence",
  name: "Confluence",
  slug: "confluence",
  version: "1.0.0",
  description:
    "Manage Confluence Cloud space permissions and user access via Atlassian Admin API",
  provider: "Atlassian",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/confluence.svg",
  documentationUrl:
    "https://developer.atlassian.com/cloud/confluence/rest/v2/intro/",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      scopes: [
        "read:confluence-space.summary",
        "read:confluence-content.all",
        "write:confluence-space",
        "read:confluence-user",
        "manage:confluence-configuration",
        "read:me",
      ],
      clientIdEnvVar: "CONFLUENCE_CLIENT_ID",
      clientSecretEnvVar: "CONFLUENCE_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
  configFields: [
    {
      key: "cloudId",
      label: "Atlassian Cloud ID",
      type: "string",
      required: true,
      description: "Your Atlassian Cloud site ID",
    },
    {
      key: "directoryId",
      label: "SCIM Directory ID",
      type: "string",
      required: false,
      description:
        "Directory ID for SCIM provisioning (requires Atlassian Guard)",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/confluence/events",
      method: "POST",
      description: "Receives Confluence webhook event payloads",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "space.permission.updated",
    ],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const QUICKBOOKS_MANIFEST: ConnectorManifest = {
  id: "quickbooks",
  name: "QuickBooks",
  slug: "quickbooks",
  version: "1.0.0",
  description: "Manage employee records in QuickBooks Online via Intuit OAuth",
  provider: "Intuit",
  category: "custom",
  logoUrl: "https://cdn.atlasit.dev/connectors/quickbooks.svg",
  documentationUrl:
    "https://developer.intuit.com/app/developer/qbo/docs/get-started",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://appcenter.intuit.com/connect/oauth2",
      tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      scopes: ["com.intuit.quickbooks.accounting"],
      clientIdEnvVar: "QUICKBOOKS_CLIENT_ID",
      clientSecretEnvVar: "QUICKBOOKS_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["user-provisioning", "directory-sync"],
  configFields: [
    {
      key: "realmId",
      label: "Company ID (Realm ID)",
      type: "string",
      required: true,
      description: "Your QuickBooks Online company ID",
    },
  ],
  events: {
    emits: ["employee.synced", "employee.created"],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const XERO_MANIFEST: ConnectorManifest = {
  id: "xero",
  name: "Xero",
  slug: "xero",
  version: "1.0.0",
  description: "Manage payroll employees and contacts via Xero Payroll API",
  provider: "Xero",
  category: "custom",
  logoUrl: "https://cdn.atlasit.dev/connectors/xero.svg",
  documentationUrl: "https://developer.xero.com/documentation/",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://login.xero.com/identity/connect/authorize",
      tokenUrl: "https://identity.xero.com/connect/token",
      scopes: [
        "openid",
        "profile",
        "email",
        "payroll.employees",
        "payroll.settings",
      ],
      clientIdEnvVar: "XERO_CLIENT_ID",
      clientSecretEnvVar: "XERO_CLIENT_SECRET",
      pkce: true,
    },
  },
  capabilities: ["user-provisioning", "directory-sync"],
  configFields: [
    {
      key: "tenantId",
      label: "Xero Tenant ID",
      type: "string",
      required: true,
      description: "Your Xero organization tenant ID",
    },
  ],
  events: {
    emits: ["employee.synced", "employee.created"],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
  },
  minimumTier: "professional",
};

// ---------------------------------------------------------------------------
// Communication
// ---------------------------------------------------------------------------

export const ZOOM_MANIFEST: ConnectorManifest = {
  id: "zoom",
  name: "Zoom",
  slug: "zoom",
  version: "1.0.0",
  description:
    "Provision and manage Zoom users, including activation and deactivation",
  provider: "Zoom Video Communications",
  category: "communication",
  logoUrl: "https://cdn.atlasit.dev/connectors/zoom.svg",
  documentationUrl: "https://developers.zoom.us/docs/",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://zoom.us/oauth/authorize",
      tokenUrl: "https://zoom.us/oauth/token",
      scopes: [
        "user:read:admin",
        "user:write:admin",
        "group:read:admin",
        "group:write:admin",
      ],
      clientIdEnvVar: "ZOOM_CLIENT_ID",
      clientSecretEnvVar: "ZOOM_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
  configFields: [
    {
      key: "accountId",
      label: "Zoom Account ID",
      type: "string",
      required: true,
      description: "Your Zoom account ID for Server-to-Server OAuth",
    },
    {
      key: "defaultUserType",
      label: "Default User Type",
      type: "select",
      required: false,
      description: "License type for new users",
      default: "Licensed",
      options: ["Basic", "Licensed", "On-Prem"],
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/zoom/events",
      method: "POST",
      description: "Receives Zoom event notifications",
      authRequired: true,
    },
  ],
  events: {
    emits: ["user.provisioned", "user.deprovisioned", "user.activated"],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 30,
  },
  minimumTier: "professional",
};

export const TEAMS_MANIFEST: ConnectorManifest = {
  id: "teams",
  name: "Microsoft Teams",
  slug: "teams",
  version: "1.0.0",
  description: "Manage Teams memberships and channels via Microsoft Graph API",
  provider: "Microsoft",
  category: "communication",
  logoUrl: "https://cdn.atlasit.dev/connectors/teams.svg",
  documentationUrl:
    "https://learn.microsoft.com/en-us/graph/teams-concept-overview",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      scopes: [
        "Team.ReadBasic.All",
        "TeamMember.ReadWrite.All",
        "Channel.ReadBasic.All",
        "Group.ReadWrite.All",
      ],
      clientIdEnvVar: "TEAMS_CLIENT_ID",
      clientSecretEnvVar: "TEAMS_CLIENT_SECRET",
      pkce: true,
    },
  },
  capabilities: ["user-provisioning", "group-sync", "notifications"],
  configFields: [
    {
      key: "tenantId",
      label: "Azure AD Tenant ID",
      type: "string",
      required: true,
      description: "Your Azure AD tenant ID (GUID)",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/teams/notifications",
      method: "POST",
      description: "Receives Microsoft Graph change notifications for Teams",
      authRequired: true,
    },
  ],
  events: {
    emits: ["team.member.added", "team.member.removed", "notification.sent"],
    subscribes: ["user.created", "user.deleted", "group.updated"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 20,
    burstSize: 40,
  },
  minimumTier: "professional",
};

export const DISCORD_MANIFEST: ConnectorManifest = {
  id: "discord",
  name: "Discord",
  slug: "discord",
  version: "1.0.0",
  description: "Manage Discord server members and role assignments via Bot API",
  provider: "Discord",
  category: "communication",
  logoUrl: "https://cdn.atlasit.dev/connectors/discord.svg",
  documentationUrl: "https://discord.com/developers/docs",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://discord.com/oauth2/authorize",
      tokenUrl: "https://discord.com/api/v10/oauth2/token",
      scopes: ["bot", "guilds", "guilds.members.read"],
      clientIdEnvVar: "DISCORD_CLIENT_ID",
      clientSecretEnvVar: "DISCORD_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["user-provisioning", "group-sync", "notifications"],
  configFields: [
    {
      key: "guildId",
      label: "Server (Guild) ID",
      type: "string",
      required: true,
      description: "Your Discord server ID",
    },
    {
      key: "botToken",
      label: "Bot Token",
      type: "secret",
      required: true,
      description: "Discord bot token for API access",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/discord/interactions",
      method: "POST",
      description: "Receives Discord interaction payloads",
      authRequired: true,
    },
  ],
  events: {
    emits: ["member.added", "member.removed", "role.assigned"],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
  },
  minimumTier: "starter",
};

// ---------------------------------------------------------------------------
// HR
// ---------------------------------------------------------------------------

export const BAMBOOHR_MANIFEST: ConnectorManifest = {
  id: "bamboohr",
  name: "BambooHR",
  slug: "bamboohr",
  version: "1.0.0",
  description:
    "Sync employee records and detect new hires, role changes, and terminations",
  provider: "BambooHR",
  category: "custom",
  logoUrl: "https://cdn.atlasit.dev/connectors/bamboohr.svg",
  documentationUrl: "https://documentation.bamboohr.com/docs",
  auth: {
    model: "api_key",
    apiKey: {
      headerName: "Authorization",
      prefix: "Basic",
      envVar: "BAMBOOHR_API_KEY",
    },
  },
  capabilities: ["directory-sync", "user-provisioning"],
  configFields: [
    {
      key: "companyDomain",
      label: "Company Subdomain",
      type: "string",
      required: true,
      description: "Your BambooHR subdomain (e.g., yourcompany)",
    },
    {
      key: "syncInterval",
      label: "Sync Interval (minutes)",
      type: "number",
      required: false,
      description: "How often to sync employee data",
      default: 60,
      validation: { min: 15, max: 1440 },
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/bamboohr/events",
      method: "POST",
      description: "Receives BambooHR webhook notifications",
      authRequired: true,
    },
  ],
  events: {
    emits: ["employee.hired", "employee.terminated", "employee.updated"],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
  },
  minimumTier: "professional",
};

export const WORKDAY_MANIFEST: ConnectorManifest = {
  id: "workday",
  name: "Workday",
  slug: "workday",
  version: "1.0.0",
  description:
    "Connect to Workday HCM for worker lifecycle events and org structure",
  provider: "Workday",
  category: "custom",
  logoUrl: "https://cdn.atlasit.dev/connectors/workday.svg",
  documentationUrl:
    "https://community.workday.com/sites/default/files/file-hosting/restapi/",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://{tenant}.workday.com/authorize",
      tokenUrl: "https://{tenant}.workday.com/oauth2/{tenant}/token",
      scopes: ["Human_Resources", "Staffing"],
      clientIdEnvVar: "WORKDAY_CLIENT_ID",
      clientSecretEnvVar: "WORKDAY_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["directory-sync", "user-provisioning", "user-deprovisioning"],
  configFields: [
    {
      key: "tenantUrl",
      label: "Tenant URL",
      type: "url",
      required: true,
      description: "Your Workday tenant base URL",
    },
    {
      key: "tenantName",
      label: "Tenant Name",
      type: "string",
      required: true,
      description: "Your Workday tenant name",
    },
    {
      key: "syncInterval",
      label: "Sync Interval (minutes)",
      type: "number",
      required: false,
      description: "How often to sync worker data",
      default: 60,
      validation: { min: 30, max: 1440 },
    },
  ],
  events: {
    emits: [
      "worker.hired",
      "worker.terminated",
      "worker.updated",
      "org.changed",
    ],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
  },
  minimumTier: "enterprise",
};

export const ADP_MANIFEST: ConnectorManifest = {
  id: "adp",
  name: "ADP",
  slug: "adp",
  version: "1.0.0",
  description: "Sync worker hire, terminate, and rehire events via ADP APIs",
  provider: "ADP",
  category: "custom",
  logoUrl: "https://cdn.atlasit.dev/connectors/adp.svg",
  documentationUrl: "https://developers.adp.com/",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://accounts.adp.com/auth/oauth/v2/authorize",
      tokenUrl: "https://accounts.adp.com/auth/oauth/v2/token",
      scopes: ["api"],
      clientIdEnvVar: "ADP_CLIENT_ID",
      clientSecretEnvVar: "ADP_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["directory-sync", "user-provisioning", "user-deprovisioning"],
  configFields: [
    {
      key: "sslCert",
      label: "SSL Certificate (PEM)",
      type: "secret",
      required: true,
      description:
        "Mutual TLS certificate provided by ADP for API authentication",
    },
    {
      key: "sslKey",
      label: "SSL Private Key (PEM)",
      type: "secret",
      required: true,
      description: "Private key for mutual TLS authentication",
    },
  ],
  events: {
    emits: ["worker.hired", "worker.terminated", "worker.rehired"],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
  },
  minimumTier: "enterprise",
};

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export const STRIPE_MANIFEST: ConnectorManifest = {
  id: "stripe",
  name: "Stripe",
  slug: "stripe",
  version: "1.0.0",
  description:
    "Manage persons on connected accounts for identity verification and billing contexts",
  provider: "Stripe",
  category: "custom",
  logoUrl: "https://cdn.atlasit.dev/connectors/stripe.svg",
  documentationUrl: "https://docs.stripe.com/api",
  auth: {
    model: "api_key",
    apiKey: {
      headerName: "Authorization",
      prefix: "Bearer",
      envVar: "STRIPE_SECRET_KEY",
    },
  },
  capabilities: ["user-provisioning", "directory-sync"],
  configFields: [
    {
      key: "webhookSecret",
      label: "Webhook Signing Secret",
      type: "secret",
      required: false,
      description: "Stripe webhook endpoint signing secret (whsec_...)",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/stripe/events",
      method: "POST",
      description: "Receives Stripe webhook event payloads",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "person.created",
      "person.updated",
      "person.deleted",
      "account.updated",
    ],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 25,
    burstSize: 50,
  },
  minimumTier: "professional",
};

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

export const AUTH0_MANIFEST: ConnectorManifest = {
  id: "auth0",
  name: "Auth0",
  slug: "auth0",
  version: "1.0.0",
  description:
    "Manage users, roles, and organizations via Auth0 Management API",
  provider: "Okta (Auth0)",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/auth0.svg",
  documentationUrl: "https://auth0.com/docs/api/management/v2",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://{domain}/authorize",
      tokenUrl: "https://{domain}/oauth/token",
      scopes: [
        "read:users",
        "create:users",
        "update:users",
        "delete:users",
        "read:roles",
        "create:role_members",
        "delete:role_members",
        "read:organizations",
      ],
      clientIdEnvVar: "AUTH0_CLIENT_ID",
      clientSecretEnvVar: "AUTH0_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-management",
    "sso",
  ],
  configFields: [
    {
      key: "domain",
      label: "Auth0 Domain",
      type: "url",
      required: true,
      description: "Your Auth0 tenant domain (e.g., your-tenant.auth0.com)",
    },
    {
      key: "defaultConnection",
      label: "Default Connection",
      type: "string",
      required: false,
      description: "Default Auth0 connection for user creation",
      default: "Username-Password-Authentication",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/auth0/events",
      method: "POST",
      description: "Receives Auth0 Log Streaming events",
      authRequired: true,
    },
  ],
  events: {
    emits: ["user.provisioned", "user.deprovisioned", "role.assigned"],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const CROWDSTRIKE_MANIFEST: ConnectorManifest = {
  id: "crowdstrike",
  name: "CrowdStrike",
  slug: "crowdstrike",
  version: "1.0.0",
  description: "Manage Falcon console users and roles for endpoint security",
  provider: "CrowdStrike",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/crowdstrike.svg",
  documentationUrl: "https://falcon.crowdstrike.com/documentation/",
  auth: {
    model: "api_key",
    apiKey: {
      headerName: "Authorization",
      prefix: "Bearer",
      envVar: "CROWDSTRIKE_API_TOKEN",
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "compliance-scanning",
  ],
  configFields: [
    {
      key: "clientId",
      label: "API Client ID",
      type: "string",
      required: true,
      description: "From Falcon Console > API Clients and Keys",
    },
    {
      key: "clientSecret",
      label: "API Client Secret",
      type: "secret",
      required: true,
      description: "CrowdStrike API client secret",
    },
    {
      key: "baseUrl",
      label: "Cloud Region Base URL",
      type: "url",
      required: true,
      description:
        "US-1: api.crowdstrike.com, US-2: api.us-2.crowdstrike.com, EU-1: api.eu-1.crowdstrike.com",
    },
  ],
  events: {
    emits: ["user.provisioned", "user.deprovisioned", "detection.created"],
    subscribes: ["user.created", "user.deleted"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const ONEPASSWORD_MANIFEST: ConnectorManifest = {
  id: "1password",
  name: "1Password",
  slug: "1password",
  version: "1.0.0",
  description:
    "Manage 1Password team members, groups, and vault access policies",
  provider: "1Password",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/1password.svg",
  documentationUrl: "https://developer.1password.com/docs/connect/",
  auth: {
    model: "api_key",
    apiKey: {
      headerName: "Authorization",
      prefix: "Bearer",
      envVar: "ONEPASSWORD_SERVICE_TOKEN",
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-management",
  ],
  configFields: [
    {
      key: "connectHost",
      label: "Connect Server URL",
      type: "url",
      required: false,
      description:
        "URL for 1Password Connect Server (if self-hosted SCIM bridge)",
    },
    {
      key: "scimBridgeUrl",
      label: "SCIM Bridge URL",
      type: "url",
      required: false,
      description: "URL for 1Password SCIM Bridge (for provisioning)",
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "group.updated",
      "vault.access.changed",
    ],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const PAGERDUTY_MANIFEST: ConnectorManifest = {
  id: "pagerduty",
  name: "PagerDuty",
  slug: "pagerduty",
  version: "1.0.0",
  description:
    "Manage PagerDuty users and team assignments for incident response",
  provider: "PagerDuty",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/pagerduty.svg",
  documentationUrl: "https://developer.pagerduty.com/docs/rest-api-v2/",
  auth: {
    model: "api_key",
    apiKey: {
      headerName: "Authorization",
      prefix: "Token token=",
      envVar: "PAGERDUTY_API_KEY",
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "incident-management",
  ],
  configFields: [
    {
      key: "defaultRole",
      label: "Default User Role",
      type: "select",
      required: false,
      description: "Default role for new PagerDuty users",
      default: "limited_user",
      options: [
        "admin",
        "limited_user",
        "observer",
        "owner",
        "read_only_limited_user",
        "read_only_user",
        "restricted_access",
        "user",
      ],
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/pagerduty/events",
      method: "POST",
      description: "Receives PagerDuty V3 webhook events",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "incident.triggered",
      "incident.resolved",
    ],
    subscribes: ["user.created", "user.deleted", "incident.created"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 15,
    burstSize: 30,
  },
  minimumTier: "professional",
};

export const DATADOG_MANIFEST: ConnectorManifest = {
  id: "datadog",
  name: "Datadog",
  slug: "datadog",
  version: "1.0.0",
  description:
    "Manage Datadog users and role assignments for observability access control",
  provider: "Datadog",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/datadog.svg",
  documentationUrl: "https://docs.datadoghq.com/api/latest/",
  auth: {
    model: "api_key",
    apiKey: {
      headerName: "DD-API-KEY",
      envVar: "DATADOG_API_KEY",
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-management",
  ],
  configFields: [
    {
      key: "appKey",
      label: "Application Key",
      type: "secret",
      required: true,
      description: "Datadog Application Key for management API access",
    },
    {
      key: "site",
      label: "Datadog Site",
      type: "string",
      required: true,
      description: "datadoghq.com (US1), us3.datadoghq.com, datadoghq.eu, etc.",
    },
  ],
  events: {
    emits: ["user.provisioned", "user.deprovisioned", "role.assigned"],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: ["onInstall", "onUninstall", "onEnable", "onDisable"],
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
  },
  minimumTier: "professional",
};

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

export const AWS_MANIFEST: ConnectorManifest = {
  id: "aws",
  name: "AWS",
  slug: "aws",
  version: "1.0.0",
  description: "Manage IAM users, groups, roles, and policies for AWS accounts",
  provider: "Amazon Web Services",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/aws.svg",
  documentationUrl: "https://docs.aws.amazon.com/IAM/latest/APIReference/",
  auth: {
    model: "service_account",
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-management",
  ],
  configFields: [
    {
      key: "accessKeyId",
      label: "Access Key ID",
      type: "string",
      required: true,
      description: "AWS IAM access key ID",
    },
    {
      key: "secretAccessKey",
      label: "Secret Access Key",
      type: "secret",
      required: true,
      description: "AWS IAM secret access key",
    },
    {
      key: "region",
      label: "Region",
      type: "string",
      required: false,
      description: "AWS region for STS (IAM is global)",
      default: "us-east-1",
    },
    {
      key: "roleArn",
      label: "Role ARN (optional)",
      type: "string",
      required: false,
      description: "For cross-account access via STS AssumeRole",
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "policy.attached",
      "group.updated",
    ],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 5,
    burstSize: 10,
  },
  minimumTier: "professional",
};

export const GCP_MANIFEST: ConnectorManifest = {
  id: "gcp",
  name: "GCP",
  slug: "gcp",
  version: "1.0.0",
  description:
    "Manage Cloud Identity users and groups via Admin SDK with domain-wide delegation",
  provider: "Google Cloud",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/gcp.svg",
  documentationUrl: "https://cloud.google.com/identity/docs/reference/rest",
  auth: {
    model: "service_account",
  },
  capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
  configFields: [
    {
      key: "clientEmail",
      label: "Service Account Email",
      type: "string",
      required: true,
      description: "GCP service account email address",
    },
    {
      key: "privateKey",
      label: "Service Account Key (JSON)",
      type: "secret",
      required: true,
      description: "Full JSON key file contents for the service account",
    },
    {
      key: "customerId",
      label: "Workspace Customer ID",
      type: "string",
      required: true,
      description: "Found in Admin Console > Account > Account settings",
    },
    {
      key: "adminEmail",
      label: "Admin Email",
      type: "string",
      required: true,
      description: "Super Admin email for domain-wide delegation",
    },
  ],
  events: {
    emits: ["user.provisioned", "user.deprovisioned", "group.synced"],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 10,
    burstSize: 20,
  },
  minimumTier: "professional",
};

export const AZURE_MANIFEST: ConnectorManifest = {
  id: "azure",
  name: "Azure",
  slug: "azure",
  version: "1.0.0",
  description:
    "Manage Entra ID users and groups, subscription access via Microsoft Graph and Azure Resource Manager",
  provider: "Microsoft",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/azure.svg",
  documentationUrl: "https://learn.microsoft.com/en-us/rest/api/azure/",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl:
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      scopes: [
        "User.ReadWrite.All",
        "Group.ReadWrite.All",
        "Directory.ReadWrite.All",
        "https://management.azure.com/.default",
      ],
      clientIdEnvVar: "AZURE_CLIENT_ID",
      clientSecretEnvVar: "AZURE_CLIENT_SECRET",
      pkce: true,
    },
  },
  capabilities: [
    "user-provisioning",
    "user-deprovisioning",
    "group-sync",
    "sso",
  ],
  configFields: [
    {
      key: "tenantId",
      label: "Azure AD Tenant ID",
      type: "string",
      required: true,
      description: "Your Azure AD tenant ID (GUID)",
    },
    {
      key: "subscriptionId",
      label: "Subscription ID",
      type: "string",
      required: false,
      description: "Azure subscription ID for resource access management",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/azure/notifications",
      method: "POST",
      description: "Receives Microsoft Graph change notifications",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "user.provisioned",
      "user.deprovisioned",
      "group.synced",
      "rbac.assigned",
    ],
    subscribes: [
      "user.created",
      "user.deleted",
      "user.updated",
      "group.updated",
    ],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 20,
    burstSize: 40,
  },
  minimumTier: "professional",
};

export const GITHUB_MANIFEST: ConnectorManifest = {
  id: "github",
  name: "GitHub",
  slug: "github",
  version: "1.0.0",
  description:
    "Manage organization members and team assignments via GitHub REST API",
  provider: "GitHub",
  category: "identity",
  logoUrl: "https://cdn.atlasit.dev/connectors/github.svg",
  documentationUrl: "https://docs.github.com/en/rest",
  auth: {
    model: "oauth2",
    oauth2: {
      authorizationUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scopes: ["admin:org", "read:org", "write:org", "admin:org_hook"],
      clientIdEnvVar: "GITHUB_CLIENT_ID",
      clientSecretEnvVar: "GITHUB_CLIENT_SECRET",
      pkce: false,
    },
  },
  capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
  configFields: [
    {
      key: "orgName",
      label: "Organization Name",
      type: "string",
      required: true,
      description: "Your GitHub organization name",
    },
    {
      key: "defaultTeamSlug",
      label: "Default Team",
      type: "string",
      required: false,
      description: "Team slug to add new members to by default",
    },
  ],
  webhookEndpoints: [
    {
      path: "/webhooks/github/events",
      method: "POST",
      description: "Receives GitHub organization webhook events",
      authRequired: true,
    },
  ],
  events: {
    emits: [
      "member.added",
      "member.removed",
      "team.member.added",
      "team.member.removed",
    ],
    subscribes: ["user.created", "user.deleted", "user.updated"],
  },
  lifecycle: {
    hooks: [
      "onInstall",
      "onUninstall",
      "onEnable",
      "onDisable",
      "onConfigUpdate",
    ],
  },
  rateLimit: {
    requestsPerSecond: 15,
    burstSize: 30,
  },
  minimumTier: "professional",
};

// ---------------------------------------------------------------------------
// All manifests collection
// ---------------------------------------------------------------------------

export const ALL_MANIFESTS: ConnectorManifest[] = [
  SLACK_MANIFEST,
  GOOGLE_WORKSPACE_MANIFEST,
  OKTA_MANIFEST,
  MICROSOFT_365_MANIFEST,
  JIRA_MANIFEST,
  CONFLUENCE_MANIFEST,
  QUICKBOOKS_MANIFEST,
  XERO_MANIFEST,
  ZOOM_MANIFEST,
  TEAMS_MANIFEST,
  DISCORD_MANIFEST,
  BAMBOOHR_MANIFEST,
  WORKDAY_MANIFEST,
  ADP_MANIFEST,
  STRIPE_MANIFEST,
  AUTH0_MANIFEST,
  CROWDSTRIKE_MANIFEST,
  ONEPASSWORD_MANIFEST,
  PAGERDUTY_MANIFEST,
  DATADOG_MANIFEST,
  AWS_MANIFEST,
  GCP_MANIFEST,
  AZURE_MANIFEST,
  GITHUB_MANIFEST,
];
