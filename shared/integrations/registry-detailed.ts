// Auto-generated from shared/integrations/research/*.json
// This registry is consumed by:
//   - Onboarding wizard: which credential fields to show per app
//   - API manager: OAuth flow config, token storage
//   - Connector factory: base URLs, endpoints, SDK imports
//   - JML engine: which endpoints to call for joiner/mover/leaver actions

export type AuthType = "oauth2" | "api_key" | "iam_keys";
export type GrantType =
  | "authorization_code"
  | "client_credentials"
  | "service_account"
  | "device_code"
  | "refresh_token"
  | "pkce"
  | "bot"
  | "authorization_code_with_pkce"
  | "iam_access_keys"
  | "sts_assume_role"
  | "sts_session_token";

export type Category =
  | "productivity"
  | "communication"
  | "security"
  | "infrastructure"
  | "hr"
  | "finance";

export type Tier = "core" | "extended" | "experimental";

/** What the onboarding UI needs to collect from the tenant */
export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "textarea";
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface OAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  grantTypes: GrantType[];
  /** All scopes needed for full JML lifecycle */
  scopes: string[];
  /** Whether the OAuth flow requires admin/org consent */
  adminConsentRequired: boolean;
  /** Whether domain-wide delegation is needed (Google, GCP) */
  domainWideDelegation: boolean;
}

export interface ApiEndpoints {
  createUser?: string;
  getUser?: string;
  updateUser?: string;
  suspendUser?: string;
  deleteUser?: string;
  listUsers?: string;
  listGroups?: string;
  addToGroup?: string;
  removeFromGroup?: string;
  [key: string]: string | undefined;
}

export interface ScimConfig {
  supported: boolean;
  endpoint?: string;
  notes?: string;
}

export interface IntegrationDetail {
  id: string;
  name: string;
  category: Category;
  tier: Tier;
  auth: {
    type: AuthType;
    /** Credential fields the tenant must provide in the API manager */
    credentialFields: CredentialField[];
    /** OAuth config if type is oauth2 — platform handles the flow */
    oauth?: OAuthConfig;
    /** Whether the app also supports an alternative auth method */
    alternativeAuth?: { type: AuthType; notes: string };
  };
  api: {
    baseUrl: string;
    version: string;
    endpoints: ApiEndpoints;
    rateLimits: string;
    scim: ScimConfig;
  };
  sdk: {
    npm: string | null;
    docsUrl: string;
    exampleImport: string;
  };
  webhooks: {
    supported: boolean;
    type?: string;
    eventTypes: string[];
  };
  sandbox: {
    available: boolean;
    notes: string;
  };
}

// ---------------------------------------------------------------------------
// Productivity
// ---------------------------------------------------------------------------

const google_workspace: IntegrationDetail = {
  id: "google_workspace",
  name: "Google Workspace",
  category: "productivity",
  tier: "core",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_email",
        label: "Service Account Email",
        type: "text",
        required: true,
        placeholder: "sa@project.iam.gserviceaccount.com",
        helpText: "Service account with domain-wide delegation enabled",
      },
      {
        key: "private_key",
        label: "Service Account Private Key (JSON)",
        type: "textarea",
        required: true,
        helpText: "Paste the full JSON key file contents",
      },
      {
        key: "admin_email",
        label: "Admin Email",
        type: "text",
        required: true,
        placeholder: "admin@yourdomain.com",
        helpText: "Super Admin email to impersonate for API calls",
      },
      {
        key: "domain",
        label: "Domain",
        type: "text",
        required: true,
        placeholder: "yourdomain.com",
      },
    ],
    oauth: {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      revokeUrl: "https://oauth2.googleapis.com/revoke",
      grantTypes: ["authorization_code", "service_account"],
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.group",
        "https://www.googleapis.com/auth/admin.directory.group.member",
      ],
      adminConsentRequired: true,
      domainWideDelegation: true,
    },
  },
  api: {
    baseUrl: "https://admin.googleapis.com",
    version: "directory_v1",
    endpoints: {
      createUser: "POST /admin/directory/v1/users",
      getUser: "GET /admin/directory/v1/users/{userKey}",
      updateUser: "PUT /admin/directory/v1/users/{userKey}",
      suspendUser: "PATCH /admin/directory/v1/users/{userKey}",
      deleteUser: "DELETE /admin/directory/v1/users/{userKey}",
      listUsers: "GET /admin/directory/v1/users",
      listGroups: "GET /admin/directory/v1/groups",
      addToGroup: "POST /admin/directory/v1/groups/{groupKey}/members",
      removeFromGroup:
        "DELETE /admin/directory/v1/groups/{groupKey}/members/{memberKey}",
    },
    rateLimits: "2400 queries/min per user per project, 10 user creates/sec",
    scim: {
      supported: false,
      notes: "Provisioning via Admin SDK Directory API only",
    },
  },
  sdk: {
    npm: "googleapis",
    docsUrl:
      "https://developers.google.com/workspace/admin/directory/reference/rest",
    exampleImport: "import { google } from 'googleapis'",
  },
  webhooks: {
    supported: true,
    type: "push_notifications",
    eventTypes: ["user.created", "user.updated", "user.deleted"],
  },
  sandbox: {
    available: false,
    notes: "No free sandbox. Use Cloud Identity Free or paid dev sandbox.",
  },
};

const microsoft_365: IntegrationDetail = {
  id: "microsoft_365",
  name: "Microsoft 365",
  category: "productivity",
  tier: "core",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Application (Client) ID",
        type: "text",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        helpText: "From Azure AD App Registration",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "tenant_id",
        label: "Tenant ID",
        type: "text",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
    ],
    oauth: {
      authorizeUrl:
        "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize",
      tokenUrl:
        "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token",
      grantTypes: ["authorization_code", "client_credentials"],
      scopes: [
        "User.ReadWrite.All",
        "Group.ReadWrite.All",
        "Directory.ReadWrite.All",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://graph.microsoft.com/v1.0",
    version: "v1.0",
    endpoints: {
      createUser: "POST /users",
      getUser: "GET /users/{id}",
      updateUser: "PATCH /users/{id}",
      suspendUser: "PATCH /users/{id}",
      deleteUser: "DELETE /users/{id}",
      listUsers: "GET /users",
      listGroups: "GET /groups",
      addToGroup: "POST /groups/{id}/members/$ref",
      removeFromGroup: "DELETE /groups/{id}/members/{id}/$ref",
    },
    rateLimits: "130K requests/10s per app globally",
    scim: {
      supported: true,
      endpoint: "https://graph.microsoft.com/v1.0",
      notes: "Entra ID supports inbound SCIM via /bulkUpload",
    },
  },
  sdk: {
    npm: "@microsoft/microsoft-graph-client",
    docsUrl: "https://learn.microsoft.com/en-us/graph/api/overview",
    exampleImport: "import { Client } from '@microsoft/microsoft-graph-client'",
  },
  webhooks: {
    supported: true,
    type: "change_notifications",
    eventTypes: ["created", "updated", "deleted"],
  },
  sandbox: {
    available: true,
    notes: "M365 Developer Program E5 sandbox (eligibility restricted)",
  },
};

