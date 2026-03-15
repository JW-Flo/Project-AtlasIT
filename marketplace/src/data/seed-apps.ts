export const DEFAULT_APPS = [
  {
    name: "Slack",
    slug: "slack",
    category: "communication",
    provider: "Slack Technologies",
    auth_model: "oauth2",
    capabilities: ["notifications", "approvals"],
    description: "Team messaging and workflow automation",
  },
  {
    name: "Google Workspace",
    slug: "google-workspace",
    category: "identity",
    provider: "Google",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "group-sync", "sso"],
    description: "User and group directory sync",
  },
  {
    name: "Okta",
    slug: "okta",
    category: "identity",
    provider: "Okta",
    auth_model: "saml",
    capabilities: ["user-lifecycle", "group-management", "sso"],
    description: "Identity and access management",
  },
  {
    name: "Microsoft 365",
    slug: "microsoft-365",
    category: "identity",
    provider: "Microsoft",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "group-sync", "sso"],
    description: "Azure AD directory integration",
  },
  {
    name: "Jira",
    slug: "jira",
    category: "productivity",
    provider: "Atlassian",
    auth_model: "oauth2",
    capabilities: ["issue-tracking", "workflow-automation"],
    description: "Project tracking and issue management",
  },
  {
    name: "PagerDuty",
    slug: "pagerduty",
    category: "security",
    provider: "PagerDuty",
    auth_model: "api_key",
    capabilities: ["incident-management", "on-call"],
    description: "Incident response and on-call management",
  },
] as const;

export async function seedDefaultApps(db: D1Database): Promise<number> {
  const existing = await db
    .prepare("SELECT COUNT(*) as count FROM marketplace_apps")
    .first<{ count: number }>();
  if ((existing?.count ?? 0) > 0) return 0;

  let inserted = 0;
  for (const app of DEFAULT_APPS) {
    const id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO marketplace_apps (id, name, slug, category, provider, auth_model, capabilities, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        app.name,
        app.slug,
        app.category,
        app.provider,
        app.auth_model,
        JSON.stringify(app.capabilities),
        app.description,
      )
      .run();
    inserted++;
  }
  return inserted;
}
