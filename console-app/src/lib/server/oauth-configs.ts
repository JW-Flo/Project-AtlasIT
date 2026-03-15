/**
 * OAuth configuration per provider.
 * Client IDs and secrets come from app_credentials in D1.
 * This module defines the provider-specific OAuth URLs and scopes.
 */

export interface OAuthProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  /** Extra query params to add to the authorize URL */
  extraParams?: Record<string, string>;
}

export const oauthProviders: Record<string, OAuthProviderConfig> = {
  slack: {
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["admin", "users:read", "users:write", "team:read"],
  },
  google_workspace: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/admin.directory.user",
      "https://www.googleapis.com/auth/admin.directory.group",
    ],
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  microsoft_365: {
    authorizeUrl:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["User.ReadWrite.All", "Group.ReadWrite.All", "offline_access"],
  },
  azure: {
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
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["admin:org", "read:org", "write:org"],
  },
  zoom: {
    authorizeUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    scopes: [],
  },
  jira: {
    authorizeUrl: "https://auth.atlassian.com/authorize",
    tokenUrl: "https://auth.atlassian.com/oauth/token",
    scopes: [
      "read:jira-user",
      "manage:jira-project",
      "read:me",
      "offline_access",
    ],
    extraParams: { audience: "api.atlassian.com", prompt: "consent" },
  },
  okta: {
    authorizeUrl: "https://{domain}/oauth2/v1/authorize",
    tokenUrl: "https://{domain}/oauth2/v1/token",
    scopes: ["okta.users.manage", "okta.groups.manage"],
  },
  auth0: {
    authorizeUrl: "https://{domain}/authorize",
    tokenUrl: "https://{domain}/oauth/token",
    scopes: ["create:users", "read:users", "update:users", "delete:users"],
  },
  quickbooks: {
    authorizeUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    scopes: ["com.intuit.quickbooks.accounting"],
  },
  xero: {
    authorizeUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl: "https://identity.xero.com/connect/token",
    scopes: ["payroll.employees", "accounting.contacts", "offline_access"],
  },
  workday: {
    authorizeUrl: "https://{tenant_url}/authorize",
    tokenUrl: "https://{tenant_url}/ccx/oauth2/token",
    scopes: [],
  },
  discord: {
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: ["guilds", "guilds.members.read", "bot"],
  },
};