const slack: IntegrationDetail = {
  id: "slack",
  name: "Slack",
  category: "productivity",
  tier: "core",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Slack App settings",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://slack.com/oauth/v2/authorize",
      tokenUrl: "https://slack.com/api/oauth.v2.access",
      revokeUrl: "https://slack.com/api/auth.revoke",
      grantTypes: ["authorization_code"],
      scopes: ["admin"],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://api.slack.com",
    version: "v2",
    endpoints: {
      createUser: "POST /scim/v2/Users",
      getUser: "GET /scim/v2/Users/{id}",
      updateUser: "PUT /scim/v2/Users/{id}",
      suspendUser: "PATCH /scim/v2/Users/{id}",
      deleteUser: "DELETE /scim/v2/Users/{id}",
      listUsers: "GET /scim/v2/Users",
      listGroups: "GET /scim/v2/Groups",
      addToGroup: "PATCH /scim/v2/Groups/{id}",
      removeFromGroup: "PATCH /scim/v2/Groups/{id}",
    },
    rateLimits: "Tier 1-4, varies by method. SCIM: 40-50 requests/min",
    scim: {
      supported: true,
      endpoint: "https://api.slack.com/scim/v2/",
      notes: "Requires Business+ or Enterprise Grid plan",
    },
  },
  sdk: {
    npm: "@slack/web-api",
    docsUrl: "https://api.slack.com/docs",
    exampleImport: "import { WebClient } from '@slack/web-api'",
  },
  webhooks: {
    supported: true,
    type: "events_api",
    eventTypes: [
      "team_join",
      "user_change",
      "user_status_changed",
      "member_joined_channel",
      "member_left_channel",
    ],
  },
  sandbox: {
    available: true,
    notes: "Enterprise Grid sandbox via Slack Developer Program",
  },
};

const jira: IntegrationDetail = {
  id: "jira",
  name: "Jira (Atlassian Cloud)",
  category: "productivity",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Atlassian Developer Console",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      grantTypes: ["authorization_code"],
      scopes: [
        "read:jira-user",
        "write:jira-work",
        "manage:jira-project",
        "read:me",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
    alternativeAuth: {
      type: "api_key",
      notes:
        "SCIM provisioning uses directory API tokens (not OAuth). Requires Atlassian Guard.",
    },
  },
  api: {
    baseUrl: "https://api.atlassian.com",
    version: "v3",
    endpoints: {
      createUser: "POST /scim/directory/{directoryId}/Users",
      getUser: "GET /scim/directory/{directoryId}/Users/{id}",
      updateUser: "PUT /scim/directory/{directoryId}/Users/{id}",
      suspendUser: "PATCH /scim/directory/{directoryId}/Users/{id}",
      deleteUser: "DELETE /scim/directory/{directoryId}/Users/{id}",
      listUsers: "GET /scim/directory/{directoryId}/Users",
      listGroups: "GET /scim/directory/{directoryId}/Groups",
      addToGroup: "PATCH /scim/directory/{directoryId}/Groups/{id}",
      removeFromGroup: "PATCH /scim/directory/{directoryId}/Groups/{id}",
    },
    rateLimits: "Rate limits vary by endpoint, returned in response headers",
    scim: {
      supported: true,
      endpoint: "https://api.atlassian.com/scim/directory/{directoryId}/",
      notes:
        "Requires Atlassian Guard. DELETE deactivates, does not permanently remove.",
    },
  },
  sdk: {
    npm: "jira.js",
    docsUrl: "https://developer.atlassian.com/cloud/jira/platform/rest/v3/",
    exampleImport: "import { Version3Client } from 'jira.js'",
  },
  webhooks: {
    supported: true,
    type: "connect_webhooks",
    eventTypes: [
      "user_created",
      "user_updated",
      "user_deleted",
      "jira:issue_created",
      "jira:issue_updated",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free Cloud instances for up to 10 users",
  },
};

// ---------------------------------------------------------------------------
// Communication
// ---------------------------------------------------------------------------

const zoom: IntegrationDetail = {
  id: "zoom",
  name: "Zoom",
  category: "communication",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Zoom Marketplace app",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "account_id",
        label: "Account ID",
        type: "text",
        required: true,
        helpText: "Required for Server-to-Server OAuth",
      },
    ],
    oauth: {
      authorizeUrl: "https://zoom.us/oauth/authorize",
      tokenUrl: "https://zoom.us/oauth/token",
      revokeUrl: "https://zoom.us/oauth/revoke",
      grantTypes: ["authorization_code", "client_credentials"],
      scopes: [
        "user:write:admin",
        "user:read:admin",
        "group:write:admin",
        "group:read:admin",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://api.zoom.us/v2",
    version: "v2",
    endpoints: {
      createUser: "POST /users",
      getUser: "GET /users/{userId}",
      updateUser: "PATCH /users/{userId}",
      suspendUser: "PUT /users/{userId}/status",
      deleteUser: "DELETE /users/{userId}",
      listUsers: "GET /users",
      listGroups: "GET /groups",
      addToGroup: "POST /groups/{groupId}/members",
      removeFromGroup: "DELETE /groups/{groupId}/members/{memberId}",
    },
    rateLimits:
      "Light: 80/s, Medium: 60/s, Heavy: 40/s, Resource-intensive: 20/s",
    scim: {
      supported: true,
      endpoint: "https://api.zoom.us/scim2/",
    },
  },
  sdk: {
    npm: "@zoom/rivet",
    docsUrl: "https://developers.zoom.us/docs/api/",
    exampleImport: "import { Zoom } from '@zoom/rivet'",
  },
  webhooks: {
    supported: true,
    type: "event_subscriptions",
    eventTypes: [
      "user.created",
      "user.updated",
      "user.deleted",
      "user.activated",
      "user.deactivated",
    ],
  },
  sandbox: {
    available: false,
    notes: "No free sandbox. Use a paid Zoom account for testing.",
  },
};

