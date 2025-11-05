import { buildRoutes } from "./routes.js";
import type { AdapterContext, AdapterHandler } from "./types.js";

export interface AdapterMetadata {
  name: string;
  slug: string;
  featureFlag: string;
  schema: unknown;
  createdAt: string;
}

export const metadata: AdapterMetadata = {
  name: "Linear",
  slug: "linear",
  featureFlag: "FEATURE_CONNECTOR_LINEAR",
  schema: {
    openapi: "3.1.0",
    info: {
      title: "Linear Integration API",
      version: "2025-11-05",
      description: "Linear webhook handler and data sync adapter for AtlasIT",
    },
  } as unknown,
  createdAt: "2025-11-05T08:13:39.333Z",
};

export function createAdapter(context: AdapterContext = {}): AdapterHandler {
  const routes = buildRoutes(context);

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);

      // Health check endpoint
      if (url.pathname === "/health" || url.pathname.endsWith("/health")) {
        return new Response(
          JSON.stringify({
            status: "ok",
            name: metadata.slug,
            version: "1.0.0",
            endpoints: ["/webhook", "/sync", "/issues"],
            features: {
              webhookHandling: true,
              dataSync: true,
              issueTracking: true,
            },
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json",
              "x-adapter": metadata.slug,
              "x-feature-flag": metadata.featureFlag,
            },
          },
        );
      }

      // Delegate to router
      if (typeof routes.handle === "function") {
        return routes.handle(request);
      }

      return new Response("Not implemented", { status: 501 });
    },
  };
}

export type {
  AdapterContext,
  AdapterHandler,
  LinearWebhookPayload,
  LinearIssue,
  LinearSyncConfig,
} from "./types.js";
