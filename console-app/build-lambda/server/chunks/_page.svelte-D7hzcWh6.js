import { ac as head, ao as ensure_array_like, aj as attr_class, ak as stringify, an as escape_html, ah as sanitize_props, ai as spread_props, ad as slot } from './renderer-CwxN8JkH.js';
import { C as Card } from './card-1P6BfRcm.js';
import { C as Card_content } from './card-content-D0lv_1U9.js';
import { B as Badge } from './badge-CdvwjGCK.js';
import { A as Arrow_left } from './arrow-left-26Np_Hiw.js';
import { I as Icon } from './Icon-DQFqITWq.js';
import { P as Puzzle } from './puzzle-YzdexiB9.js';
import './utils2-BgZmMgq3.js';

function Book_open($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 7v14" }],
    [
      "path",
      {
        "d": "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "book-open" },
    $$sanitized_props,
    {
      /**
       * @component @name BookOpen
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgN3YxNCIgLz4KICA8cGF0aCBkPSJNMyAxOGExIDEgMCAwIDEtMS0xVjRhMSAxIDAgMCAxIDEtMWg1YTQgNCAwIDAgMSA0IDQgNCA0IDAgMCAxIDQtNGg1YTEgMSAwIDAgMSAxIDF2MTNhMSAxIDAgMCAxLTEgMWgtNmEzIDMgMCAwIDAtMyAzIDMgMyAwIDAgMC0zLTN6IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/book-open
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Code_xml($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "m18 16 4-4-4-4" }],
    ["path", { "d": "m6 8-4 4 4 4" }],
    ["path", { "d": "m14.5 4-5 16" }]
  ];
  Icon($$renderer, spread_props([
    { name: "code-xml" },
    $$sanitized_props,
    {
      /**
       * @component @name CodeXml
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTggMTYgNC00LTQtNCIgLz4KICA8cGF0aCBkPSJtNiA4LTQgNCA0IDQiIC8+CiAgPHBhdGggZD0ibTE0LjUgNC01IDE2IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/code-xml
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Key($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"
      }
    ],
    ["path", { "d": "m21 2-9.6 9.6" }],
    ["circle", { "cx": "7.5", "cy": "15.5", "r": "5.5" }]
  ];
  Icon($$renderer, spread_props([
    { name: "key" },
    $$sanitized_props,
    {
      /**
       * @component @name Key
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJtMTUuNSA3LjUgMi4zIDIuM2ExIDEgMCAwIDAgMS40IDBsMi4xLTIuMWExIDEgMCAwIDAgMC0xLjRMMTkgNCIgLz4KICA8cGF0aCBkPSJtMjEgMi05LjYgOS42IiAvPgogIDxjaXJjbGUgY3g9IjcuNSIgY3k9IjE1LjUiIHI9IjUuNSIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/key
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Terminal($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    ["path", { "d": "M12 19h8" }],
    ["path", { "d": "m4 17 6-6-6-6" }]
  ];
  Icon($$renderer, spread_props([
    { name: "terminal" },
    $$sanitized_props,
    {
      /**
       * @component @name Terminal
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgMTloOCIgLz4KICA8cGF0aCBkPSJtNCAxNyA2LTYtNi02IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/terminal
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Webhook($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  const iconNode = [
    [
      "path",
      {
        "d": "M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"
      }
    ],
    [
      "path",
      {
        "d": "m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"
      }
    ],
    [
      "path",
      {
        "d": "m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"
      }
    ]
  ];
  Icon($$renderer, spread_props([
    { name: "webhook" },
    $$sanitized_props,
    {
      /**
       * @component @name Webhook
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTggMTYuOThoLTUuOTljLTEuMSAwLTEuOTUuOTQtMi40OCAxLjlBNCA0IDAgMCAxIDIgMTdjLjAxLS43LjItMS40LjU3LTIiIC8+CiAgPHBhdGggZD0ibTYgMTcgMy4xMy01Ljc4Yy41My0uOTcuMS0yLjE4LS41LTMuMWE0IDQgMCAxIDEgNi44OS00LjA2IiAvPgogIDxwYXRoIGQ9Im0xMiA2IDMuMTMgNS43M0MxNS42NiAxMi43IDE2LjkgMTMgMTggMTNhNCA0IDAgMCAxIDAgOCIgLz4KPC9zdmc+Cg==) - https://lucide.dev/icons/webhook
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function _page($$renderer) {
  const coreEndpoints = [
    {
      method: "GET",
      path: "/api/v1/events",
      description: "List tenant events (paginated)",
      auth: "API Key"
    },
    {
      method: "POST",
      path: "/api/v1/events",
      description: "Ingest a new event",
      auth: "API Key + HMAC"
    },
    {
      method: "GET",
      path: "/api/v1/cdt/evaluate",
      description: "Evaluate CDT controls for a framework",
      auth: "API Key"
    },
    {
      method: "POST",
      path: "/api/v1/policies/evaluate-all",
      description: "Bulk policy evaluation with CDT payload",
      auth: "Internal"
    },
    {
      method: "GET",
      path: "/api/v1/compliance/evidence",
      description: "Query compliance evidence",
      auth: "API Key"
    },
    {
      method: "POST",
      path: "/workflow",
      description: "Create a new workflow execution",
      auth: "API Key"
    },
    {
      method: "GET",
      path: "/workflow/:id",
      description: "Get workflow execution status",
      auth: "API Key"
    }
  ];
  const consoleEndpoints = [
    {
      method: "GET",
      path: "/api/tenant-compliance/scores",
      description: "Compliance scores for all frameworks",
      auth: "Session"
    },
    {
      method: "POST",
      path: "/api/tenant-compliance/scores",
      description: "Recalculate compliance scores",
      auth: "Session"
    },
    {
      method: "GET",
      path: "/api/evidence-feed",
      description: "Evidence activity feed with filters",
      auth: "Session"
    },
    {
      method: "GET",
      path: "/api/automation/rules",
      description: "List automation rules",
      auth: "Session"
    },
    {
      method: "POST",
      path: "/api/automation/rules",
      description: "Create automation rule",
      auth: "Session"
    },
    {
      method: "POST",
      path: "/api/automation/simulate",
      description: "Dry-run simulate a rule",
      auth: "Session"
    },
    {
      method: "GET",
      path: "/api/integrations/health",
      description: "Adapter collection health status",
      auth: "Session"
    },
    {
      method: "GET",
      path: "/api/access-reviews",
      description: "List access review campaigns",
      auth: "Session"
    },
    {
      method: "GET",
      path: "/api/trust/:slug",
      description: "Public trust center data",
      auth: "None"
    }
  ];
  const methodColors = {
    GET: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-500 border-primary/20",
    PUT: "bg-warning/10 text-warning border-amber-500/20",
    DELETE: "bg-destructive/10 text-destructive border-red-500/20"
  };
  head("t7b80m", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>Developers — AtlasIT</title>`);
    });
    $$renderer2.push(`<meta name="description" content="AtlasIT developer documentation — APIs, webhooks, adapters, and MCP integration."/>`);
  });
  $$renderer.push(`<div class="min-h-screen bg-background text-foreground"><div class="max-w-4xl mx-auto px-4 py-12"><a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">`);
  Arrow_left($$renderer, { class: "h-4 w-4" });
  $$renderer.push(`<!----> Back</a> <h1 class="text-3xl font-bold mb-2">Developer Documentation</h1> <p class="text-muted-foreground mb-10">Build on AtlasIT — APIs, webhooks, custom adapters, and the MCP agent protocol.</p> <div class="grid gap-4 md:grid-cols-3 mb-12">`);
  Card($$renderer, {
    children: ($$renderer2) => {
      Card_content($$renderer2, {
        class: "pt-5 flex items-start gap-3",
        children: ($$renderer3) => {
          Key($$renderer3, { class: "h-5 w-5 text-primary mt-0.5 shrink-0" });
          $$renderer3.push(`<!----> <div><h3 class="font-semibold text-sm">Authentication</h3> <p class="text-xs text-muted-foreground mt-1">API keys, HMAC signing, CF Access JWT, and SSO integration</p></div>`);
        },
        $$slots: { default: true }
      });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Card($$renderer, {
    children: ($$renderer2) => {
      Card_content($$renderer2, {
        class: "pt-5 flex items-start gap-3",
        children: ($$renderer3) => {
          Webhook($$renderer3, { class: "h-5 w-5 text-primary mt-0.5 shrink-0" });
          $$renderer3.push(`<!----> <div><h3 class="font-semibold text-sm">Webhooks</h3> <p class="text-xs text-muted-foreground mt-1">Receive real-time events via HMAC-signed webhook delivery</p></div>`);
        },
        $$slots: { default: true }
      });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----> `);
  Card($$renderer, {
    children: ($$renderer2) => {
      Card_content($$renderer2, {
        class: "pt-5 flex items-start gap-3",
        children: ($$renderer3) => {
          Puzzle($$renderer3, { class: "h-5 w-5 text-primary mt-0.5 shrink-0" });
          $$renderer3.push(`<!----> <div><h3 class="font-semibold text-sm">Custom Adapters</h3> <p class="text-xs text-muted-foreground mt-1">Build connectors with the adapter SDK and manifest schema</p></div>`);
        },
        $$slots: { default: true }
      });
    },
    $$slots: { default: true }
  });
  $$renderer.push(`<!----></div> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2">`);
  Key($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----> Authentication</h2> <div class="space-y-4 text-sm text-muted-foreground"><p>AtlasIT uses multiple authentication methods depending on the context:</p> <div class="bg-muted/50 rounded-lg p-4 space-y-3"><div><span class="font-medium text-foreground">API Key</span> — For server-to-server calls to the orchestrator and core API. Pass via <code class="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization: Bearer &lt;key></code> header.</div> <div><span class="font-medium text-foreground">HMAC Signing</span> — Event ingestion requires HMAC-SHA256 signatures. Sign the request body with your <code class="bg-muted px-1.5 py-0.5 rounded text-xs">EVENT_PUBLISH_SECRET</code> and pass via <code class="bg-muted px-1.5 py-0.5 rounded text-xs">X-Signature</code> header.</div> <div><span class="font-medium text-foreground">Session (CF Access)</span> — Console API routes authenticate via Cloudflare Access JWT. The platform extracts tenant context from the JWT claims.</div> <div><span class="font-medium text-foreground">SSO (OIDC/SAML)</span> — Enterprise tenants can configure SSO in Settings > Security. AtlasIT supports any OIDC-compliant identity provider.</div></div></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2">`);
  Terminal($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----> Core API (Orchestrator &amp; Compliance Worker)</h2> <div class="space-y-2"><!--[-->`);
  const each_array = ensure_array_like(coreEndpoints);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let ep = each_array[$$index];
    $$renderer.push(`<div class="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3"><span${attr_class(`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${stringify(methodColors[ep.method] || "")}`)}>${escape_html(ep.method)}</span> <code class="text-sm font-mono flex-1">${escape_html(ep.path)}</code> <span class="text-xs text-muted-foreground hidden md:block">${escape_html(ep.description)}</span> `);
    Badge($$renderer, {
      variant: "outline",
      class: "text-[10px] shrink-0",
      children: ($$renderer2) => {
        $$renderer2.push(`<!---->${escape_html(ep.auth)}`);
      },
      $$slots: { default: true }
    });
    $$renderer.push(`<!----></div>`);
  }
  $$renderer.push(`<!--]--></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2">`);
  Code_xml($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----> Console API</h2> <div class="space-y-2"><!--[-->`);
  const each_array_1 = ensure_array_like(consoleEndpoints);
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let ep = each_array_1[$$index_1];
    $$renderer.push(`<div class="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3"><span${attr_class(`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${stringify(methodColors[ep.method] || "")}`)}>${escape_html(ep.method)}</span> <code class="text-sm font-mono flex-1">${escape_html(ep.path)}</code> <span class="text-xs text-muted-foreground hidden md:block">${escape_html(ep.description)}</span> `);
    Badge($$renderer, {
      variant: "outline",
      class: "text-[10px] shrink-0",
      children: ($$renderer2) => {
        $$renderer2.push(`<!---->${escape_html(ep.auth)}`);
      },
      $$slots: { default: true }
    });
    $$renderer.push(`<!----></div>`);
  }
  $$renderer.push(`<!--]--></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2">`);
  Puzzle($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----> Building Custom Adapters</h2> <div class="text-sm text-muted-foreground space-y-4"><p>AtlasIT adapters are Cloudflare Workers that implement a standard interface. Use the adapter generator to scaffold a new connector from a manifest:</p> <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs"><div class="text-muted-foreground mb-2"># Generate a new adapter from a manifest</div> <div>npx @atlasit/adapter-gen scaffold --manifest manifests/your-app.json --output adapters/your-app/</div></div> <p>Each adapter must implement these endpoints:</p> <ul class="list-disc pl-5 space-y-1.5"><li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /health</code> — Health check returning <code class="bg-muted px-1.5 py-0.5 rounded text-xs">{ ok: true }</code></li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/auth/callback</code> — OAuth callback handler</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /api/sync</code> — Directory sync (users, groups)</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /api/evidence</code> — Compliance evidence collection</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/provision</code> — Provision user access</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/deprovision</code> — Revoke user access</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /webhook</code> — Inbound webhook handler</li></ul> <p>The <code class="bg-muted px-1.5 py-0.5 rounded text-xs">/api/evidence</code> endpoint is critical for compliance scoring. It returns an array of evidence items, each with a type, status (pass/fail/unknown), control references, and details object. The CDT field mapper translates these details into the flat boolean fields that CDT rules evaluate.</p></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2">`);
  Book_open($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----> MCP Agent Protocol</h2> <div class="text-sm text-muted-foreground space-y-4"><p>AtlasIT includes an MCP (Model Context Protocol) server and SDK for building AI-powered IT agents. The MCP SDK provides:</p> <ul class="list-disc pl-5 space-y-1.5"><li><strong>Client SDK</strong> — Connect to the AtlasIT MCP server from desktop agents or mobile clients</li> <li><strong>Server SDK</strong> — Build custom MCP servers with HMAC-signed request verification</li> <li><strong>Tool definitions</strong> — Pre-built tools for user lookup, access provisioning, compliance queries, and incident management</li></ul> <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs"><div class="text-muted-foreground mb-2">// Example: MCP client connecting to AtlasIT</div> <div>import { McpClient } from "@atlasit/mcp-sdk";</div> <div class="mt-1">const client = new McpClient({</div> <div>  serverUrl: "https://mcp.atlasit.pro",</div> <div>  apiKey: process.env.ATLASIT_MCP_KEY,</div> <div>});</div> <div class="mt-2">const result = await client.call("lookup_user", {</div> <div>  email: "jane@company.com",</div> <div>});</div></div></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2">`);
  Webhook($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----> Event Schema</h2> <div class="text-sm text-muted-foreground space-y-4"><p>All events in AtlasIT follow a standard schema. Events trigger automation rules, generate compliance evidence, and drive the JML pipeline:</p> <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs"><div>{</div> <div>  "tenantId": "tenant_abc123",</div> <div>  "type": "directory.user.joined",</div> <div>  "source": "adapter:google-workspace",</div> <div>  "payload": {</div> <div>    "userId": "user_xyz",</div> <div>    "email": "jane@company.com",</div> <div>    "department": "Engineering",</div> <div>    "title": "Software Engineer"</div> <div>  },</div> <div>  "idempotencyKey": "gws-joined-user_xyz-1712345678"</div> <div>}</div></div> <p>Common event types:</p> <ul class="list-disc pl-5 space-y-1 text-xs"><li><code class="bg-muted px-1 rounded">directory.user.joined</code> / <code class="bg-muted px-1 rounded">moved</code> / <code class="bg-muted px-1 rounded">left</code> — JML lifecycle events</li> <li><code class="bg-muted px-1 rounded">compliance.score_changed</code> — Framework score crossed a threshold</li> <li><code class="bg-muted px-1 rounded">compliance.evidence_collected</code> — New evidence from an adapter</li> <li><code class="bg-muted px-1 rounded">access.review_required</code> — Access review campaign started</li> <li><code class="bg-muted px-1 rounded">provisioning.requested</code> / <code class="bg-muted px-1 rounded">completed</code> — App access provisioning</li> <li><code class="bg-muted px-1 rounded">incident.created</code> / <code class="bg-muted px-1 rounded">resolved</code> — Security incident lifecycle</li></ul></div></section> <div class="mt-12 text-center text-sm text-muted-foreground"><p>Need help integrating? <a href="/support" class="text-primary hover:underline">Contact support</a></p></div></div></div>`);
}

export { _page as default };
//# sourceMappingURL=_page.svelte-D7hzcWh6.js.map
