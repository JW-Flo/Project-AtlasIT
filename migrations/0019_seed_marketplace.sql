-- Seed marketplace_apps with all 33 adapters from the registry.
-- Uses INSERT OR REPLACE so this migration is idempotent.

INSERT OR REPLACE INTO marketplace_apps (id, name, slug, description, category, provider, logo_url, auth_model, status, created_at, updated_at)
VALUES
  -- Production (stable)
  ('okta', 'Okta', 'okta', 'Full user lifecycle management -- create, suspend, deactivate, and group membership.', 'identity', 'Okta', 'https://logo.clearbit.com/okta.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('google_workspace', 'Google Workspace', 'google-workspace', 'Automate user provisioning, group membership, and suspension via Admin SDK.', 'productivity', 'Google', 'https://logo.clearbit.com/google.com', 'oauth2', 'active', datetime('now'), datetime('now')),

  -- Beta (hand-written core-tier)
  ('microsoft_365', 'Microsoft 365', 'microsoft-365', 'Manage users, groups, and licenses via Microsoft Graph API.', 'productivity', 'Microsoft', 'https://logo.clearbit.com/microsoft.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('slack', 'Slack', 'slack', 'Provision and deprovision Slack users via SCIM.', 'communication', 'Salesforce', 'https://logo.clearbit.com/slack.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('jira', 'Jira', 'jira', 'Manage Atlassian Cloud users and project access via SCIM and REST API.', 'productivity', 'Atlassian', 'https://logo.clearbit.com/atlassian.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('github', 'GitHub', 'github', 'Manage organization members and team assignments via GitHub REST API.', 'productivity', 'GitHub', 'https://logo.clearbit.com/github.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('stripe', 'Stripe', 'stripe', 'Manage persons on connected accounts for identity verification.', 'utility', 'Stripe', 'https://logo.clearbit.com/stripe.com', 'api_key', 'active', datetime('now'), datetime('now')),
  ('aws', 'AWS', 'aws', 'Manage IAM users, groups, roles, and policies for AWS accounts.', 'utility', 'Amazon', 'https://logo.clearbit.com/aws.amazon.com', 'service_account', 'active', datetime('now'), datetime('now')),
  ('azure', 'Azure', 'azure', 'Manage Entra ID users and groups via Microsoft Graph API.', 'identity', 'Microsoft', 'https://logo.clearbit.com/azure.microsoft.com', 'oauth2', 'active', datetime('now'), datetime('now')),

  -- Alpha (scaffolded)
  ('bamboohr', 'BambooHR', 'bamboohr', 'Sync employee records and detect new hires, role changes, and terminations.', 'utility', 'BambooHR', 'https://logo.clearbit.com/bamboohr.com', 'api_key', 'active', datetime('now'), datetime('now')),
  ('auth0', 'Auth0', 'auth0', 'Manage users, roles, and organizations via Auth0 Management API.', 'identity', 'Okta', 'https://logo.clearbit.com/auth0.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('workday', 'Workday', 'workday', 'Connect to Workday HCM for worker lifecycle events and org structure.', 'utility', 'Workday', 'https://logo.clearbit.com/workday.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('adp', 'ADP', 'adp', 'Sync worker hire, terminate, and rehire events via ADP APIs with mTLS.', 'utility', 'ADP', 'https://logo.clearbit.com/adp.com', 'api_key', 'active', datetime('now'), datetime('now')),
  ('confluence', 'Confluence', 'confluence', 'Manage Confluence Cloud space permissions and user access via Atlassian Admin API.', 'productivity', 'Atlassian', 'https://logo.clearbit.com/atlassian.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('quickbooks', 'QuickBooks', 'quickbooks', 'Manage employee records in QuickBooks Online via Intuit OAuth.', 'utility', 'Intuit', 'https://logo.clearbit.com/quickbooks.intuit.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('xero', 'Xero', 'xero', 'Manage payroll employees and contacts via Xero Payroll API.', 'utility', 'Xero', 'https://logo.clearbit.com/xero.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('crowdstrike', 'CrowdStrike', 'crowdstrike', 'Manage Falcon console users and roles for endpoint security.', 'security', 'CrowdStrike', 'https://logo.clearbit.com/crowdstrike.com', 'api_key', 'active', datetime('now'), datetime('now')),
  ('1password', '1Password', '1password', 'Manage 1Password team members, groups, and vault access policies.', 'security', '1Password', 'https://logo.clearbit.com/1password.com', 'api_key', 'active', datetime('now'), datetime('now')),
  ('pagerduty', 'PagerDuty', 'pagerduty', 'Manage PagerDuty users and team assignments for incident response.', 'security', 'PagerDuty', 'https://logo.clearbit.com/pagerduty.com', 'api_key', 'active', datetime('now'), datetime('now')),
  ('datadog', 'Datadog', 'datadog', 'Manage Datadog users and role assignments for observability access control.', 'utility', 'Datadog', 'https://logo.clearbit.com/datadoghq.com', 'api_key', 'active', datetime('now'), datetime('now')),
  ('gcp', 'GCP', 'gcp', 'Manage Cloud Identity users and groups via Admin SDK with domain-wide delegation.', 'utility', 'Google', 'https://logo.clearbit.com/cloud.google.com', 'service_account', 'active', datetime('now'), datetime('now')),
  ('zoom', 'Zoom', 'zoom', 'Provision and manage Zoom users, including activation and deactivation.', 'communication', 'Zoom', 'https://logo.clearbit.com/zoom.us', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('teams', 'Microsoft Teams', 'teams', 'Manage Teams memberships and channels via Microsoft Graph API.', 'communication', 'Microsoft', 'https://logo.clearbit.com/microsoft.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('discord', 'Discord', 'discord', 'Manage Discord server members and role assignments via Bot API.', 'communication', 'Discord', 'https://logo.clearbit.com/discord.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('salesforce', 'Salesforce', 'salesforce', 'Manage Salesforce users and permission sets via REST API and SCIM.', 'productivity', 'Salesforce', 'https://logo.clearbit.com/salesforce.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('hubspot', 'HubSpot', 'hubspot', 'Manage HubSpot users and team assignments via Settings API.', 'productivity', 'HubSpot', 'https://logo.clearbit.com/hubspot.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('dropbox', 'Dropbox Business', 'dropbox', 'Manage Dropbox Business team members and groups via Team API.', 'productivity', 'Dropbox', 'https://logo.clearbit.com/dropbox.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('notion', 'Notion', 'notion', 'Manage Notion workspace members and permissions via API.', 'productivity', 'Notion', 'https://logo.clearbit.com/notion.so', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('zendesk', 'Zendesk', 'zendesk', 'Manage Zendesk agents and group assignments via REST API.', 'productivity', 'Zendesk', 'https://logo.clearbit.com/zendesk.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('asana', 'Asana', 'asana', 'Manage Asana workspace members and team assignments via REST API.', 'productivity', 'Asana', 'https://logo.clearbit.com/asana.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('monday', 'Monday.com', 'monday', 'Manage Monday.com users and teams via GraphQL API.', 'productivity', 'monday.com', 'https://logo.clearbit.com/monday.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('docusign', 'DocuSign', 'docusign', 'Manage DocuSign users and account access via Admin API.', 'productivity', 'DocuSign', 'https://logo.clearbit.com/docusign.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('figma', 'Figma', 'figma', 'Manage Figma organization members and teams via REST API.', 'productivity', 'Figma', 'https://logo.clearbit.com/figma.com', 'oauth2', 'active', datetime('now'), datetime('now')),
  ('canva', 'Canva', 'canva', 'Manage Canva team members and access via REST API.', 'productivity', 'Canva', 'https://logo.clearbit.com/canva.com', 'oauth2', 'active', datetime('now'), datetime('now'));
