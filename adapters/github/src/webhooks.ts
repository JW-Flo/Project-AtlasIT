import type { Context } from "hono";
import type { Bindings, Variables, GitHubWebhookPayload } from "./types.js";
import { publishEvent } from "./event-publisher.js";

type HonoContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// GitHub webhook events we handle
const HANDLED_EVENTS = new Map<string, Set<string>>([
  ["organization", new Set(["member_added", "member_removed"])],
  ["membership", new Set(["added", "removed"])],
  ["team", new Set(["added_to_repository"])],
]);

function isHandledEvent(event: string, action: string): boolean {
  const actions = HANDLED_EVENTS.get(event);
  return actions?.has(action) ?? false;
}

/**
 * Verify GitHub webhook signature using HMAC-SHA256.
 * GitHub sends the signature in X-Hub-Signature-256 as "sha256=<hex>".
 */
async function verifySignature(
  secret: string,
  rawBody: string,
  signatureHeader: string,
): Promise<boolean> {
  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;

  const receivedSig = signatureHeader.slice(prefix.length);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody),
  );
  const expectedSig = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison via subtle.timingSafeEqual where available,
  // fallback to length-check + char-by-char XOR
  if (receivedSig.length !== expectedSig.length) return false;

  let mismatch = 0;
  for (let i = 0; i < receivedSig.length; i++) {
    mismatch |= receivedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

function mapEventToAtlasType(
  githubEvent: string,
  action: string,
): string | null {
  switch (`${githubEvent}.${action}`) {
    case "organization.member_added":
      return "user.provisioned";
    case "organization.member_removed":
      return "user.deprovisioned";
    case "membership.added":
      return "group.member_added";
    case "membership.removed":
      return "group.member_removed";
    case "team.added_to_repository":
      return "group.repository_access_granted";
    default:
      return null;
  }
}

function buildPayload(
  githubEvent: string,
  action: string,
  body: GitHubWebhookPayload,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    githubEvent,
    githubAction: action,
    organization: body.organization.login,
    sender: {
      id: body.sender.id,
      login: body.sender.login,
    },
  };

  // Organization member events
  if (githubEvent === "organization" && body.member) {
    base.user = {
      id: body.member.id,
      login: body.member.login,
      email: body.member.email,
    };
  }

  // Membership events (team member add/remove)
  if (githubEvent === "membership" && body.membership) {
    base.user = {
      id: body.membership.user.id,
      login: body.membership.user.login,
      email: body.membership.user.email,
    };
    base.role = body.membership.role;
  }

  if (body.team) {
    base.team = {
      id: body.team.id,
      name: body.team.name,
      slug: body.team.slug,
    };
  }

  return base;
}

export async function handleGitHubWebhook(c: HonoContext): Promise<Response> {
  const correlationId = c.get("correlationId");
  const signatureHeader = c.req.header("X-Hub-Signature-256");
  const githubEvent = c.req.header("X-GitHub-Event");
  const deliveryId = c.req.header("X-GitHub-Delivery");

  if (!signatureHeader) {
    return c.json(
      { error: "Missing X-Hub-Signature-256 header", correlationId },
      401,
    );
  }

  if (!githubEvent) {
    return c.json(
      { error: "Missing X-GitHub-Event header", correlationId },
      400,
    );
  }

  const rawBody = await c.req.text();

  const valid = await verifySignature(
    c.env.GITHUB_WEBHOOK_SECRET,
    rawBody,
    signatureHeader,
  );

  if (!valid) {
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        deliveryId,
        message: "Invalid webhook signature",
      }),
    );
    return c.json({ error: "Invalid signature", correlationId }, 401);
  }

  // Handle ping event (sent when webhook is first configured)
  if (githubEvent === "ping") {
    return c.json({ status: "pong", correlationId });
  }

  const body = JSON.parse(rawBody) as GitHubWebhookPayload;
  const action = body.action;

  console.log(
    JSON.stringify({
      level: "info",
      correlationId,
      deliveryId,
      message: "GitHub webhook received",
      event: githubEvent,
      action,
      organization: body.organization?.login,
    }),
  );

  if (!isHandledEvent(githubEvent, action)) {
    return c.json({
      status: "ignored",
      event: githubEvent,
      action,
      correlationId,
    });
  }

  const atlasEventType = mapEventToAtlasType(githubEvent, action);
  if (!atlasEventType) {
    return c.json({ status: "ignored", correlationId });
  }

  // Resolve tenantId from the organization.
  // In production, look up org -> tenant mapping from D1.
  const tenantId = await resolveOrgTenantId(c.env.DB, body.organization.login);

  if (!tenantId) {
    console.log(
      JSON.stringify({
        level: "warn",
        correlationId,
        deliveryId,
        message: "No tenant mapping for GitHub org",
        organization: body.organization.login,
      }),
    );
    return c.json({ status: "ignored", reason: "unmapped_org", correlationId });
  }

  const eventPayload = buildPayload(githubEvent, action, body);

  try {
    await publishEvent({
      orchestratorUrl: c.env.ORCHESTRATOR_URL,
      tenantId,
      type: atlasEventType,
      source: "connector:github",
      payload: eventPayload,
      idempotencyKey: deliveryId ?? undefined,
      correlationId,
    });

    return c.json({
      status: "processed",
      event: githubEvent,
      action,
      atlasEventType,
      correlationId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(
      JSON.stringify({
        level: "error",
        correlationId,
        deliveryId,
        message: "Failed to publish GitHub webhook event",
        error: msg,
      }),
    );
    return c.json({ error: msg, correlationId }, 500);
  }
}

/**
 * Resolve a GitHub org login to an AtlasIT tenant_id.
 * Uses the connector_configs table where connector_slug='github' and
 * the config JSON contains the org name.
 */
async function resolveOrgTenantId(
  db: D1Database,
  orgLogin: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT tenant_id FROM connector_configs
       WHERE connector_slug = 'github' AND json_extract(config, '$.orgName') = ?
       LIMIT 1`,
    )
    .bind(orgLogin)
    .first<{ tenant_id: string }>();

  return row?.tenant_id ?? null;
}
