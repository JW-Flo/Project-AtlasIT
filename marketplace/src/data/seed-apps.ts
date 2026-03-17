export const DEFAULT_APPS = [
  // Identity & Security
  {
    name: "Google Workspace",
    slug: "google-workspace",
    category: "identity",
    provider: "Google",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "group-sync", "sso"],
    description: "User and group directory sync via Admin SDK",
  },
  {
    name: "Microsoft 365",
    slug: "microsoft-365",
    category: "identity",
    provider: "Microsoft",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "group-sync", "sso"],
    description: "Manage users, groups, and licenses via Microsoft Graph API",
  },
  {
    name: "Okta",
    slug: "okta",
    category: "identity",
    provider: "Okta",
    auth_model: "api_key",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "group-management",
      "sso",
    ],
    description: "Full user lifecycle management with SCIM 2.0 provisioning",
  },
  {
    name: "Auth0",
    slug: "auth0",
    category: "identity",
    provider: "Okta (Auth0)",
    auth_model: "oauth2",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "group-management",
      "sso",
    ],
    description:
      "Manage users, roles, and organizations via Auth0 Management API",
  },
  {
    name: "CrowdStrike",
    slug: "crowdstrike",
    category: "identity",
    provider: "CrowdStrike",
    auth_model: "api_key",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "compliance-scanning",
    ],
    description: "Manage Falcon console users and roles for endpoint security",
  },
  {
    name: "1Password",
    slug: "1password",
    category: "identity",
    provider: "1Password",
    auth_model: "api_key",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "group-management",
    ],
    description: "Manage team members, groups, and vault access policies",
  },
  {
    name: "PagerDuty",
    slug: "pagerduty",
    category: "identity",
    provider: "PagerDuty",
    auth_model: "api_key",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "incident-management",
    ],
    description: "Manage users and team assignments for incident response",
  },
  {
    name: "Datadog",
    slug: "datadog",
    category: "identity",
    provider: "Datadog",
    auth_model: "api_key",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "group-management",
    ],
    description:
      "Manage users and role assignments for observability access control",
  },
  // Communication
  {
    name: "Slack",
    slug: "slack",
    category: "communication",
    provider: "Slack Technologies",
    auth_model: "oauth2",
    capabilities: ["notifications", "approvals"],
    description:
      "Team notifications, approval workflows, and incident communication",
  },
  {
    name: "Zoom",
    slug: "zoom",
    category: "communication",
    provider: "Zoom Video Communications",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
    description:
      "Provision and manage Zoom users, including activation and deactivation",
  },
  {
    name: "Microsoft Teams",
    slug: "teams",
    category: "communication",
    provider: "Microsoft",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "group-sync", "notifications"],
    description:
      "Manage Teams memberships and channels via Microsoft Graph API",
  },
  {
    name: "Discord",
    slug: "discord",
    category: "communication",
    provider: "Discord",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "group-sync", "notifications"],
    description:
      "Manage Discord server members and role assignments via Bot API",
  },
  // Productivity
  {
    name: "Jira",
    slug: "jira",
    category: "identity",
    provider: "Atlassian",
    auth_model: "oauth2",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "group-sync",
      "issue-tracking",
    ],
    description:
      "Manage Atlassian Cloud users and project access via SCIM and REST API",
  },
  {
    name: "Confluence",
    slug: "confluence",
    category: "identity",
    provider: "Atlassian",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
    description: "Manage Confluence Cloud space permissions and user access",
  },
  // HR
  {
    name: "BambooHR",
    slug: "bamboohr",
    category: "custom",
    provider: "BambooHR",
    auth_model: "api_key",
    capabilities: ["directory-sync", "user-provisioning"],
    description:
      "Sync employee records and detect hires, role changes, and terminations",
  },
  {
    name: "Workday",
    slug: "workday",
    category: "custom",
    provider: "Workday",
    auth_model: "oauth2",
    capabilities: [
      "directory-sync",
      "user-provisioning",
      "user-deprovisioning",
    ],
    description:
      "Connect to Workday HCM for worker lifecycle events and org structure",
  },
  {
    name: "ADP",
    slug: "adp",
    category: "custom",
    provider: "ADP",
    auth_model: "oauth2",
    capabilities: [
      "directory-sync",
      "user-provisioning",
      "user-deprovisioning",
    ],
    description: "Sync worker hire, terminate, and rehire events via ADP APIs",
  },
  // Finance
  {
    name: "QuickBooks",
    slug: "quickbooks",
    category: "custom",
    provider: "Intuit",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "directory-sync"],
    description:
      "Manage employee records in QuickBooks Online via Intuit OAuth",
  },
  {
    name: "Xero",
    slug: "xero",
    category: "custom",
    provider: "Xero",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "directory-sync"],
    description: "Manage payroll employees and contacts via Xero Payroll API",
  },
  {
    name: "Stripe",
    slug: "stripe",
    category: "custom",
    provider: "Stripe",
    auth_model: "api_key",
    capabilities: ["user-provisioning", "directory-sync"],
    description:
      "Manage persons on connected accounts for identity verification",
  },
  // Infrastructure
  {
    name: "AWS",
    slug: "aws",
    category: "identity",
    provider: "Amazon Web Services",
    auth_model: "service_account",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "group-management",
    ],
    description:
      "Manage IAM users, groups, roles, and policies for AWS accounts",
  },
  {
    name: "GCP",
    slug: "gcp",
    category: "identity",
    provider: "Google Cloud",
    auth_model: "service_account",
    capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
    description: "Manage Cloud Identity users and groups via Admin SDK",
  },
  {
    name: "Azure",
    slug: "azure",
    category: "identity",
    provider: "Microsoft",
    auth_model: "oauth2",
    capabilities: [
      "user-provisioning",
      "user-deprovisioning",
      "group-sync",
      "sso",
    ],
    description: "Manage Entra ID users and groups via Microsoft Graph API",
  },
  {
    name: "GitHub",
    slug: "github",
    category: "identity",
    provider: "GitHub",
    auth_model: "oauth2",
    capabilities: ["user-provisioning", "user-deprovisioning", "group-sync"],
    description:
      "Manage organization members and team assignments via GitHub REST API",
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
