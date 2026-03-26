// this file is generated — do not edit it

declare module "svelte/elements" {
  export interface HTMLAttributes<T> {
    "data-sveltekit-keepfocus"?: true | "" | "off" | undefined | null;
    "data-sveltekit-noscroll"?: true | "" | "off" | undefined | null;
    "data-sveltekit-preload-code"?:
      | true
      | ""
      | "eager"
      | "viewport"
      | "hover"
      | "tap"
      | "off"
      | undefined
      | null;
    "data-sveltekit-preload-data"?:
      | true
      | ""
      | "hover"
      | "tap"
      | "off"
      | undefined
      | null;
    "data-sveltekit-reload"?: true | "" | "off" | undefined | null;
    "data-sveltekit-replacestate"?: true | "" | "off" | undefined | null;
  }
}

export {};

declare module "$app/types" {
  export interface AppTypes {
    RouteId():
      | "/"
      | "/governance"
      | "/governance/compliance"
      | "/governance/evidence"
      | "/health"
      | "/it"
      | "/it/policies"
      | "/it/policies/coverage"
      | "/it/policies/evaluate"
      | "/it/policies/generate"
      | "/it/policies/templates"
      | "/marketplace"
      | "/marketplace/slack"
      | "/security"
      | "/security/activity"
      | "/security/incidents"
      | "/workflows"
      | "/workflows/executions"
      | "/workflows/executions/[id]";
    RouteParams(): {
      "/workflows/executions/[id]": { id: string };
    };
    LayoutParams(): {
      "/": { id?: string };
      "/governance": Record<string, never>;
      "/governance/compliance": Record<string, never>;
      "/governance/evidence": Record<string, never>;
      "/health": Record<string, never>;
      "/it": Record<string, never>;
      "/it/policies": Record<string, never>;
      "/it/policies/coverage": Record<string, never>;
      "/it/policies/evaluate": Record<string, never>;
      "/it/policies/generate": Record<string, never>;
      "/it/policies/templates": Record<string, never>;
      "/marketplace": Record<string, never>;
      "/marketplace/slack": Record<string, never>;
      "/security": Record<string, never>;
      "/security/activity": Record<string, never>;
      "/security/incidents": Record<string, never>;
      "/workflows": { id?: string };
      "/workflows/executions": { id?: string };
      "/workflows/executions/[id]": { id: string };
    };
    Pathname():
      | "/"
      | "/governance"
      | "/governance/"
      | "/governance/compliance"
      | "/governance/compliance/"
      | "/governance/evidence"
      | "/governance/evidence/"
      | "/health"
      | "/health/"
      | "/it"
      | "/it/"
      | "/it/policies"
      | "/it/policies/"
      | "/it/policies/coverage"
      | "/it/policies/coverage/"
      | "/it/policies/evaluate"
      | "/it/policies/evaluate/"
      | "/it/policies/generate"
      | "/it/policies/generate/"
      | "/it/policies/templates"
      | "/it/policies/templates/"
      | "/marketplace"
      | "/marketplace/"
      | "/marketplace/slack"
      | "/marketplace/slack/"
      | "/security"
      | "/security/"
      | "/security/activity"
      | "/security/activity/"
      | "/security/incidents"
      | "/security/incidents/"
      | "/workflows"
      | "/workflows/"
      | "/workflows/executions"
      | "/workflows/executions/"
      | (`/workflows/executions/${string}` & {})
      | (`/workflows/executions/${string}/` & {});
    ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes["Pathname"]>}`;
    Asset(): string & {};
  }
}