const teams: IntegrationDetail = {
  id: "teams",
  name: "Microsoft Teams",
  category: "communication",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Application (Client) ID",
        type: "text",
        required: true,
        helpText: "Same Azure AD app as M365 (Microsoft Graph)",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "tenant_id",
        label: "Tenant ID",
        type: "text",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl:
        "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize",
      tokenUrl:
        "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token",
      grantTypes: ["authorization_code", "client_credentials"],
      scopes: [
        "Team.ReadBasic.All",
        "TeamMember.ReadWrite.All",
        "Channel.ReadBasic.All",
        "ChannelMember.ReadWrite.All",
        "User.ReadWrite.All",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://graph.microsoft.com/v1.0",
    version: "v1.0",
    endpoints: {
      createUser: "POST /users",
      getUser: "GET /users/{id}",
      updateUser: "PATCH /users/{id}",
      suspendUser: "PATCH /users/{id}",
      deleteUser: "DELETE /users/{id}",
      listGroups: "GET /teams",
      addToGroup: "POST /teams/{teamId}/members",
      removeFromGroup: "DELETE /teams/{teamId}/members/{membershipId}",
    },
    rateLimits: "130K requests/10s per app globally",
    scim: {
      supported: true,
      endpoint: "https://graph.microsoft.com/v1.0",
      notes: "Shares Entra ID SCIM with M365",
    },
  },
  sdk: {
    npm: "@microsoft/microsoft-graph-client",
    docsUrl: "https://learn.microsoft.com/en-us/graph/teams-concept-overview",
    exampleImport: "import { Client } from '@microsoft/microsoft-graph-client'",
  },
  webhooks: {
    supported: true,
    type: "change_notifications",
    eventTypes: [
      "team/members/created",
      "team/members/deleted",
      "channel/created",
      "channel/deleted",
    ],
  },
  sandbox: {
    available: true,
    notes: "M365 Developer Program E5 sandbox",
  },
};

const discord: IntegrationDetail = {
  id: "discord",
  name: "Discord",
  category: "communication",
  tier: "experimental",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "bot_token",
        label: "Bot Token",
        type: "password",
        required: true,
        helpText: "From Discord Developer Portal → Bot settings",
      },
      {
        key: "client_id",
        label: "Application ID",
        type: "text",
        required: true,
      },
      {
        key: "guild_id",
        label: "Server (Guild) ID",
        type: "text",
        required: true,
        helpText: "Right-click server → Copy Server ID (enable Developer Mode)",
      },
    ],
    oauth: {
      authorizeUrl: "https://discord.com/oauth2/authorize",
      tokenUrl: "https://discord.com/api/oauth2/token",
      revokeUrl: "https://discord.com/api/oauth2/token/revoke",
      grantTypes: ["authorization_code", "client_credentials", "bot"],
      scopes: ["guilds", "guilds.members.read", "bot"],
      adminConsentRequired: false,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://discord.com/api/v10",
    version: "v10",
    endpoints: {
      getUser: "GET /guilds/{guildId}/members/{userId}",
      updateUser: "PATCH /guilds/{guildId}/members/{userId}",
      suspendUser: "PUT /guilds/{guildId}/bans/{userId}",
      deleteUser: "DELETE /guilds/{guildId}/members/{userId}",
      listUsers: "GET /guilds/{guildId}/members",
      listGroups: "GET /guilds/{guildId}/roles",
      addToGroup: "PUT /guilds/{guildId}/members/{userId}/roles/{roleId}",
      removeFromGroup:
        "DELETE /guilds/{guildId}/members/{userId}/roles/{roleId}",
    },
    rateLimits: "50 requests/sec global, per-route limits in response headers",
    scim: { supported: false },
  },
  sdk: {
    npm: "discord.js",
    docsUrl: "https://discord.com/developers/docs/reference",
    exampleImport: "import { Client, GatewayIntentBits } from 'discord.js'",
  },
  webhooks: {
    supported: true,
    type: "gateway_websocket",
    eventTypes: [
      "GUILD_MEMBER_ADD",
      "GUILD_MEMBER_REMOVE",
      "GUILD_MEMBER_UPDATE",
      "GUILD_ROLE_CREATE",
      "GUILD_ROLE_DELETE",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free Discord server. Create a test bot in Developer Portal.",
  },
};

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

const okta: IntegrationDetail = {
  id: "okta",
  name: "Okta",
  category: "security",
  tier: "core",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "domain",
        label: "Okta Domain",
        type: "url",
        required: true,
        placeholder: "https://your-org.okta.com",
        helpText: "Your Okta organization URL",
      },
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Okta Admin → Applications → API Services",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://{domain}/oauth2/v1/authorize",
      tokenUrl: "https://{domain}/oauth2/v1/token",
      revokeUrl: "https://{domain}/oauth2/v1/revoke",
      grantTypes: [
        "authorization_code",
        "authorization_code_with_pkce",
        "client_credentials",
      ],
      scopes: [
        "okta.users.manage",
        "okta.groups.manage",
        "okta.users.read",
        "okta.groups.read",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
    alternativeAuth: {
      type: "api_key",
      notes: "SSWS API token: Authorization: SSWS {apiToken}",
    },
  },
  api: {
    baseUrl: "https://{domain}/api/v1",
    version: "v1",
    endpoints: {
      createUser: "POST /api/v1/users",
      getUser: "GET /api/v1/users/{userId}",
      updateUser: "PUT /api/v1/users/{userId}",
      suspendUser: "POST /api/v1/users/{userId}/lifecycle/suspend",
      deleteUser: "DELETE /api/v1/users/{userId}",
      listUsers: "GET /api/v1/users",
      listGroups: "GET /api/v1/groups",
      addToGroup: "PUT /api/v1/groups/{groupId}/users/{userId}",
      removeFromGroup: "DELETE /api/v1/groups/{groupId}/users/{userId}",
      deactivateUser: "POST /api/v1/users/{userId}/lifecycle/deactivate",
      activateUser: "POST /api/v1/users/{userId}/lifecycle/activate",
    },
    rateLimits: "1000 req/min for /users, varies by plan",
    scim: {
      supported: true,
      endpoint: "https://{scimServer}/scim/v2",
      notes: "Okta acts as SCIM client to downstream apps",
    },
  },
  sdk: {
    npm: "@okta/okta-sdk-nodejs",
    docsUrl: "https://developer.okta.com/okta-sdk-nodejs/jsdocs/",
    exampleImport: "import { Client } from '@okta/okta-sdk-nodejs'",
  },
  webhooks: {
    supported: true,
    type: "event_hooks",
    eventTypes: [
      "user.lifecycle.create",
      "user.lifecycle.activate",
      "user.lifecycle.deactivate",
      "user.lifecycle.suspend",
      "user.lifecycle.unsuspend",
      "user.lifecycle.delete.initiated",
      "user.account.update_profile",
      "group.user_membership.add",
      "group.user_membership.remove",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free developer edition at developer.okta.com/signup",
  },
};

