import type { ConnectorManifest } from "./manifest.js";

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
