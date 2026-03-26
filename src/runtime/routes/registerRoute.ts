import { registerFeature, getFeatures } from "../features/registry";
import type { RegisteredItem } from "../registry/types";

export interface RouteDefinition {
  id: string;
  method: string;
  path: string;
  handler?: unknown;
  enabled?: boolean;
  meta?: Record<string, unknown>;
}

export function registerRoute(definition: RouteDefinition): void {
  const item: RegisteredItem = {
    id: definition.id,
    kind: "api",
    version: "1.0.0",
    meta: {
      method: definition.method,
      path: definition.path,
      enabled: definition.enabled ?? true,
      ...(definition.meta ?? {}),
    },
  };

  if (definition.handler) {
    (item as RegisteredItem & { handler: unknown }).handler =
      definition.handler;
  }

  registerFeature(item as RegisteredItem);
}

export function getRegisteredRoutes(): Array<{
  id: string;
  method: string;
  path: string;
  enabled: boolean;
}> {
  return (getFeatures("api") as RegisteredItem[]).map((item) => {
    const meta = (item.meta ?? {}) as Record<string, unknown>;
    return {
      id: item.id,
      method: String(meta.method ?? "GET"),
      path: String(meta.path ?? "/"),
      enabled: Boolean(meta.enabled ?? true),
    };
  });
}