const auth0: IntegrationDetail = {
  id: "auth0",
  name: "Auth0",
  category: "security",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "domain",
        label: "Auth0 Domain",
        type: "url",
        required: true,
        placeholder: "your-tenant.auth0.com",
      },
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "Machine-to-Machine application credentials",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://{domain}/authorize",
      tokenUrl: "https://{domain}/oauth/token",
      revokeUrl: "https://{domain}/oauth/revoke",
      grantTypes: ["client_credentials"],
      scopes: [
        "create:users",
        "read:users",
        "update:users",
        "delete:users",
        "create:roles",
        "read:roles",
        "update:roles",
        "delete:roles",
        "read:organizations",
        "create:organization_members",
        "delete:organization_members",
      ],
      adminConsentRequired: false,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://{domain}/api/v2",
    version: "v2",
    endpoints: {
      createUser: "POST /api/v2/users",
      getUser: "GET /api/v2/users/{id}",
      updateUser: "PATCH /api/v2/users/{id}",
      suspendUser: "PATCH /api/v2/users/{id}",
      deleteUser: "DELETE /api/v2/users/{id}",
      listUsers: "GET /api/v2/users",
      listGroups: "GET /api/v2/roles",
      addToGroup: "POST /api/v2/roles/{id}/users",
      removeFromGroup: "DELETE /api/v2/organizations/{id}/members",
    },
    rateLimits: "2 req/s free tier, 15 req/s paid tier",
    scim: {
      supported: true,
      notes:
        "Inbound SCIM only (Auth0 receives SCIM from IdPs). Enterprise connections only.",
    },
  },
  sdk: {
    npm: "auth0",
    docsUrl: "https://auth0.com/docs/api/management/v2",
    exampleImport: "import { ManagementClient } from 'auth0'",
  },
  webhooks: {
    supported: true,
    type: "log_streams",
    eventTypes: [
      "user.created",
      "user.updated",
      "user.deleted",
      "user.blocked",
      "user.unblocked",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free tenant at auth0.com/signup, unlimited free tenants",
  },
};

const crowdstrike: IntegrationDetail = {
  id: "crowdstrike",
  name: "CrowdStrike",
  category: "security",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "API Client ID",
        type: "text",
        required: true,
        helpText: "From Falcon Console → API Clients and Keys",
      },
      {
        key: "client_secret",
        label: "API Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "base_url",
        label: "Cloud Region",
        type: "text",
        required: true,
        placeholder: "https://api.crowdstrike.com",
        helpText:
          "US-1: api.crowdstrike.com, US-2: api.us-2.crowdstrike.com, EU-1: api.eu-1.crowdstrike.com",
      },
    ],
    oauth: {
      authorizeUrl: "",
      tokenUrl: "https://{baseUrl}/oauth2/token",
      grantTypes: ["client_credentials"],
      scopes: [
        "User Management:write",
        "User Management:read",
        "Flight Control:write",
        "Flight Control:read",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://{baseUrl}",
    version: "v1",
    endpoints: {
      createUser: "POST /user-management/entities/users/v1",
      getUser: "GET /user-management/entities/users/v1",
      updateUser: "PATCH /user-management/entities/users/v1",
      deleteUser: "DELETE /user-management/entities/users/v1",
      listUsers: "GET /user-management/queries/users/v1",
      listGroups: "GET /mssp/queries/roles/v1",
      addToGroup: "POST /user-management/entities/user-role-actions/v1",
      removeFromGroup: "POST /user-management/entities/user-role-actions/v1",
    },
    rateLimits: "6000 req/min per customer account",
    scim: {
      supported: false,
      notes: "SCIM available only through IdP integrations (Okta, PingOne)",
    },
  },
  sdk: {
    npm: "crowdstrike-falcon",
    docsUrl: "https://falcon.crowdstrike.com/documentation/",
    exampleImport: "import { FalconClient } from 'crowdstrike-falcon'",
  },
  webhooks: {
    supported: true,
    type: "event_streams",
    eventTypes: [
      "AuthActivityAuditEvent",
      "UserActivityAuditEvent",
      "DetectionSummaryEvent",
    ],
  },
  sandbox: {
    available: false,
    notes: "No free developer sandbox for Falcon API",
  },
};

const pagerduty: IntegrationDetail = {
  id: "pagerduty",
  name: "PagerDuty",
  category: "security",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From PagerDuty Developer Mode → App registration",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://app.pagerduty.com/oauth/authorize",
      tokenUrl: "https://identity.pagerduty.com/oauth/token",
      grantTypes: ["authorization_code"],
      scopes: ["users.write", "users.read", "teams.write", "teams.read"],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
    alternativeAuth: {
      type: "api_key",
      notes: "REST API key: Authorization: Token token={apiKey}",
    },
  },
  api: {
    baseUrl: "https://api.pagerduty.com",
    version: "v2",
    endpoints: {
      createUser: "POST /users",
      getUser: "GET /users/{id}",
      updateUser: "PUT /users/{id}",
      deleteUser: "DELETE /users/{id}",
      listUsers: "GET /users",
      listGroups: "GET /teams",
      addToGroup: "PUT /teams/{teamId}/users/{userId}",
      removeFromGroup: "DELETE /teams/{teamId}/users/{userId}",
    },
    rateLimits: "960 req/min per API key or per user",
    scim: {
      supported: true,
      endpoint: "https://api.pagerduty.com/scim/v2",
      notes:
        "SCIM for Users only (no groups). Works with Okta, Entra ID, OneLogin.",
    },
  },
  sdk: {
    npm: "@pagerduty/pdjs",
    docsUrl: "https://developer.pagerduty.com/docs/rest-api-v2/rest-api/",
    exampleImport: "import { api } from '@pagerduty/pdjs'",
  },
  webhooks: {
    supported: true,
    type: "v3_subscriptions",
    eventTypes: [
      "incident.triggered",
      "incident.acknowledged",
      "incident.resolved",
      "incident.escalated",
      "service.created",
      "service.updated",
      "service.deleted",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free developer account (3 users) + 14-day full trial",
  },
};

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

