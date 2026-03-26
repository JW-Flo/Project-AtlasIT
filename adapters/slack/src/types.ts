// Worker environment bindings
export interface Bindings {
  ADAPTER_SECRET: string;
  ORCHESTRATOR_URL: string;
  ADAPTER_NAME: string;
  DB: D1Database;
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  OAUTH2_REDIRECT_URI: string;
}

export interface Variables {
  correlationId: string;
}

// ---------------------------------------------------------------------------
// Slack API types
// ---------------------------------------------------------------------------

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  real_name: string;
  deleted: boolean;
  is_bot: boolean;
  is_admin: boolean;
  is_owner: boolean;
  profile: SlackUserProfile;
  updated: number;
}

export interface SlackUserProfile {
  email?: string;
  display_name: string;
  real_name: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  image_72?: string;
  status_text?: string;
  status_emoji?: string;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  is_archived: boolean;
  topic?: { value: string };
  purpose?: { value: string };
  num_members?: number;
}

export interface SlackMessage {
  ok: boolean;
  channel: string;
  ts: string;
  message?: {
    text: string;
    ts: string;
  };
}

// ---------------------------------------------------------------------------
// Block Kit types (subset used for notifications)
// ---------------------------------------------------------------------------

export interface SlackBlock {
  type: string;
  text?: SlackTextObject;
  elements?: SlackBlockElement[];
  accessory?: SlackBlockElement;
  block_id?: string;
  fields?: SlackTextObject[];
}

export interface SlackTextObject {
  type: "plain_text" | "mrkdwn";
  text: string;
  emoji?: boolean;
}

export interface SlackBlockElement {
  type: string;
  text?: SlackTextObject;
  action_id?: string;
  value?: string;
  style?: "primary" | "danger";
  url?: string;
}

// ---------------------------------------------------------------------------
// Slack Events API types
// ---------------------------------------------------------------------------

export interface SlackUrlVerificationPayload {
  type: "url_verification";
  token: string;
  challenge: string;
}

export interface SlackEventCallback {
  type: "event_callback";
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEventPayload;
  event_id: string;
  event_time: number;
}

export interface SlackEventPayload {
  type: string;
  user?: string;
  channel?: string;
  channel_type?: string;
  team?: string;
  event_ts?: string;
  ts?: string;
  inviter?: string;
  text?: string;
  subtype?: string;
}

export type SlackEventBody = SlackUrlVerificationPayload | SlackEventCallback;

// ---------------------------------------------------------------------------
// Slack Interactive Components types
// ---------------------------------------------------------------------------

export interface SlackInteractionPayload {
  type: "block_actions" | "message_action" | "view_submission" | "view_closed";
  user: { id: string; username: string; team_id: string };
  trigger_id: string;
  actions?: SlackInteractionAction[];
  message?: { ts: string; text: string };
  channel?: { id: string; name: string };
  response_url?: string;
  team: { id: string; domain: string };
}

export interface SlackInteractionAction {
  action_id: string;
  block_id: string;
  type: string;
  value?: string;
  text?: SlackTextObject;
  action_ts: string;
}

// ---------------------------------------------------------------------------
// Domain types for AtlasIT integrations
// ---------------------------------------------------------------------------

export interface IncidentAlert {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  source: string;
  timestamp: string;
  link?: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  requester: string;
  description: string;
  resource: string;
  urgency: "high" | "normal" | "low";
  callbackUrl?: string;
}

// ---------------------------------------------------------------------------
// Slack API response envelope
// ---------------------------------------------------------------------------

export interface SlackApiResponse<T = unknown> {
  ok: boolean;
  error?: string;
  response_metadata?: {
    next_cursor?: string;
    scopes?: string[];
  };
  members?: SlackUser[];
  channels?: SlackChannel[];
  channel?: string;
  ts?: string;
  user?: SlackUser;
  data?: T;
}
