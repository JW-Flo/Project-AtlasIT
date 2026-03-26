// Integration marketplace registry (append-only)
// Each integration descriptor can be enriched over time (auth type, scopes, health function)

export const integrations = [
  // Productivity
  {
    id: "google_workspace",
    category: "productivity",
    name: "Google Workspace",
    status: "planned",
    auth: "oauth",
    scopes: ["directory.read"],
    tier: "core",
  },
  {
    id: "microsoft_365",
    category: "productivity",
    name: "Microsoft 365",
    status: "planned",
    auth: "oauth",
    scopes: ["graph.read"],
    tier: "core",
  },
  // Slack categorized under Productivity per applications README
  {
    id: "slack",
    category: "productivity",
    name: "Slack",
    status: "planned",
    auth: "oauth",
    scopes: ["chat:write", "channels:read"],
    tier: "core",
  },
  // Ensure Microsoft 365 already represented above (microsoft_365). Add if not present.
  // HR
  {
    id: "bamboohr",
    category: "hr",
    name: "BambooHR",
    status: "planned",
    auth: "api-key",
    scopes: [],
    tier: "extended",
  },
  {
    id: "workday",
    category: "hr",
    name: "Workday",
    status: "planned",
    auth: "oauth",
    scopes: ["hr.read"],
    tier: "extended",
  },
  {
    id: "adp",
    category: "hr",
    name: "ADP",
    status: "planned",
    auth: "oauth",
    scopes: ["payroll.read"],
    tier: "extended",
  },
  // Finance
  {
    id: "quickbooks",
    category: "finance",
    name: "QuickBooks",
    status: "planned",
    auth: "oauth",
    scopes: ["accounting.read"],
    tier: "extended",
  },
  {
    id: "xero",
    category: "finance",
    name: "Xero",
    status: "planned",
    auth: "oauth",
    scopes: ["accounting.read"],
    tier: "extended",
  },
  {
    id: "stripe",
    category: "finance",
    name: "Stripe",
    status: "planned",
    auth: "api-key",
    scopes: ["payments.read"],
    tier: "core",
  },
  // Security / Identity
  {
    id: "okta",
    category: "security",
    name: "Okta",
    status: "beta",
    auth: "oauth",
    scopes: ["okta.users.read"],
    tier: "core",
  },
  {
    id: "auth0",
    category: "security",
    name: "Auth0",
    status: "planned",
    auth: "oauth",
    scopes: ["users.read"],
    tier: "extended",
  },
  {
    id: "crowdstrike",
    category: "security",
    name: "CrowdStrike",
    status: "planned",
    auth: "oauth",
    scopes: ["alerts.read"],
    tier: "extended",
  },
  // Infrastructure
  {
    id: "aws",
    category: "infrastructure",
    name: "AWS",
    status: "planned",
    auth: "keys",
    scopes: ["iam.read"],
    tier: "core",
  },
  {
    id: "gcp",
    category: "infrastructure",
    name: "GCP",
    status: "planned",
    auth: "keys",
    scopes: ["iam.read"],
    tier: "extended",
  },
  {
    id: "azure",
    category: "infrastructure",
    name: "Azure",
    status: "planned",
    auth: "oauth",
    scopes: ["graph.read"],
    tier: "core",
  },
  // Communication
  {
    id: "zoom",
    category: "communication",
    name: "Zoom",
    status: "planned",
    auth: "oauth",
    scopes: ["meeting.read"],
    tier: "extended",
  },
  {
    id: "teams",
    category: "communication",
    name: "Microsoft Teams",
    status: "planned",
    auth: "oauth",
    scopes: ["messages.read"],
    tier: "extended",
  },
  {
    id: "discord",
    category: "communication",
    name: "Discord",
    status: "planned",
    auth: "oauth",
    scopes: ["guilds.read"],
    tier: "experimental",
  },
];

export function listIntegrations(filter = {}) {
  return integrations.filter((i) => {
    if (filter.category && i.category !== filter.category) return false;
    if (filter.tier && i.tier !== filter.tier) return false;
    if (filter.status && i.status !== filter.status) return false;
    return true;
  });
}

export function summarizeIntegrations() {
  const byCategory = {};
  for (const i of integrations) {
    byCategory[i.category] ||= { total: 0, ready: 0 };
    byCategory[i.category].total += 1;
    if (["beta", "ga", "live"].includes(i.status))
      byCategory[i.category].ready += 1;
  }
  return byCategory;
}