const aws: IntegrationDetail = {
  id: "aws",
  name: "AWS IAM",
  category: "infrastructure",
  tier: "core",
  auth: {
    type: "iam_keys",
    credentialFields: [
      {
        key: "access_key_id",
        label: "Access Key ID",
        type: "text",
        required: true,
        placeholder: "AKIA...",
      },
      {
        key: "secret_access_key",
        label: "Secret Access Key",
        type: "password",
        required: true,
      },
      {
        key: "region",
        label: "Region",
        type: "text",
        required: false,
        placeholder: "us-east-1",
        helpText: "IAM is global, but region is needed for STS",
      },
      {
        key: "role_arn",
        label: "Role ARN (optional)",
        type: "text",
        required: false,
        placeholder: "arn:aws:iam::123456789012:role/AtlasIT",
        helpText: "If using STS AssumeRole for cross-account access",
      },
    ],
  },
  api: {
    baseUrl: "https://iam.amazonaws.com/",
    version: "2010-05-08",
    endpoints: {
      createUser: "Action=CreateUser&UserName={username}",
      getUser: "Action=GetUser&UserName={username}",
      updateUser: "Action=UpdateUser&UserName={username}",
      suspendUser: "Action=DeleteLoginProfile&UserName={username}",
      deleteUser: "Action=DeleteUser&UserName={username}",
      listUsers: "Action=ListUsers",
      listGroups: "Action=ListGroups",
      addToGroup:
        "Action=AddUserToGroup&GroupName={groupName}&UserName={username}",
      removeFromGroup:
        "Action=RemoveUserFromGroup&GroupName={groupName}&UserName={username}",
    },
    rateLimits:
      "Token bucket, thresholds not publicly documented. 429 on throttle.",
    scim: {
      supported: true,
      endpoint: "https://scim.{region}.amazonaws.com/{tenantId}/scim/v2/",
      notes:
        "SCIM via IAM Identity Center (formerly AWS SSO). Endpoint + token generated in Identity Center console.",
    },
  },
  sdk: {
    npm: "@aws-sdk/client-iam",
    docsUrl:
      "https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/iam/",
    exampleImport:
      "import { IAMClient, CreateUserCommand, DeleteUserCommand } from '@aws-sdk/client-iam'",
  },
  webhooks: {
    supported: true,
    type: "event_bridge",
    eventTypes: [
      "CreateUser",
      "DeleteUser",
      "AddUserToGroup",
      "RemoveUserFromGroup",
      "AttachUserPolicy",
      "DetachUserPolicy",
    ],
  },
  sandbox: {
    available: true,
    notes: "AWS Free Tier. IAM is always free. Use a dedicated dev account.",
  },
};

const gcp: IntegrationDetail = {
  id: "gcp",
  name: "GCP Cloud Identity / IAM",
  category: "infrastructure",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_email",
        label: "Service Account Email",
        type: "text",
        required: true,
        placeholder: "sa@project.iam.gserviceaccount.com",
      },
      {
        key: "private_key",
        label: "Service Account Key (JSON)",
        type: "textarea",
        required: true,
        helpText: "Paste the full JSON key file contents",
      },
      {
        key: "customer_id",
        label: "Google Workspace Customer ID",
        type: "text",
        required: true,
        helpText: "Found in Admin Console → Account → Account settings",
      },
      {
        key: "admin_email",
        label: "Admin Email",
        type: "text",
        required: true,
        placeholder: "admin@yourdomain.com",
        helpText: "Super Admin for domain-wide delegation",
      },
    ],
    oauth: {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      grantTypes: ["authorization_code", "service_account"],
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user",
        "https://www.googleapis.com/auth/admin.directory.group",
        "https://www.googleapis.com/auth/cloud-identity.groups",
        "https://www.googleapis.com/auth/cloud-platform",
      ],
      adminConsentRequired: true,
      domainWideDelegation: true,
    },
  },
  api: {
    baseUrl: "https://admin.googleapis.com",
    version: "directory_v1",
    endpoints: {
      createUser: "POST /admin/directory/v1/users",
      getUser: "GET /admin/directory/v1/users/{userKey}",
      updateUser: "PUT /admin/directory/v1/users/{userKey}",
      suspendUser: "PATCH /admin/directory/v1/users/{userKey}",
      deleteUser: "DELETE /admin/directory/v1/users/{userKey}",
      listUsers: "GET /admin/directory/v1/users",
      listGroups: "GET /admin/directory/v1/groups",
      addToGroup: "POST /admin/directory/v1/groups/{groupKey}/members",
      removeFromGroup:
        "DELETE /admin/directory/v1/groups/{groupKey}/members/{memberKey}",
    },
    rateLimits: "15 req/sec, 150K req/day",
    scim: {
      supported: true,
      notes: "SCIM via Workforce Identity Federation",
    },
  },
  sdk: {
    npm: "googleapis",
    docsUrl: "https://cloud.google.com/identity/docs/reference/rest",
    exampleImport: "import { google } from 'googleapis'",
  },
  webhooks: {
    supported: true,
    type: "push_notifications",
    eventTypes: ["user.created", "user.updated", "user.deleted"],
  },
  sandbox: {
    available: true,
    notes: "GCP free tier + Cloud Identity Free edition",
  },
};

const azure: IntegrationDetail = {
  id: "azure",
  name: "Azure Entra ID",
  category: "infrastructure",
  tier: "core",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Application (Client) ID",
        type: "text",
        required: true,
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "tenant_id",
        label: "Tenant ID",
        type: "text",
        required: true,
        placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      },
    ],
    oauth: {
      authorizeUrl:
        "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize",
      tokenUrl:
        "https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token",
      grantTypes: ["authorization_code", "client_credentials"],
      scopes: [
        "User.ReadWrite.All",
        "Group.ReadWrite.All",
        "Directory.ReadWrite.All",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://graph.microsoft.com/v1.0",
    version: "v1.0",
    endpoints: {
      createUser: "POST /users",
      getUser: "GET /users/{id}",
      updateUser: "PATCH /users/{id}",
      suspendUser: "PATCH /users/{id}",
      deleteUser: "DELETE /users/{id}",
      listUsers: "GET /users",
      listGroups: "GET /groups",
      addToGroup: "POST /groups/{id}/members/$ref",
      removeFromGroup: "DELETE /groups/{id}/members/{id}/$ref",
    },
    rateLimits: "130K requests/10s per app globally",
    scim: {
      supported: true,
      endpoint: "https://graph.microsoft.com/v1.0",
      notes: "Entra acts as SCIM client. Inbound provisioning via /bulkUpload.",
    },
  },
  sdk: {
    npm: "@microsoft/microsoft-graph-client",
    docsUrl: "https://learn.microsoft.com/en-us/entra/identity/",
    exampleImport: "import { Client } from '@microsoft/microsoft-graph-client'",
  },
  webhooks: {
    supported: true,
    type: "change_notifications",
    eventTypes: ["created", "updated", "deleted"],
  },
  sandbox: {
    available: true,
    notes: "Azure Free Account. Entra ID Free tier included.",
  },
};

