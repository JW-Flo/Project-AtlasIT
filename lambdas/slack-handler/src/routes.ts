import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";

const json = (status: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

async function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string,
): Promise<boolean> {
  const baseString = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(baseString),
  );
  const expected =
    "v0=" +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return expected === signature;
}

export async function route(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const { rawPath, requestContext } = event;
  const method = requestContext.http.method;

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "slack-handler" });
  }

  const svc = bootstrap();

  // Verify Slack signature for all POST requests
  if (method === "POST") {
    const timestamp = event.headers["x-slack-request-timestamp"] ?? "";
    const signature = event.headers["x-slack-signature"] ?? "";
    const body = event.body ?? "";

    // Reject requests older than 5 minutes
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
      return json(403, { error: "Request too old" });
    }

    let signingSecret: string;
    try {
      const secretBytes = await svc.secretResolver.resolve(
        "slack-signing-secret",
      );
      signingSecret = new TextDecoder().decode(secretBytes);
    } catch {
      console.error("Failed to resolve Slack signing secret");
      return json(500, { error: "Configuration error" });
    }

    const valid = await verifySlackSignature(
      signingSecret,
      timestamp,
      body,
      signature,
    );
    if (!valid) {
      return json(403, { error: "Invalid signature" });
    }
  }

  // POST /api/v1/slack/events — Slack Events API
  if (method === "POST" && rawPath.endsWith("/slack/events")) {
    const body = JSON.parse(event.body ?? "{}");

    // URL verification challenge
    if (body.type === "url_verification") {
      return json(200, { challenge: body.challenge });
    }

    console.log("Slack event received", { type: body.event?.type });
    return json(200, { ok: true });
  }

  // POST /api/v1/slack/interactions — Interactive components
  if (method === "POST" && rawPath.endsWith("/slack/interactions")) {
    const body = event.body ?? "";
    const params = new URLSearchParams(body);
    const payload = JSON.parse(params.get("payload") ?? "{}");

    if (payload.type === "block_actions") {
      for (const action of payload.actions ?? []) {
        if (action.action_id?.startsWith("access_request_")) {
          const [, , decision, requestId] = action.action_id.split("_");
          const tenantId = payload.user?.team_id ?? "default";

          if (decision === "approve" || decision === "deny") {
            await svc.securityRepo.updateAccessRequest(tenantId, requestId, {
              status: decision === "approve" ? "approved" : "denied",
              decidedAt: new Date().toISOString(),
              decidedBy: payload.user?.id ?? "slack-user",
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return json(200, { ok: true });
  }

  // POST /api/v1/slack/commands — Slash commands
  if (method === "POST" && rawPath.endsWith("/slack/commands")) {
    const body = event.body ?? "";
    const params = new URLSearchParams(body);
    const command = params.get("command");
    const text = params.get("text") ?? "";

    return json(200, {
      response_type: "ephemeral",
      text: `Received command: ${command} ${text}`,
    });
  }

  return json(404, { error: "Not found" });
}
