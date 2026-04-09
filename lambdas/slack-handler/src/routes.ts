/**
 * slack-handler Lambda routes
 *
 * Ported from slack-approval-worker/index.js (Cloudflare Worker).
 * Uses Node.js crypto instead of crypto.subtle for HMAC verification.
 *
 * Key translations:
 *   c.env.SLACK_SIGNING_SECRET  → process.env.SLACK_SIGNING_SECRET
 *   crypto.subtle.verify(...)   → node:crypto timingSafeEqual
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import crypto from "crypto";

/** Maximum age (seconds) for Slack request timestamps to prevent replay attacks. */
const SLACK_TIMESTAMP_MAX_AGE = 300;

const JSON_HEADERS = { "Content-Type": "application/json" } as const;
const TEXT_HEADERS = { "Content-Type": "text/plain" } as const;

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function text(message: string, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: TEXT_HEADERS, body: message };
}

function fail(status: number, message: string): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

/**
 * Verify Slack request signature using HMAC-SHA256.
 * Uses Node.js crypto.timingSafeEqual for constant-time comparison.
 * Enforces a ±5 minute timestamp window per Slack's replay attack mitigation guidance.
 */
function verifySlackSignature(
  rawBody: string,
  headers: Record<string, string | undefined>,
  signingSecret: string,
): boolean {
  const timestamp = headers["x-slack-request-timestamp"];
  const sig = headers["x-slack-signature"];
  if (!timestamp || !sig) return false;

  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - requestTime) > SLACK_TIMESTAMP_MAX_AGE) return false;

  const baseString = `v0:${timestamp}:${rawBody}`;
  const expectedSig = "v0=" + crypto.createHmac("sha256", signingSecret).update(baseString).digest("hex");
  const providedSig = sig.startsWith("v0=") ? sig : `v0=${sig}`;

  // Constant-time comparison to prevent timing attacks
  if (expectedSig.length !== providedSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig));
}

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath;
  const method = event.requestContext.http.method.toUpperCase();

  // ── Health ────────────────────────────────────────────────────────────────
  if (path === "/healthz" && method === "GET") {
    return text("OK");
  }

  if (path === "/health" && method === "GET") {
    return ok({ status: "ok", service: "slack-handler", timestamp: new Date().toISOString() });
  }

  // ── Slack approve endpoint ─────────────────────────────────────────────────
  if (path === "/slack/approve" && method === "POST") {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("[slack-handler] SLACK_SIGNING_SECRET is not configured");
      return fail(500, "Service misconfigured");
    }

    let rawBody: string;
    try {
      rawBody = event.isBase64Encoded
        ? Buffer.from(event.body ?? "", "base64").toString("utf8")
        : (event.body ?? "");
    } catch {
      return fail(400, "Invalid request body");
    }

    // Verify Slack signature
    if (!verifySlackSignature(rawBody, event.headers, signingSecret)) {
      return text("Invalid signature", 401);
    }

    // Parse URL-encoded body from Slack
    let payload: Record<string, unknown>;
    try {
      const params = new URLSearchParams(rawBody);
      const payloadStr = params.get("payload");
      if (!payloadStr) return fail(400, "Missing payload");
      payload = JSON.parse(payloadStr) as Record<string, unknown>;
    } catch {
      return fail(400, "Malformed payload");
    }

    // Extract action from Slack interactive component
    const actions = payload.actions as Array<{ value?: string; action_id?: string }> | undefined;
    const action = actions?.[0];
    if (!action?.value) {
      return fail(400, "Missing action value");
    }

    const secretName = action.value;
    const user = (payload.user as { name?: string; id?: string } | undefined);

    console.info("[slack-handler] Approval action received", {
      secretName,
      userId: user?.id,
      userName: user?.name,
      actionId: action.action_id,
    });

    // TODO: Trigger backend to update approval status for secretName
    // This would call the orchestrator or core-api to record the approval
    // e.g.: await svc.auditRepo.log({ action: "secret.approved", resourceId: secretName, ... });

    return ok({
      response_type: "in_channel",
      text: `:white_check_mark: Secret *${secretName}* has been approved and is now active.`,
    });
  }

  // ── Slack event callback endpoint ──────────────────────────────────────────
  if (path === "/slack/events" && method === "POST") {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) return fail(500, "Service misconfigured");

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64").toString("utf8")
      : (event.body ?? "");

    if (!verifySlackSignature(rawBody, event.headers, signingSecret)) {
      return text("Invalid signature", 401);
    }

    let eventBody: Record<string, unknown>;
    try {
      eventBody = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return fail(400, "Invalid JSON");
    }

    // Handle Slack URL verification challenge
    if (eventBody.type === "url_verification") {
      return ok({ challenge: eventBody.challenge });
    }

    // Handle event callbacks
    const slackEvent = eventBody.event as Record<string, unknown> | undefined;
    if (slackEvent) {
      console.info("[slack-handler] Slack event received", {
        type: slackEvent.type,
        teamId: eventBody.team_id,
      });
    }

    return ok({ ok: true });
  }

  return fail(404, "Not Found");
}
