// GitHub adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_WEBHOOK_SECRET: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// -- GitHub API response types --

export interface GitHubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
  type: string;
  site_admin: boolean;
  role?: string;
}

export interface GitHubTeam {
  id: number;
  node_id: string;
  name: string;
  slug: string;
  description: string | null;
  privacy: string;
  permission: string;
  members_count?: number;
  repos_count?: number;
}

export interface GitHubMembership {
  url: string;
  role: string;
  state: string;
  user: GitHubUser;
}

export interface GitHubTeamMembership {
  url: string;
  role: string;
  state: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface GitHubWebhookPayload {
  action: string;
  sender: GitHubUser;
  organization: {
    login: string;
    id: number;
  };
  membership?: {
    user: GitHubUser;
    role: string;
    state: string;
    organization_url: string;
  };
  member?: GitHubUser;
  team?: GitHubTeam;
  invitation?: {
    id: number;
    login: string;
    email: string | null;
    role: string;
  };
}
