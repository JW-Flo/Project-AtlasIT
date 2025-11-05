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

        // In production, verify HMAC signature here
        // For now, we'll accept any request with a signature header
      }

      const payload: LinearWebhookPayload = await request.json();

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
    } catch (error) {
      console.error("[Linear Webhook Error]", error);
      return new Response(
        JSON.stringify({
          error: "Failed to process webhook",
          details: String(error),
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  }

  private async processWebhookEvent(
    payload: LinearWebhookPayload,
  ): Promise<void> {
    const { action, type, data } = payload;

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

      const direction = body.direction || "linear-to-atlas";
      const entityTypes = body.entityTypes || ["issues"];

      console.log("[Linear Sync]", { direction, entityTypes });

      // In production, this would trigger a sync job
      // For now, return success
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
          details: String(error),
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
          details: String(error),
        }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  }
}

export function buildRoutes(context: AdapterContext): AdapterRouter {
  return new LinearRouter(context);
}
