// Discord adapter type definitions

export interface Bindings {
  DB: D1Database;
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_WEBHOOK_SECRET: string;
}

export interface Variables {
  correlationId: string;
}

// -- Discord API response types --

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar?: string;
  bot?: boolean;
  system?: boolean;
  mfa_enabled?: boolean;
  locale?: string;
  verified?: boolean;
  flags?: number;
  premium_type?: number;
  public_flags?: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  icon?: string;
  unicode_emoji?: string;
}

export interface DiscordMember {
  user?: DiscordUser;
  nick?: string;
  roles: string[];
  joined_at: string;
  premium_since?: string;
  deaf: boolean;
  mute: boolean;
  flags: number;
  avatar?: string;
}

// -- Sync types --

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

// -- Webhook payload types --

export interface DiscordWebhookPayload {
  type: number; // 1=ping, 2=command, 3=component, 4=autocomplete, 5=modal
  id: string;
  application_id: string;
  token: string;
  version: number;
  data?: {
    id: string;
    name: string;
    type: number;
    options?: unknown[];
    resolved?: unknown;
  };
  guild_id?: string;
  channel_id?: string;
  member?: DiscordMember;
  user?: DiscordUser;
  message?: {
    id: string;
    channel_id: string;
    guild_id?: string;
  };
}
