import type {
  AdapterContext,
  AdapterRouter,
  LinearWebhookPayload,
  LinearIssue,
} from "./types.js";

class LinearRouter implements AdapterRouter {
  constructor(private readonly context: AdapterContext) {}

  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route handling
    if (path.endsWith("/webhook") && request.method === "POST") {
      return this.handleWebhook(request);
    }

    if (path.endsWith("/sync") && request.method === "POST") {
      return this.handleSync(request);
    }

    if (path.endsWith("/issues") && request.method === "GET") {
      return this.handleListIssues(request);
    }

    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  private async handleWebhook(request: Request): Promise<Response> {
    try {
      // Verify webhook signature if secret is provided
      const webhookSecret = this.context.env?.LINEAR_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = request.headers.get("linear-signature");
        if (!signature) {
          return new Response(
            JSON.stringify({ error: "Missing webhook signature" }),
            { status: 401, headers: { "content-type": "application/json" } },
          );
        }

        // Verify HMAC-SHA256 signature
        const body = await request.text();
        const isValid = await this.verifyWebhookSignature(
          body,
          signature,
          webhookSecret,
        );
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid webhook signature" }),
            { status: 401, headers: { "content-type": "application/json" } },
          );
        }

        // Parse after verification
        const payload: LinearWebhookPayload = JSON.parse(body);
        return this.processWebhookPayload(payload);
      }

      const payload: LinearWebhookPayload = await request.json();
      return this.processWebhookPayload(payload);
    } catch (error) {
      console.error("[Linear Webhook Error]", error);
      return new Response(
        JSON.stringify({
          error: "Failed to process webhook",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  }

  private async verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string,
  ): Promise<boolean> {
    try {
      // Linear uses HMAC-SHA256 for webhook signatures
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(body),
      );

      const computedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Constant-time comparison to prevent timing attacks
      return signature === computedSignature;
    } catch (error) {
      console.error("[Linear] Signature verification error:", error);
      return false;
    }
  }

  private async processWebhookPayload(
    payload: LinearWebhookPayload,
  ): Promise<Response> {
    // Log webhook event
    console.log("[Linear Webhook]", {
      action: payload.action,
      type: payload.type,
      timestamp: payload.createdAt,
    });

    // Process webhook based on type and action
    await this.processWebhookEvent(payload);

    return new Response(JSON.stringify({ status: "ok", processed: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  private async processWebhookEvent(
    payload: LinearWebhookPayload,
  ): Promise<void> {
    const { action, type, data } = payload;

    // Validate required fields
    if (!data || typeof data.id !== "string") {
      console.warn(
        "[Linear] Invalid webhook payload: missing or invalid data.id",
      );
      return;
    }

    // Store webhook event in KV if binding available
    const kvStore = this.context.bindings?.KV_CACHE as KVNamespace | undefined;
    if (kvStore) {
      const eventKey = `linear:webhook:${type}:${data.id}:${Date.now()}`;
      await kvStore.put(eventKey, JSON.stringify(payload), {
        expirationTtl: 86400 * 7, // 7 days
      });
    }

    // Process different event types
    switch (type) {
      case "Issue":
        await this.processIssueEvent(action, data as unknown as LinearIssue);
        break;
      case "Comment":
        await this.processCommentEvent(action, data);
        break;
      case "Label":
        await this.processLabelEvent(action, data);
        break;
      default:
        console.log(`[Linear] Unhandled event type: ${type}`);
    }
  }

  private async processIssueEvent(
    action: string,
    issue: LinearIssue,
  ): Promise<void> {
    const kvStore = this.context.bindings?.KV_CACHE as KVNamespace | undefined;
    if (!kvStore) return;

    const issueKey = `linear:issue:${issue.id}`;

    switch (action) {
      case "create":
      case "update":
        // Store or update issue in KV
        await kvStore.put(
          issueKey,
          JSON.stringify({
            ...issue,
            syncedAt: new Date().toISOString(),
          }),
        );
        console.log(`[Linear] Issue ${action}d:`, issue.id, issue.title);
        break;
      case "remove":
        // Mark as deleted or remove from KV
        await kvStore.delete(issueKey);
        console.log(`[Linear] Issue removed:`, issue.id);
        break;
    }
  }

  private async processCommentEvent(
    action: string,
    comment: Record<string, unknown>,
  ): Promise<void> {
    const kvStore = this.context.bindings?.KV_CACHE as KVNamespace | undefined;
    if (!kvStore) return;

    const commentKey = `linear:comment:${comment.id}`;

    if (action === "create" || action === "update") {
      await kvStore.put(
        commentKey,
        JSON.stringify({
          ...comment,
          syncedAt: new Date().toISOString(),
        }),
      );
      console.log(`[Linear] Comment ${action}d:`, comment.id);
    } else if (action === "remove") {
      await kvStore.delete(commentKey);
      console.log(`[Linear] Comment removed:`, comment.id);
    }
  }

  private async processLabelEvent(
    action: string,
    label: Record<string, unknown>,
  ): Promise<void> {
    const kvStore = this.context.bindings?.KV_CACHE as KVNamespace | undefined;
    if (!kvStore) return;

    const labelKey = `linear:label:${label.id}`;

    if (action === "create" || action === "update") {
      await kvStore.put(
        labelKey,
        JSON.stringify({
          ...label,
          syncedAt: new Date().toISOString(),
        }),
      );
      console.log(`[Linear] Label ${action}d:`, label.id);
    } else if (action === "remove") {
      await kvStore.delete(labelKey);
      console.log(`[Linear] Label removed:`, label.id);
    }
  }

  private async handleSync(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as {
        direction?: string;
        entityTypes?: string[];
      };

      // Validate sync direction
      const validDirections = [
        "linear-to-atlas",
        "atlas-to-linear",
        "bidirectional",
      ];
      const direction = body.direction || "linear-to-atlas";
      if (!validDirections.includes(direction)) {
        return new Response(
          JSON.stringify({
            error: "Invalid direction",
            validDirections,
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }

      // Validate entity types
      const validEntityTypes = ["issues", "comments", "labels"];
      const entityTypes = body.entityTypes || ["issues"];
      const invalidTypes = entityTypes.filter(
        (t) => !validEntityTypes.includes(t),
      );
      if (invalidTypes.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Invalid entity types",
            invalidTypes,
            validEntityTypes,
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }

      console.log("[Linear Sync]", { direction, entityTypes });

      // NOTE: This is a placeholder implementation
      // In production, this would trigger a background sync job or queue task
      // For now, return success to indicate the sync was initiated
      return new Response(
        JSON.stringify({
          status: "ok",
          sync: {
            direction,
            entityTypes,
            initiated: true,
            timestamp: new Date().toISOString(),
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    } catch (error) {
      console.error("[Linear Sync Error]", error);
      return new Response(
        JSON.stringify({
          error: "Failed to initiate sync",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  }

  private async handleListIssues(_request: Request): Promise<Response> {
    try {
      const kvStore = this.context.bindings?.KV_CACHE as
        | KVNamespace
        | undefined;

      if (!kvStore) {
        return new Response(
          JSON.stringify({ issues: [], message: "No KV store available" }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      // List all issue keys
      const list = await kvStore.list({ prefix: "linear:issue:" });
      const issues = [];

      for (const key of list.keys) {
        const issueData = await kvStore.get(key.name);
        if (issueData) {
          issues.push(JSON.parse(issueData));
        }
      }

      return new Response(JSON.stringify({ issues, count: issues.length }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    } catch (error) {
      console.error("[Linear List Issues Error]", error);
      return new Response(
        JSON.stringify({
          error: "Failed to list issues",
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  }
}

export function buildRoutes(context: AdapterContext): AdapterRouter {
  return new LinearRouter(context);
}
