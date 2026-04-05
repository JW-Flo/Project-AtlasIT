import type { AdapterContext, AdapterRouter } from "./types.js";

class DefaultRouter implements AdapterRouter {
  constructor(private readonly context: AdapterContext) {}

  async handle(_request: Request): Promise<Response> {
    return new Response("Route not implemented", { status: 404 });
  }
}

export function buildRoutes(context: AdapterContext): AdapterRouter {
  return new DefaultRouter(context);
}
