export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "textarea";
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

/**
 * Auth model determines the onboarding UX:
 * - "platform_oauth": We own the app registration. Tenant just clicks Authorize. No fields.
 * - "tenant_oauth": Tenant provides their IdP domain, we handle the OAuth flow.
 * - "api_key": Tenant enters their API key(s).
 * - "service_account": Tenant provides service account / IAM keys.
 */
export type AuthModel =
  | "platform_oauth"
  | "tenant_oauth"
  | "api_key"
  | "service_account";

export interface Integration {
  id: string;
  category: string;
  name: string;
  status: string;
  auth: AuthModel;
  tier: string;
  connected?: boolean;
  /** Fields the tenant must fill in. Empty for platform_oauth apps. */
  credentialFields: CredentialField[];
  /** Brief description of what connecting this app enables */
  description: string;
}

export const integrations: Integration[] = [
  // Productivity
  {
    id: "google_workspace",
    category: "productivity",
    name: "Google Workspace",
    status: "stable",
    auth: "platform_oauth",
    tier: "core",
    description:
      "Automate user provisioning, group membership, and suspension via Admin SDK.",
    credentialFields: [],
  },
  {
    id: "microsoft_365",
    category: "productivity",
    name: "Microsoft 365",
    status: "beta",
    auth: "platform_oauth",
    tier: "core",
    description: "Manage users, groups, and licenses via Microsoft Graph API.",
    credentialFields: [],
  },
  {
    id: "slack",
    category: "productivity",
    name: "Slack",
    status: "beta",
    auth: "platform_oauth",
    tier: "core",
    description:
      "Provision and deprovision Slack users via SCIM. Requires Business+ or Enterprise Grid.",
    credentialFields: [],
  },
  {
    id: "jira",
    category: "productivity",
    name: "Jira",
    status: "beta",
    auth: "platform_oauth",
    tier: "core",
    description:
      "Manage Atlassian Cloud users and project access via SCIM and REST API.",
    credentialFields: [],
  },
  {
    id: "confluence",
    category: "productivity",
    name: "Confluence",
    status: "alpha",
    auth: "platform_oauth",
    tier: "core",
    description:
      "Manage Confluence Cloud space permissions and user access via Atlassian Admin API.",
    credentialFields: [],
  },
  // HR
  {
    id: "bamboohr",
    category: "hr",
    name: "BambooHR",
    status: "alpha",
    auth: "api_key",
    tier: "extended",
    description:
      "Sync employee records and detect new hires, role changes, and terminations.",
    credentialFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        helpText: "From BambooHR > Account > API Keys",
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
  {
    id: "workday",
    category: "hr",
    name: "Workday",
    status: "alpha",
    auth: "tenant_oauth",
    tier: "extended",
    description:
      "Connect to Workday HCM for worker lifecycle events and org structure.",
    credentialFields: [
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
  },
  {
    id: "adp",
    category: "hr",
    name: "ADP",
    status: "alpha",
    auth: "api_key",
    tier: "extended",
    description:
      "Sync worker hire, terminate, and rehire events via ADP APIs with mTLS.",
    credentialFields: [
      {
        key: "ssl_cert",
        label: "SSL Certificate (PEM)",
        type: "textarea",
        required: true,
        helpText:
          "Mutual TLS certificate provided by ADP for API authentication",
      },
      {
        key: "ssl_key",
        label: "SSL Private Key (PEM)",
        type: "textarea",
        required: true,
      },
    ],
  },
  // Finance
  {
    id: "quickbooks",
    category: "finance",
    name: "QuickBooks",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description:
      "Manage employee records in QuickBooks Online via Intuit OAuth.",
    credentialFields: [],
  },
  {
    id: "xero",
    category: "finance",
    name: "Xero",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description: "Manage payroll employees and contacts via Xero Payroll API.",
    credentialFields: [],
  },
  {
    id: "stripe",
    category: "finance",
    name: "Stripe",
    status: "beta",
    auth: "api_key",
    tier: "core",
    description:
      "Manage persons on connected accounts for identity verification.",
    credentialFields: [
      {
        key: "secret_key",
        label: "Secret Key",
        type: "password",
        required: true,
        placeholder: "sk_live_...",
        helpText: "From Stripe Dashboard > Developers > API keys",
      },
    ],
  },
  // Security
  {
    id: "okta",
    category: "security",
    name: "Okta",
    status: "stable",
    auth: "tenant_oauth",
    tier: "core",
    description:
      "Full user lifecycle management — create, suspend, deactivate, and group membership.",
    credentialFields: [
      {
        key: "domain",
        label: "Okta Domain",
        type: "url",
        required: true,
        placeholder: "https://your-org.okta.com",
        helpText: "Your Okta organization URL",
      },
    ],
  },
  {
    id: "auth0",
    category: "security",
    name: "Auth0",
    status: "alpha",
    auth: "tenant_oauth",
    tier: "extended",
    description:
      "Manage users, roles, and organizations via Auth0 Management API.",
    credentialFields: [
      {
        key: "domain",
        label: "Auth0 Domain",
        type: "url",
        required: true,
        placeholder: "your-tenant.auth0.com",
        helpText: "e.g. your-tenant.auth0.com",
      },
    ],
  },
  {
    id: "crowdstrike",
    category: "security",
    name: "CrowdStrike",
    status: "alpha",
    auth: "api_key",
    tier: "extended",
    description: "Manage Falcon console users and roles for endpoint security.",
    credentialFields: [
      {
        key: "client_id",
        label: "API Client ID",
        type: "text",
        required: true,
        helpText: "From Falcon Console > API Clients and Keys",
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
  },
  {
    id: "1password",
    category: "security",
    name: "1Password",
    status: "alpha",
    auth: "api_key",
    tier: "extended",
    description:
      "Manage 1Password team members, groups, and vault access policies.",
    credentialFields: [
      {
        key: "service_account_token",
        label: "Service Account Token",
        type: "password",
        required: true,
        helpText: "From 1Password > Developer > Service Accounts",
      },
    ],
  },
  {
    id: "pagerduty",
    category: "security",
    name: "PagerDuty",
    status: "alpha",
    auth: "api_key",
    tier: "extended",
    description:
      "Manage PagerDuty users and team assignments for incident response.",
    credentialFields: [
      {
        key: "api_key",
        label: "REST API Key",
        type: "password",
        required: true,
        helpText: "From PagerDuty > Integrations > API Access Keys",
      },
    ],
  },
  {
    id: "zscaler",
    category: "security",
    name: "Zscaler",
    status: "beta",
    auth: "tenant_oauth",
    tier: "extended",
    description:
      "Zero Trust network security platform. Provision users and manage access policies across ZIA and ZPA via ZIdentity.",
    credentialFields: [
      {
        key: "client_id",
        label: "Client ID",
        type: "text",
        required: true,
        helpText: "OneAPI OAuth2 client ID from Zscaler Admin Portal",
      },
      {
        key: "client_secret",
        label: "Client Secret",
        type: "password",
        required: true,
      },
      {
        key: "vanity_domain",
        label: "Vanity Domain",
        type: "text",
        required: true,
        placeholder: "acmecorp",
        helpText: "Your Zscaler vanity domain (e.g. acmecorp for acmecorp.zscaler.com)",
      },
      {
        key: "cloud",
        label: "Cloud",
        type: "text",
        required: true,
        placeholder: "zscaler",
        helpText: "Zscaler cloud identifier: zscaler, zscalerone, zscloud, etc.",
      },
      {
        key: "customer_id",
        label: "Customer ID",
        type: "text",
        required: true,
        helpText: "ZPA customer ID for SCIM group operations",
      },
    ],
  },
  // Infrastructure
  {
    id: "aws",
    category: "infrastructure",
    name: "AWS",
    status: "beta",
    auth: "service_account",
    tier: "core",
    description:
      "Manage IAM users, groups, roles, and policies for AWS accounts.",
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
        helpText: "For cross-account access via STS AssumeRole",
      },
    ],
  },
  {
    id: "gcp",
    category: "infrastructure",
    name: "GCP",
    status: "alpha",
    auth: "service_account",
    tier: "extended",
    description:
      "Manage Cloud Identity users and groups via Admin SDK with domain-wide delegation.",
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
        label: "Workspace Customer ID",
        type: "text",
        required: true,
        helpText: "Found in Admin Console > Account > Account settings",
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
  },
  {
    id: "azure",
    category: "infrastructure",
    name: "Azure",
    status: "beta",
    auth: "platform_oauth",
    tier: "core",
    description: "Manage Entra ID users and groups via Microsoft Graph API.",
    credentialFields: [],
  },
  {
    id: "github",
    category: "infrastructure",
    name: "GitHub",
    status: "beta",
    auth: "platform_oauth",
    tier: "core",
    description:
      "Manage organization members and team assignments via GitHub REST API.",
    credentialFields: [],
  },
  {
    id: "datadog",
    category: "infrastructure",
    name: "Datadog",
    status: "alpha",
    auth: "api_key",
    tier: "extended",
    description:
      "Manage Datadog users and role assignments for observability access control.",
    credentialFields: [
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        required: true,
        helpText: "From Datadog > Organization Settings > API Keys",
      },
      {
        key: "app_key",
        label: "Application Key",
        type: "password",
        required: true,
        helpText: "From Datadog > Organization Settings > Application Keys",
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
  },
  // Communication
  {
    id: "zoom",
    category: "communication",
    name: "Zoom",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description:
      "Provision and manage Zoom users, including activation and deactivation.",
    credentialFields: [],
  },
  {
    id: "teams",
    category: "communication",
    name: "Microsoft Teams",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description:
      "Manage Teams memberships and channels via Microsoft Graph API.",
    credentialFields: [],
  },
  {
    id: "discord",
    category: "communication",
    name: "Discord",
    status: "alpha",
    auth: "platform_oauth",
    tier: "experimental",
    description:
      "Manage Discord server members and role assignments via Bot API.",
    credentialFields: [],
  },
  // CRM / Sales
  {
    id: "salesforce",
    category: "productivity",
    name: "Salesforce",
    status: "alpha",
    auth: "platform_oauth",
    tier: "core",
    description:
      "Manage Salesforce users and permission sets via REST API and SCIM.",
    credentialFields: [],
  },
  {
    id: "hubspot",
    category: "productivity",
    name: "HubSpot",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description: "Manage HubSpot users and team assignments via Settings API.",
    credentialFields: [],
  },
  // File Storage
  {
    id: "dropbox",
    category: "productivity",
    name: "Dropbox Business",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description:
      "Manage Dropbox Business team members and groups via Team API.",
    credentialFields: [],
  },
  // Wiki / Knowledge
  {
    id: "notion",
    category: "productivity",
    name: "Notion",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description: "Manage Notion workspace members and permissions via API.",
    credentialFields: [],
  },
  // Helpdesk
  {
    id: "zendesk",
    category: "productivity",
    name: "Zendesk",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description: "Manage Zendesk agents and group assignments via REST API.",
    credentialFields: [],
  },
  // Project Management
  {
    id: "asana",
    category: "productivity",
    name: "Asana",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description:
      "Manage Asana workspace members and team assignments via REST API.",
    credentialFields: [],
  },
  {
    id: "monday",
    category: "productivity",
    name: "Monday.com",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description: "Manage Monday.com users and teams via GraphQL API.",
    credentialFields: [],
  },
  // Document Signing
  {
    id: "docusign",
    category: "productivity",
    name: "DocuSign",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description: "Manage DocuSign users and account access via Admin API.",
    credentialFields: [],
  },
  // Design
  {
    id: "figma",
    category: "productivity",
    name: "Figma",
    status: "alpha",
    auth: "platform_oauth",
    tier: "extended",
    description: "Manage Figma organization members and teams via REST API.",
    credentialFields: [],
  },
  {
    id: "canva",
    category: "productivity",
    name: "Canva",
    status: "alpha",
    auth: "platform_oauth",
    tier: "experimental",
    description: "Manage Canva team members and access via REST API.",
    credentialFields: [],
  },
];

export const categories = [
  { id: "all", label: "All" },
  { id: "productivity", label: "Productivity" },
  { id: "hr", label: "HR" },
  { id: "finance", label: "Finance" },
  { id: "security", label: "Security" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "communication", label: "Communication" },
];

export const iconMap: Record<string, string> = {
  productivity:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  hr: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  finance:
    "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  security:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  infrastructure:
    "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
  communication:
    "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
};

/** Get an integration by ID */
export function getIntegration(id: string): Integration | undefined {
  return integrations.find((i) => i.id === id);
}