const github: IntegrationDetail = {
  id: "github",
  name: "GitHub",
  category: "infrastructure",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From GitHub OAuth App or GitHub App settings",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      grantTypes: ["authorization_code", "device_code"],
      scopes: ["admin:org", "write:org", "read:org"],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
    alternativeAuth: {
      type: "api_key",
      notes: "Personal Access Token (PAT) or GitHub App installation token",
    },
  },
  api: {
    baseUrl: "https://api.github.com",
    version: "2022-11-28",
    endpoints: {
      createUser: "PUT /orgs/{org}/memberships/{username}",
      getUser: "GET /orgs/{org}/memberships/{username}",
      updateUser: "PUT /orgs/{org}/memberships/{username}",
      deleteUser: "DELETE /orgs/{org}/members/{username}",
      listUsers: "GET /orgs/{org}/members",
      listGroups: "GET /orgs/{org}/teams",
      addToGroup: "PUT /orgs/{org}/teams/{team_slug}/memberships/{username}",
      removeFromGroup:
        "DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}",
    },
    rateLimits: "5K/hour authenticated, 15K/hour Enterprise Cloud",
    scim: {
      supported: true,
      endpoint: "https://api.github.com/scim/v2/enterprises/{enterprise}/",
      notes: "Enterprise Cloud with EMU only",
    },
  },
  sdk: {
    npm: "@octokit/rest",
    docsUrl: "https://docs.github.com/en/rest",
    exampleImport: "import { Octokit } from '@octokit/rest'",
  },
  webhooks: {
    supported: true,
    type: "organization_webhooks",
    eventTypes: ["member", "membership", "organization", "team", "team_add"],
  },
  sandbox: {
    available: true,
    notes: "Free GitHub organizations. Enterprise trial available.",
  },
};

const datadog: IntegrationDetail = {
  id: "datadog",
  name: "Datadog",
  category: "infrastructure",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        helpText: "From Datadog → Organization Settings → API Keys",
      },
      {
        key: "app_key",
        label: "Application Key",
        type: "password",
        required: true,
        helpText: "From Datadog → Organization Settings → Application Keys",
      },
      {
        key: "site",
        label: "Datadog Site",
        type: "text",
        required: true,
        placeholder: "datadoghq.com",
        helpText: "datadoghq.com (US1), us3.datadoghq.com, datadoghq.eu, etc.",
      },
    ],
    oauth: {
      authorizeUrl: "https://app.datadoghq.com/oauth2/v1/authorize",
      tokenUrl: "https://app.datadoghq.com/oauth2/v1/token",
      grantTypes: ["authorization_code", "client_credentials"],
      scopes: [
        "user_access_manage",
        "user_access_read",
        "team_manage",
        "team_read",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
    alternativeAuth: {
      type: "api_key",
      notes:
        "API Key + Application Key: DD-API-KEY and DD-APPLICATION-KEY headers",
    },
  },
  api: {
    baseUrl: "https://api.datadoghq.com",
    version: "v2",
    endpoints: {
      createUser: "POST /api/v2/users",
      getUser: "GET /api/v2/users/{id}",
      updateUser: "PATCH /api/v2/users/{id}",
      suspendUser: "PATCH /api/v2/users/{id}",
      deleteUser: "PATCH /api/v2/users/{id}",
      listUsers: "GET /api/v2/users",
      listGroups: "GET /api/v2/roles",
      addToGroup: "POST /api/v2/roles/{id}/users",
      removeFromGroup: "DELETE /api/v2/roles/{id}/users",
    },
    rateLimits: "300 req/hour for user endpoints (varies by plan)",
    scim: {
      supported: true,
      endpoint: "https://api.datadoghq.com/api/v2/scim/Users",
      notes: "Infrastructure Pro/Enterprise plans only",
    },
  },
  sdk: {
    npm: "@datadog/datadog-api-client",
    docsUrl: "https://docs.datadoghq.com/api/latest/",
    exampleImport: "import { client, v2 } from '@datadog/datadog-api-client'",
  },
  webhooks: {
    supported: false,
    type: "monitor_alerts",
    eventTypes: [],
  },
  sandbox: {
    available: true,
    notes: "Free tier with limited data retention. 14-day Pro trial.",
  },
};

// ---------------------------------------------------------------------------
// HR
// ---------------------------------------------------------------------------

const bamboohr: IntegrationDetail = {
  id: "bamboohr",
  name: "BambooHR",
  category: "hr",
  tier: "extended",
  auth: {
    type: "api_key",
    credentialFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        helpText: "From BambooHR → Account → API Keys",
      },
      {
        key: "company_domain",
        label: "Company Subdomain",
        type: "text",
        required: true,
        placeholder: "yourcompany",
        helpText: "The subdomain in yourcompany.bamboohr.com",
      },
    ],
  },
  api: {
    baseUrl: "https://api.bamboohr.com/api/gateway.php/{companyDomain}/v1",
    version: "v1",
    endpoints: {
      createUser: "POST /v1/employees",
      getUser: "GET /v1/employees/{id}",
      updateUser: "POST /v1/employees/{id}",
      listUsers: "GET /v1/employees/directory",
    },
    rateLimits: "Not publicly documented. 503 returned when throttled.",
    scim: { supported: false },
  },
  sdk: {
    npm: null,
    docsUrl: "https://documentation.bamboohr.com/reference",
    exampleImport: "// No official SDK. Use fetch with Basic auth.",
  },
  webhooks: {
    supported: true,
    type: "webhooks",
    eventTypes: ["employee.created", "employee.updated", "employee.deleted"],
  },
  sandbox: {
    available: true,
    notes: "Free test account available",
  },
};

