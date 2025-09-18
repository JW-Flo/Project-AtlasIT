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
  name: "Example HR Suite",
  slug: "example-hr-suite",
  featureFlag: "FEATURE_CONNECTOR_EXAMPLE_HR_SUITE",
  schema: {
  "openapi": "3.1.0",
  "info": {
    "title": "Example HR Suite",
    "version": "2025-09-17",
    "description": "Sample schema used for adapter scaffolding"
  },
  "paths": {
    "/employees": {
      "get": {
        "operationId": "listEmployees",
        "summary": "List employees",
        "responses": {
          "200": {
            "description": "Employees returned",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "id": {
                        "type": "string"
                      },
                      "email": {
                        "type": "string"
                      },
                      "status": {
                        "type": "string"
                      }
                    },
                    "required": [
                      "id",
                      "email",
                      "status"
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  }
} as unknown,
  createdAt: "2025-09-18T05:35:56.408Z",
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
