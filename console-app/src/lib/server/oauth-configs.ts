/**
 * OAuth configuration per provider.
 *
 * Auth model categories:
 * - "platform": AtlasIT owns the app registration. Client ID/secret are
 *   wrangler secrets (e.g. SLACK_CLIENT_ID). Tenant just clicks Authorize.
 * - "tenant_domain": Tenant provides their IdP domain (e.g. Okta, Auth0).
 *   Client ID/secret are still platform secrets registered with that provider,
 *   but the authorize/token URLs are tenant-specific.
 * - API key apps don't use OAuth at all — handled separately.
 */

export type OAuthModel = "platform" | "tenant_domain";

export interface OAuthProviderConfig {
  model: OAuthModel;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** Wrangler secret name prefix for client_id/secret (e.g. "SLACK" → SLACK_CLIENT_ID, SLACK_CLIENT_SECRET) */
  envPrefix: string;
  /** Extra query params to add to the authorize URL */
  extraParams?: Record<string, string>;
}

export const oauthProviders: Record<string, OAuthProviderConfig> = {
  // -- Platform OAuth: we own the app registration, tenant just authorizes --
  slack: {
    model: "platform",
    envPrefix: "SLACK",
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["admin", "users:read", "users:write", "team:read"],
  },
  google_workspace: {
    model: "platform",
    envPrefix: "GOOGLE",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/admin.directory.user",
      "https://www.googleapis.com/auth/admin.directory.group",
    ],
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  microsoft_365: {
    model: "platform",
    envPrefix: "MICROSOFT",
    authorizeUrl:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["User.ReadWrite.All", "Group.ReadWrite.All", "offline_access"],
  },
  azure: {
    model: "platform",
    envPrefix: "AZURE",
    authorizeUrl:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "User.ReadWrite.All",
      "Group.ReadWrite.All",
      "Directory.ReadWrite.All",
      "offline_access",
    ],
  },
  teams: {
    model: "platform",
    envPrefix: "MICROSOFT",
    authorizeUrl:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "Team.ReadBasic.All",
      "TeamMember.ReadWrite.All",
      "User.ReadWrite.All",
      "offline_access",
    ],
  },
  github: {
    model: "platform",
    envPrefix: "GITHUB_OAUTH",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["admin:org", "read:org", "write:org"],
  },
  zoom: {
    model: "platform",
    envPrefix: "ZOOM",
    authorizeUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    scopes: [],
  },
  jira: {
    model: "platform",
    envPrefix: "JIRA",
    authorizeUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    scopes: [
      // Jira platform REST API (classic)
      "read:jira-work",
      "read:jira-user",
      "write:jira-work",
      "manage:jira-configuration",
      "manage:jira-webhook",
      // Jira Service Management API (classic)
      "read:servicedesk-request",
      "write:servicedesk-request",
      "manage:servicedesk-customer",
      "read:servicemanagement-insight-objects",
      // Jira API (granular)
      "read:user:jira",
      "write:webhook:jira",
      "write:customer:jira-service-management",
      "write:work-item-info:jira",
      // User identity + personal data
      "read:me",
      "read:account",
      "report:personal-data",
      "offline_access",
    ],
    extraParams: { audience: "api.atlassian.com", prompt: "consent" },
  },
  confluence: {
    model: "platform",
    envPrefix: "JIRA", // shared Atlassian app registration with Jira
    authorizeUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    scopes: [
      // Confluence API (classic)
      "read:confluence-user",
      "read:confluence-groups",
      "write:confluence-groups",
      // Confluence API (granular)
      "write:content:confluence",
      "write:space:confluence",
      "write:space.permission:confluence",
      "write:space.setting:confluence",
      "read:permission:confluence",
      // User identity
      "read:me",
      "read:account",
      "offline_access",
    ],
    extraParams: { audience: "api.atlassian.com", prompt: "consent" },
  },
  quickbooks: {
    model: "platform",
    envPrefix: "QUICKBOOKS",
    authorizeUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    scopes: ["com.intuit.quickbooks.accounting"],
  },
  xero: {
    model: "platform",
    envPrefix: "XERO",
    authorizeUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl: "https://identity.xero.com/connect/token",
    scopes: ["payroll.employees", "accounting.contacts", "offline_access"],
  },
  discord: {
    model: "platform",
    envPrefix: "DISCORD",
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: ["guilds", "guilds.members.read", "bot"],
  },

  // -- Tenant-domain OAuth: URLs are tenant-specific, but client creds are ours --
  okta: {
    model: "tenant_domain",
    envPrefix: "OKTA",
    authorizeUrl: "https://{domain}/oauth2/v1/authorize",
    tokenUrl: "https://{domain}/oauth2/v1/token",
    scopes: ["okta.users.manage", "okta.groups.manage"],
  },
  auth0: {
    model: "tenant_domain",
    envPrefix: "AUTH0",
    authorizeUrl: "https://{domain}/authorize",
    tokenUrl: "https://{domain}/oauth/token",
    scopes: ["create:users", "read:users", "update:users", "delete:users"],
  },
  workday: {
    model: "tenant_domain",
    envPrefix: "WORKDAY",
    authorizeUrl: "https://{tenant_url}/authorize",
    tokenUrl: "https://{tenant_url}/ccx/oauth2/token",
    scopes: [],
  },
};

/**
 * Get OAuth client credentials from wrangler environment secrets.
 * Convention: {PREFIX}_CLIENT_ID and {PREFIX}_CLIENT_SECRET
 */
export function getOAuthClientCreds(
  env: Record<string, unknown>,
  provider: OAuthProviderConfig,
): { clientId: string; clientSecret: string } | null {
  const clientId = env[`${provider.envPrefix}_CLIENT_ID`] as string | undefined;
  const clientSecret = env[`${provider.envPrefix}_CLIENT_SECRET`] as
    | string
    | undefined;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}