const workday: IntegrationDetail = {
  id: "workday",
  name: "Workday",
  category: "hr",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Workday → Register API Client",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "tenant_url",
        label: "Tenant URL",
        type: "url",
        required: true,
        placeholder: "https://wd5-impl-services1.workday.com",
        helpText: "Your Workday tenant base URL",
      },
      {
        key: "tenant_name",
        label: "Tenant Name",
        type: "text",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://{host}/authorize",
      tokenUrl: "https://{host}/ccx/oauth2/token",
      grantTypes: ["authorization_code", "refresh_token"],
      scopes: [],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://{host}/ccx/api/v1/{tenant}",
    version: "v1",
    endpoints: {
      getUser: "GET /workers/{id}",
      listUsers: "GET /workers",
    },
    rateLimits: "Not publicly documented",
    scim: {
      supported: true,
      endpoint: "https://{host}/ccx/scim/v2/{tenant}",
      notes:
        "Many HR lifecycle ops (hire, terminate) require SOAP API or business processes",
    },
  },
  sdk: {
    npm: null,
    docsUrl:
      "https://community.workday.com/sites/default/files/file-hosting/restapi/",
    exampleImport: "// No official SDK. Use fetch with OAuth token.",
  },
  webhooks: {
    supported: false,
    eventTypes: [],
  },
  sandbox: {
    available: true,
    notes: "Available to customers. Vendors need partnership agreement.",
  },
};

const adp: IntegrationDetail = {
  id: "adp",
  name: "ADP",
  category: "hr",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From ADP Developer Portal",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "ssl_cert",
        label: "SSL Certificate (PEM)",
        type: "textarea",
        required: true,
        helpText: "Mutual TLS certificate for API authentication",
      },
      {
        key: "ssl_key",
        label: "SSL Private Key (PEM)",
        type: "textarea",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "",
      tokenUrl: "https://accounts.adp.com/auth/oauth/v2/token",
      grantTypes: ["client_credentials"],
      scopes: [],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://api.adp.com",
    version: "v2",
    endpoints: {
      createUser: "POST /events/hr/v1/worker.hire",
      getUser: "GET /hr/v2/workers/{aoid}",
      updateUser: "POST /events/hr/v1/worker.personal-profile.change",
      suspendUser: "POST /events/hr/v1/worker.work-assignment.terminate",
      deleteUser: "POST /events/hr/v1/worker.terminate",
      listUsers: "GET /hr/v2/workers",
    },
    rateLimits: "Per-integration profile, per-second. 429 on exceed.",
    scim: { supported: false },
  },
  sdk: {
    npm: null,
    docsUrl: "https://developers.adp.com/",
    exampleImport: "// No official SDK. Use fetch with mTLS and OAuth token.",
  },
  webhooks: {
    supported: false,
    type: "polling",
    eventTypes: [],
  },
  sandbox: {
    available: true,
    notes: "UAT environment at uat-api.adp.com",
  },
};

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

const quickbooks: IntegrationDetail = {
  id: "quickbooks",
  name: "QuickBooks Online",
  category: "finance",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Intuit Developer Portal → App settings",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://appcenter.intuit.com/connect/oauth2",
      tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      revokeUrl: "https://developer.api.intuit.com/v2/oauth2/tokens/revoke",
      grantTypes: ["authorization_code", "refresh_token"],
      scopes: ["com.intuit.quickbooks.accounting"],
      adminConsentRequired: false,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://quickbooks.api.intuit.com/v3/company/{realmId}",
    version: "v3",
    endpoints: {
      createUser: "POST /employee",
      getUser: "GET /employee/{id}",
      updateUser: "POST /employee",
      listUsers: "GET /query?query=SELECT * FROM Employee",
    },
    rateLimits: "500 req/min per realmId, max 10 concurrent",
    scim: { supported: false },
  },
  sdk: {
    npm: "node-quickbooks",
    docsUrl:
      "https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/employee",
    exampleImport: "import QuickBooks from 'node-quickbooks'",
  },
  webhooks: {
    supported: true,
    type: "push",
    eventTypes: [
      "Employee.Create",
      "Employee.Update",
      "Employee.Delete",
      "Employee.Merge",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free sandbox with sample data, multi-region",
  },
};

const xero: IntegrationDetail = {
  id: "xero",
  name: "Xero",
  category: "finance",
  tier: "extended",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Xero Developer Portal → My Apps",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://login.xero.com/identity/connect/authorize",
      tokenUrl: "https://identity.xero.com/connect/token",
      revokeUrl: "https://identity.xero.com/connect/revocation",
      grantTypes: ["authorization_code", "refresh_token", "pkce"],
      scopes: [
        "payroll.employees",
        "payroll.employees.read",
        "accounting.contacts",
        "accounting.contacts.read",
      ],
      adminConsentRequired: false,
      domainWideDelegation: false,
    },
  },
  api: {
    baseUrl: "https://api.xero.com",
    version: "2.0",
    endpoints: {
      createUser: "POST /payroll.xro/2.0/Employees",
      getUser: "GET /payroll.xro/2.0/Employees/{EmployeeID}",
      updateUser: "PUT /payroll.xro/2.0/Employees/{EmployeeID}",
      listUsers: "GET /payroll.xro/2.0/Employees",
    },
    rateLimits: "5 concurrent, 60/min, 5000/day per connection",
    scim: { supported: false },
  },
  sdk: {
    npm: "xero-node",
    docsUrl: "https://developer.xero.com/documentation/api/",
    exampleImport: "import { XeroClient } from 'xero-node'",
  },
  webhooks: {
    supported: true,
    type: "push",
    eventTypes: [
      "Contacts.Create",
      "Contacts.Update",
      "Invoices.Create",
      "Invoices.Update",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free demo company (expires after 28 days, renewable)",
  },
};

const stripe: IntegrationDetail = {
  id: "stripe",
  name: "Stripe",
  category: "finance",
  tier: "core",
  auth: {
    type: "api_key",
    credentialFields: [
      {
        key: "secret_key",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "sk_live_...",
        helpText: "From Stripe Dashboard → Developers → API keys",
      },
    ],
  },
  api: {
    baseUrl: "https://api.stripe.com",
    version: "rolling",
    endpoints: {
      createUser: "POST /v1/accounts/{accountId}/persons",
      getUser: "GET /v1/accounts/{accountId}/persons/{personId}",
      updateUser: "POST /v1/accounts/{accountId}/persons/{personId}",
      deleteUser: "DELETE /v1/accounts/{accountId}/persons/{personId}",
      listUsers: "GET /v1/accounts/{accountId}/persons",
    },
    rateLimits: "100 req/sec live, 25 req/sec test",
    scim: { supported: false },
  },
  sdk: {
    npm: "stripe",
    docsUrl: "https://docs.stripe.com/api",
    exampleImport: "import Stripe from 'stripe'",
  },
  webhooks: {
    supported: true,
    type: "push",
    eventTypes: [
      "person.created",
      "person.updated",
      "person.deleted",
      "account.updated",
    ],
  },
  sandbox: {
    available: true,
    notes: "Built-in test mode via sk_test_ keys. No separate environment.",
  },
};

