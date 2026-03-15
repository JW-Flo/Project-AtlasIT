export interface Integration {
  id: string;
  category: string;
  name: string;
  status: string;
  auth: "oauth" | "api-key" | "keys";
  tier: string;
  connected?: boolean;
}

export const integrations: Integration[] = [
  {
    id: "google_workspace",
    category: "productivity",
    name: "Google Workspace",
    status: "planned",
    auth: "oauth",
    tier: "core",
  },
  {
    id: "microsoft_365",
    category: "productivity",
    name: "Microsoft 365",
    status: "planned",
    auth: "oauth",
    tier: "core",
  },
  {
    id: "slack",
    category: "productivity",
    name: "Slack",
    status: "planned",
    auth: "oauth",
    tier: "core",
  },
  {
    id: "bamboohr",
    category: "hr",
    name: "BambooHR",
    status: "planned",
    auth: "api-key",
    tier: "extended",
  },
  {
    id: "workday",
    category: "hr",
    name: "Workday",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "adp",
    category: "hr",
    name: "ADP",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "quickbooks",
    category: "finance",
    name: "QuickBooks",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "xero",
    category: "finance",
    name: "Xero",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "stripe",
    category: "finance",
    name: "Stripe",
    status: "planned",
    auth: "api-key",
    tier: "core",
  },
  {
    id: "okta",
    category: "security",
    name: "Okta",
    status: "beta",
    auth: "oauth",
    tier: "core",
  },
  {
    id: "auth0",
    category: "security",
    name: "Auth0",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "crowdstrike",
    category: "security",
    name: "CrowdStrike",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "aws",
    category: "infrastructure",
    name: "AWS",
    status: "planned",
    auth: "keys",
    tier: "core",
  },
  {
    id: "gcp",
    category: "infrastructure",
    name: "GCP",
    status: "planned",
    auth: "keys",
    tier: "extended",
  },
  {
    id: "azure",
    category: "infrastructure",
    name: "Azure",
    status: "planned",
    auth: "oauth",
    tier: "core",
  },
  {
    id: "zoom",
    category: "communication",
    name: "Zoom",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "teams",
    category: "communication",
    name: "Microsoft Teams",
    status: "planned",
    auth: "oauth",
    tier: "extended",
  },
  {
    id: "discord",
    category: "communication",
    name: "Discord",
    status: "planned",
    auth: "oauth",
    tier: "experimental",
  },
  {
    id: "jira",
    category: "productivity",
    name: "Jira",
    status: "planned",
    auth: "oauth",
    tier: "core",
  },
  {
    id: "github",
    category: "infrastructure",
    name: "GitHub",
    status: "planned",
    auth: "oauth",
    tier: "core",
  },
  {
    id: "datadog",
    category: "infrastructure",
    name: "Datadog",
    status: "planned",
    auth: "api-key",
    tier: "extended",
  },
  {
    id: "pagerduty",
    category: "security",
    name: "PagerDuty",
    status: "planned",
    auth: "api-key",
    tier: "extended",
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
