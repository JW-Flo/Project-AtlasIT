const oauthProviders = {
  // -- Platform OAuth: we own the app registration, tenant just authorizes --
  slack: {
    model: "platform",
    envPrefix: "SLACK",
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["admin", "users:read", "users:write", "team:read"]
  },
  google_workspace: {
    model: "platform",
    envPrefix: "GOOGLE",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/admin.directory.user",
      "https://www.googleapis.com/auth/admin.directory.group"
    ],
    extraParams: { access_type: "offline", prompt: "consent" }
  },
  microsoft_365: {
    model: "platform",
    envPrefix: "MICROSOFT",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: ["User.ReadWrite.All", "Group.ReadWrite.All", "offline_access"]
  },
  azure: {
    model: "platform",
    envPrefix: "AZURE",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "User.ReadWrite.All",
      "Group.ReadWrite.All",
      "Directory.ReadWrite.All",
      "offline_access"
    ]
  },
  teams: {
    model: "platform",
    envPrefix: "MICROSOFT",
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "Team.ReadBasic.All",
      "TeamMember.ReadWrite.All",
      "User.ReadWrite.All",
      "offline_access"
    ]
  },
  github: {
    model: "platform",
    envPrefix: "GITHUB_OAUTH",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["admin:org", "read:org", "write:org"]
  },
  zoom: {
    model: "platform",
    envPrefix: "ZOOM",
    authorizeUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    scopes: []
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
      "offline_access"
    ],
    extraParams: { audience: "api.atlassian.com", prompt: "consent" }
  },
  confluence: {
    model: "platform",
    envPrefix: "JIRA",
    // shared Atlassian app registration with Jira
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
      "offline_access"
    ],
    extraParams: { audience: "api.atlassian.com", prompt: "consent" }
  },
  quickbooks: {
    model: "platform",
    envPrefix: "QUICKBOOKS",
    authorizeUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    scopes: ["com.intuit.quickbooks.accounting"]
  },
  xero: {
    model: "platform",
    envPrefix: "XERO",
    authorizeUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl: "https://identity.xero.com/connect/token",
    scopes: ["payroll.employees", "accounting.contacts", "offline_access"]
  },
  discord: {
    model: "platform",
    envPrefix: "DISCORD",
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: ["guilds", "guilds.members.read", "bot"]
  },
  salesforce: {
    model: "platform",
    envPrefix: "SALESFORCE",
    authorizeUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    scopes: ["api", "refresh_token", "full"]
  },
  hubspot: {
    model: "platform",
    envPrefix: "HUBSPOT",
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    scopes: [
      "crm.objects.owners.read",
      "settings.users.read",
      "settings.users.write",
      "settings.users.teams.read",
      "settings.users.teams.write"
    ]
  },
  dropbox: {
    model: "platform",
    envPrefix: "DROPBOX",
    authorizeUrl: "https://www.dropbox.com/oauth2/authorize",
    tokenUrl: "https://api.dropboxapi.com/oauth2/token",
    scopes: [
      "team_data.member",
      "team_data.governance.write",
      "members.read",
      "members.write",
      "groups.read",
      "groups.write"
    ],
    extraParams: { token_access_type: "offline" }
  },
  notion: {
    model: "platform",
    envPrefix: "NOTION",
    authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    scopes: []
  },
  asana: {
    model: "platform",
    envPrefix: "ASANA",
    authorizeUrl: "https://app.asana.com/-/oauth_authorize",
    tokenUrl: "https://app.asana.com/-/oauth_token",
    scopes: ["default"]
  },
  monday: {
    model: "platform",
    envPrefix: "MONDAY",
    authorizeUrl: "https://auth.monday.com/oauth2/authorize",
    tokenUrl: "https://auth.monday.com/oauth2/token",
    scopes: ["me:read", "users:read", "users:write", "teams:read", "account:read"]
  },
  docusign: {
    model: "platform",
    envPrefix: "DOCUSIGN",
    authorizeUrl: "https://account-d.docusign.com/oauth/auth",
    tokenUrl: "https://account-d.docusign.com/oauth/token",
    scopes: ["signature", "user_read", "user_write", "organization_read"]
  },
  figma: {
    model: "platform",
    envPrefix: "FIGMA",
    authorizeUrl: "https://www.figma.com/oauth",
    tokenUrl: "https://api.figma.com/v1/oauth/token",
    scopes: ["org:read", "org:manage_members", "files:read"]
  },
  canva: {
    model: "platform",
    envPrefix: "CANVA",
    authorizeUrl: "https://www.canva.com/api/oauth/authorize",
    tokenUrl: "https://api.canva.com/rest/v1/oauth/token",
    scopes: ["team:read", "team:manage", "profile:read"]
  },
  datadog: {
    model: "platform",
    envPrefix: "DATADOG",
    authorizeUrl: "https://app.datadoghq.com/oauth2/v1/authorize",
    tokenUrl: "https://app.datadoghq.com/oauth2/v1/token",
    scopes: ["user_access_manage", "user_access_read", "team_manage", "team_read"]
  },
  // -- Tenant-domain OAuth: URLs are tenant-specific, but client creds are ours --
  okta: {
    model: "tenant_domain",
    envPrefix: "OKTA",
    authorizeUrl: "https://{domain}/oauth2/v1/authorize",
    tokenUrl: "https://{domain}/oauth2/v1/token",
    scopes: ["okta.users.manage", "okta.groups.manage"]
  },
  auth0: {
    model: "tenant_domain",
    envPrefix: "AUTH0",
    authorizeUrl: "https://{domain}/authorize",
    tokenUrl: "https://{domain}/oauth/token",
    scopes: ["create:users", "read:users", "update:users", "delete:users"]
  },
  workday: {
    model: "tenant_domain",
    envPrefix: "WORKDAY",
    authorizeUrl: "https://{tenant_url}/authorize",
    tokenUrl: "https://{tenant_url}/ccx/oauth2/token",
    scopes: []
  },
  zendesk: {
    model: "tenant_domain",
    envPrefix: "ZENDESK",
    authorizeUrl: "https://{domain}.zendesk.com/oauth/authorizations/new",
    tokenUrl: "https://{domain}.zendesk.com/oauth/tokens",
    scopes: ["users:read", "users:write", "groups:read", "groups:write", "organizations:read"]
  }
};
function getOAuthClientCreds(env, provider) {
  const clientId = env[`${provider.envPrefix}_CLIENT_ID`];
  const clientSecret = env[`${provider.envPrefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export { getOAuthClientCreds as g, oauthProviders as o };
//# sourceMappingURL=oauth-configs-DUOp3AT9.js.map