// ---------------------------------------------------------------------------
// Productivity (continued)
// ---------------------------------------------------------------------------

const confluence: IntegrationDetail = {
  id: "confluence",
  name: "Confluence (Atlassian Cloud)",
  category: "productivity",
  tier: "core",
  auth: {
    type: "oauth2",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "From Atlassian Developer Console",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
    ],
    oauth: {
      authorizeUrl: "https://auth.atlassian.com/authorize",
      tokenUrl: "https://auth.atlassian.com/oauth/token",
      grantTypes: ["authorization_code"],
      scopes: [
        "read:confluence-space.summary",
        "read:confluence-content.all",
        "write:confluence-space",
        "read:confluence-user",
        "manage:confluence-configuration",
        "read:me",
      ],
      adminConsentRequired: true,
      domainWideDelegation: false,
    },
    alternativeAuth: {
      type: "api_key",
      notes:
        "SCIM provisioning uses Atlassian directory API tokens. Requires Atlassian Guard.",
    },
  },
  api: {
    baseUrl: "https://api.atlassian.com",
    version: "v2",
    endpoints: {
      createUser: "POST /scim/directory/{directoryId}/Users",
      getUser: "GET /scim/directory/{directoryId}/Users/{id}",
      updateUser: "PUT /scim/directory/{directoryId}/Users/{id}",
      suspendUser: "PATCH /scim/directory/{directoryId}/Users/{id}",
      deleteUser: "DELETE /scim/directory/{directoryId}/Users/{id}",
      listUsers: "GET /scim/directory/{directoryId}/Users",
      listGroups: "GET /scim/directory/{directoryId}/Groups",
      addToGroup: "PATCH /scim/directory/{directoryId}/Groups/{id}",
      removeFromGroup: "PATCH /scim/directory/{directoryId}/Groups/{id}",
      listSpaces: "GET /wiki/api/v2/spaces",
      getSpacePermissions: "GET /wiki/api/v2/spaces/{spaceId}/permissions",
      addSpacePermission: "POST /wiki/api/v2/spaces/{spaceId}/permissions",
      removeSpacePermission:
        "DELETE /wiki/api/v2/spaces/{spaceId}/permissions/{permissionId}",
    },
    rateLimits: "Rate limits vary by endpoint, returned in response headers",
    scim: {
      supported: true,
      endpoint: "https://api.atlassian.com/scim/directory/{directoryId}/",
      notes: "Shares Atlassian directory with Jira. Requires Atlassian Guard.",
    },
  },
  sdk: {
    npm: "confluence.js",
    docsUrl: "https://developer.atlassian.com/cloud/confluence/rest/v2/intro/",
    exampleImport: "import { ConfluenceClient } from 'confluence.js'",
  },
  webhooks: {
    supported: true,
    type: "connect_webhooks",
    eventTypes: [
      "page_created",
      "page_updated",
      "space_permissions_updated",
      "user_created",
      "user_updated",
    ],
  },
  sandbox: {
    available: true,
    notes: "Free Cloud instances for up to 10 users",
  },
};

// ---------------------------------------------------------------------------
// Security (continued)
// ---------------------------------------------------------------------------

const onepassword: IntegrationDetail = {
  id: "1password",
  name: "1Password",
  category: "security",
  tier: "extended",
  auth: {
    type: "api_key",
    credentialFields: [
      {
        key: "service_account_token",
        label: "Service Account Token",
        type: "password",
        required: true,
        helpText: "From 1Password → Developer → Service Accounts",
      },
      {
        key: "connect_host",
        label: "Connect Server URL",
        type: "url",
        required: false,
        placeholder: "https://connect.your-domain.com",
        helpText:
          "URL for 1Password Connect Server (if using self-hosted SCIM bridge)",
      },
    ],
  },
  api: {
    baseUrl: "https://events.1password.com",
    version: "v1",
    endpoints: {
      listUsers: "GET /api/v1/users",
      getUser: "GET /api/v1/users/{userId}",
      suspendUser: "PATCH /api/v1/users/{userId}",
      deleteUser: "DELETE /api/v1/users/{userId}",
      listGroups: "GET /api/v1/groups",
      addToGroup: "PUT /api/v1/groups/{groupId}/members",
      removeFromGroup: "DELETE /api/v1/groups/{groupId}/members/{userId}",
      listVaults: "GET /api/v1/vaults",
      getVaultAccess: "GET /api/v1/vaults/{vaultId}/access",
      grantVaultAccess: "PUT /api/v1/vaults/{vaultId}/access",
      revokeVaultAccess: "DELETE /api/v1/vaults/{vaultId}/access/{userId}",
    },
    rateLimits: "600 req/min per token",
    scim: {
      supported: true,
      endpoint: "https://{scimBridgeUrl}/scim/v2/",
      notes:
        "SCIM Bridge required (self-hosted or 1Password cloud-hosted). Manages user provisioning and group sync.",
    },
  },
  sdk: {
    npm: "@1password/connect",
    docsUrl: "https://developer.1password.com/docs/connect/",
    exampleImport: "import { OnePasswordConnect } from '@1password/connect'",
  },
  webhooks: {
    supported: false,
    eventTypes: [],
  },
  sandbox: {
    available: true,
    notes:
      "1Password Developer account with free Teams trial. SCIM Bridge available as Docker container.",
  },
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const integrationRegistry: Record<string, IntegrationDetail> = {
  google_workspace,
  microsoft_365,
  slack,
  jira,
  confluence,
  zoom,
  teams,
  discord,
  okta,
  auth0,
  crowdstrike,
  "1password": onepassword,
  pagerduty,
  aws,
  gcp,
  azure,
  github,
  datadog,
  bamboohr,
  workday,
  adp,
  quickbooks,
  xero,
  stripe,
};

export const integrationList: IntegrationDetail[] =
  Object.values(integrationRegistry);

/** Get the credential fields the onboarding UI should render for a given app */
export function getCredentialFields(appId: string): CredentialField[] {
  return integrationRegistry[appId]?.auth.credentialFields ?? [];
}

/** Get all apps in a category */
export function getByCategory(category: Category): IntegrationDetail[] {
  return integrationList.filter((i) => i.category === category);
}

/** Get all apps that support SCIM */
export function getScimEnabled(): IntegrationDetail[] {
  return integrationList.filter((i) => i.api.scim.supported);
}

/** Get the OAuth config for an app (null if not OAuth) */
export function getOAuthConfig(appId: string): OAuthConfig | null {
  return integrationRegistry[appId]?.auth.oauth ?? null;
}
