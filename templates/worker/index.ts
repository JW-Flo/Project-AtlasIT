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
  name: "__ADAPTER_NAME__",
  slug: "__ADAPTER_SLUG__",
  featureFlag: "__FEATURE_FLAG__",
  schema: __SCHEMA__ as unknown,
  createdAt: "__CREATED_AT__",
};

export function createAdapter(context: AdapterContext = {}): AdapterHandler {
  const routes = buildRoutes(context);

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({ status: "ok", name: metadata.slug }),
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

      if (typeof routes.handle === "function") {
        return routes.handle(request);
      }

      return new Response("Not implemented", { status: 501 });
    },
  };
}

export type { AdapterContext, AdapterHandler } from "./types.js";
