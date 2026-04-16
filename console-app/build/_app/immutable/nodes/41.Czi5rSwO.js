import {
  $ as e,
  D as t,
  I as n,
  L as r,
  N as i,
  P as a,
  R as o,
  Tt as s,
  V as c,
  W as l,
  X as u,
  a as d,
  at as f,
  j as p,
  ot as m,
  rt as h,
  s as g,
  st as _,
  w as v,
  wt as y,
  z as b,
} from "../chunks/CjbcrE1v.js";
import "../chunks/C8H49NTu.js";
import "../chunks/DuHeJQ6O.js";
import { t as x } from "../chunks/_6xtu--D.js";
import { t as ee } from "../chunks/BZ8YNDoC.js";
import { t as S } from "../chunks/D82KRzE1.js";
import { t as C } from "../chunks/B8frm5cY.js";
import { n as w, t as T } from "../chunks/BEJa09Kq2.js";
import "../chunks/Cue2Cs472.js";
import { t as E } from "../chunks/DmQt9wwK2.js";
function te(e, t) {
  let n = d(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    i = [
      [`path`, { d: `M12 7v14` }],
      [
        `path`,
        {
          d: `M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z`,
        },
      ],
    ];
  x(
    e,
    g({ name: `book-open` }, () => n, {
      get iconNode() {
        return i;
      },
      children: (e, n) => {
        var i = o();
        (p(m(i), t, `default`, {}, null), r(e, i));
      },
      $$slots: { default: !0 },
    }),
  );
}
function ne(e, t) {
  let n = d(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    i = [
      [`path`, { d: `m18 16 4-4-4-4` }],
      [`path`, { d: `m6 8-4 4 4 4` }],
      [`path`, { d: `m14.5 4-5 16` }],
    ];
  x(
    e,
    g({ name: `code-xml` }, () => n, {
      get iconNode() {
        return i;
      },
      children: (e, n) => {
        var i = o();
        (p(m(i), t, `default`, {}, null), r(e, i));
      },
      $$slots: { default: !0 },
    }),
  );
}
function re(e, t) {
  let n = d(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    i = [
      [`path`, { d: `M12 19h8` }],
      [`path`, { d: `m4 17 6-6-6-6` }],
    ];
  x(
    e,
    g({ name: `terminal` }, () => n, {
      get iconNode() {
        return i;
      },
      children: (e, n) => {
        var i = o();
        (p(m(i), t, `default`, {}, null), r(e, i));
      },
      $$slots: { default: !0 },
    }),
  );
}
function D(e, t) {
  let n = d(t, [`children`, `$$slots`, `$$events`, `$$legacy`]),
    i = [
      [`path`, { d: `M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2` }],
      [`path`, { d: `m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06` }],
      [`path`, { d: `m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8` }],
    ];
  x(
    e,
    g({ name: `webhook` }, () => n, {
      get iconNode() {
        return i;
      },
      children: (e, n) => {
        var i = o();
        (p(m(i), t, `default`, {}, null), r(e, i));
      },
      $$slots: { default: !0 },
    }),
  );
}
var ie = b(
    `<meta name="description" content="AtlasIT developer documentation — APIs, webhooks, adapters, and MCP integration."/>`,
  ),
  ae = b(
    `<!> <div><h3 class="font-semibold text-sm">Authentication</h3> <p class="text-xs text-muted-foreground mt-1">API keys, HMAC signing, CF Access JWT, and SSO integration</p></div>`,
    1,
  ),
  oe = b(
    `<!> <div><h3 class="font-semibold text-sm">Webhooks</h3> <p class="text-xs text-muted-foreground mt-1">Receive real-time events via HMAC-signed webhook delivery</p></div>`,
    1,
  ),
  se = b(
    `<!> <div><h3 class="font-semibold text-sm">Custom Adapters</h3> <p class="text-xs text-muted-foreground mt-1">Build connectors with the adapter SDK and manifest schema</p></div>`,
    1,
  ),
  ce = b(
    `<div class="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3"><span> </span> <code class="text-sm font-mono flex-1"> </code> <span class="text-xs text-muted-foreground hidden md:block"> </span> <!></div>`,
  ),
  le = b(
    `<div class="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3"><span> </span> <code class="text-sm font-mono flex-1"> </code> <span class="text-xs text-muted-foreground hidden md:block"> </span> <!></div>`,
  ),
  ue = b(
    `<div class="min-h-screen bg-background text-foreground"><div class="max-w-4xl mx-auto px-4 py-12"><a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"><!> Back</a> <h1 class="text-3xl font-bold mb-2">Developer Documentation</h1> <p class="text-muted-foreground mb-10">Build on AtlasIT — APIs, webhooks, custom adapters, and the MCP agent protocol.</p> <div class="grid gap-4 md:grid-cols-3 mb-12"><!> <!> <!></div> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2"><!> Authentication</h2> <div class="space-y-4 text-sm text-muted-foreground"><p>AtlasIT uses multiple authentication methods depending on the context:</p> <div class="bg-muted/50 rounded-lg p-4 space-y-3"><div><span class="font-medium text-foreground">API Key</span> — For server-to-server calls to the orchestrator and core API. Pass via <code class="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization: Bearer &lt;key&gt;</code> header.</div> <div><span class="font-medium text-foreground">HMAC Signing</span> — Event ingestion requires HMAC-SHA256 signatures. Sign the request body with your <code class="bg-muted px-1.5 py-0.5 rounded text-xs">EVENT_PUBLISH_SECRET</code> and pass via <code class="bg-muted px-1.5 py-0.5 rounded text-xs">X-Signature</code> header.</div> <div><span class="font-medium text-foreground">Session (CF Access)</span> — Console API routes authenticate via Cloudflare Access JWT. The platform extracts tenant context from the JWT claims.</div> <div><span class="font-medium text-foreground">SSO (OIDC/SAML)</span> — Enterprise tenants can configure SSO in Settings &gt; Security. AtlasIT supports any OIDC-compliant identity provider.</div></div></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2"><!> Core API (Orchestrator & Compliance Worker)</h2> <div class="space-y-2"></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2"><!> Console API</h2> <div class="space-y-2"></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2"><!> Building Custom Adapters</h2> <div class="text-sm text-muted-foreground space-y-4"><p>AtlasIT adapters are Cloudflare Workers that implement a standard interface. Use the adapter generator to scaffold a new connector from a manifest:</p> <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs"><div class="text-muted-foreground mb-2"># Generate a new adapter from a manifest</div> <div>npx @atlasit/adapter-gen scaffold --manifest manifests/your-app.json --output adapters/your-app/</div></div> <p>Each adapter must implement these endpoints:</p> <ul class="list-disc pl-5 space-y-1.5"><li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /health</code> — Health check returning <code class="bg-muted px-1.5 py-0.5 rounded text-xs"></code></li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/auth/callback</code> — OAuth callback handler</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /api/sync</code> — Directory sync (users, groups)</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /api/evidence</code> — Compliance evidence collection</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/provision</code> — Provision user access</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/deprovision</code> — Revoke user access</li> <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /webhook</code> — Inbound webhook handler</li></ul> <p>The <code class="bg-muted px-1.5 py-0.5 rounded text-xs">/api/evidence</code> endpoint is critical for compliance scoring. It returns an array of evidence items, each with a type, status (pass/fail/unknown), control references, and details object. The CDT field mapper translates these details into the flat boolean fields that CDT rules evaluate.</p></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2"><!> MCP Agent Protocol</h2> <div class="text-sm text-muted-foreground space-y-4"><p>AtlasIT includes an MCP (Model Context Protocol) server and SDK for building AI-powered IT agents. The MCP SDK provides:</p> <ul class="list-disc pl-5 space-y-1.5"><li><strong>Client SDK</strong> — Connect to the AtlasIT MCP server from desktop agents or mobile clients</li> <li><strong>Server SDK</strong> — Build custom MCP servers with HMAC-signed request verification</li> <li><strong>Tool definitions</strong> — Pre-built tools for user lookup, access provisioning, compliance queries, and incident management</li></ul> <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs"><div class="text-muted-foreground mb-2">// Example: MCP client connecting to AtlasIT</div> <div></div> <div class="mt-1"></div> <div>&nbsp;&nbsp;serverUrl: "https://mcp.atlasit.pro",</div> <div>&nbsp;&nbsp;apiKey: process.env.ATLASIT_MCP_KEY,</div> <div></div> <div class="mt-2"></div> <div>&nbsp;&nbsp;email: "jane@company.com",</div> <div></div></div></div></section> <section class="mb-12"><h2 class="text-xl font-semibold mb-4 flex items-center gap-2"><!> Event Schema</h2> <div class="text-sm text-muted-foreground space-y-4"><p>All events in AtlasIT follow a standard schema. Events trigger automation rules, generate compliance evidence, and drive the JML pipeline:</p> <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs"><div></div> <div>&nbsp;&nbsp;"tenantId": "tenant_abc123",</div> <div>&nbsp;&nbsp;"type": "directory.user.joined",</div> <div>&nbsp;&nbsp;"source": "adapter:google-workspace",</div> <div></div> <div>&nbsp;&nbsp;&nbsp;&nbsp;"userId": "user_xyz",</div> <div>&nbsp;&nbsp;&nbsp;&nbsp;"email": "jane@company.com",</div> <div>&nbsp;&nbsp;&nbsp;&nbsp;"department": "Engineering",</div> <div>&nbsp;&nbsp;&nbsp;&nbsp;"title": "Software Engineer"</div> <div></div> <div>&nbsp;&nbsp;"idempotencyKey": "gws-joined-user_xyz-1712345678"</div> <div></div></div> <p>Common event types:</p> <ul class="list-disc pl-5 space-y-1 text-xs"><li><code class="bg-muted px-1 rounded">directory.user.joined</code> / <code class="bg-muted px-1 rounded">moved</code> / <code class="bg-muted px-1 rounded">left</code> — JML lifecycle events</li> <li><code class="bg-muted px-1 rounded">compliance.score_changed</code> — Framework score crossed a threshold</li> <li><code class="bg-muted px-1 rounded">compliance.evidence_collected</code> — New evidence from an adapter</li> <li><code class="bg-muted px-1 rounded">access.review_required</code> — Access review campaign started</li> <li><code class="bg-muted px-1 rounded">provisioning.requested</code> / <code class="bg-muted px-1 rounded">completed</code> — App access provisioning</li> <li><code class="bg-muted px-1 rounded">incident.created</code> / <code class="bg-muted px-1 rounded">resolved</code> — Security incident lifecycle</li></ul></div></section> <div class="mt-12 text-center text-sm text-muted-foreground"><p>Need help integrating? <a href="/support" class="text-primary hover:underline">Contact support</a></p></div></div></div>`,
  );
function O(o) {
  let d = [
      {
        method: `GET`,
        path: `/api/v1/events`,
        description: `List tenant events (paginated)`,
        auth: `API Key`,
      },
      {
        method: `POST`,
        path: `/api/v1/events`,
        description: `Ingest a new event`,
        auth: `API Key + HMAC`,
      },
      {
        method: `GET`,
        path: `/api/v1/cdt/evaluate`,
        description: `Evaluate CDT controls for a framework`,
        auth: `API Key`,
      },
      {
        method: `POST`,
        path: `/api/v1/policies/evaluate-all`,
        description: `Bulk policy evaluation with CDT payload`,
        auth: `Internal`,
      },
      {
        method: `GET`,
        path: `/api/v1/compliance/evidence`,
        description: `Query compliance evidence`,
        auth: `API Key`,
      },
      {
        method: `POST`,
        path: `/workflow`,
        description: `Create a new workflow execution`,
        auth: `API Key`,
      },
      {
        method: `GET`,
        path: `/workflow/:id`,
        description: `Get workflow execution status`,
        auth: `API Key`,
      },
    ],
    p = [
      {
        method: `GET`,
        path: `/api/tenant-compliance/scores`,
        description: `Compliance scores for all frameworks`,
        auth: `Session`,
      },
      {
        method: `POST`,
        path: `/api/tenant-compliance/scores`,
        description: `Recalculate compliance scores`,
        auth: `Session`,
      },
      {
        method: `GET`,
        path: `/api/evidence-feed`,
        description: `Evidence activity feed with filters`,
        auth: `Session`,
      },
      {
        method: `GET`,
        path: `/api/automation/rules`,
        description: `List automation rules`,
        auth: `Session`,
      },
      {
        method: `POST`,
        path: `/api/automation/rules`,
        description: `Create automation rule`,
        auth: `Session`,
      },
      {
        method: `POST`,
        path: `/api/automation/simulate`,
        description: `Dry-run simulate a rule`,
        auth: `Session`,
      },
      {
        method: `GET`,
        path: `/api/integrations/health`,
        description: `Adapter collection health status`,
        auth: `Session`,
      },
      {
        method: `GET`,
        path: `/api/access-reviews`,
        description: `List access review campaigns`,
        auth: `Session`,
      },
      {
        method: `GET`,
        path: `/api/trust/:slug`,
        description: `Public trust center data`,
        auth: `None`,
      },
    ],
    g = {
      GET: `bg-emerald-500/10 text-emerald-500 border-emerald-500/20`,
      POST: `bg-blue-500/10 text-blue-500 border-blue-500/20`,
      PUT: `bg-amber-500/10 text-amber-500 border-amber-500/20`,
      DELETE: `bg-red-500/10 text-red-500 border-red-500/20`,
    };
  var b = ue();
  t(`1dolngo`, (e) => {
    var t = ie();
    (u(() => {
      h.title = `Developers — AtlasIT`;
    }),
      r(e, t));
  });
  var x = f(b),
    O = f(x);
  (ee(f(O), { class: `h-4 w-4` }), y(), s(O));
  var k = _(O, 6),
    A = f(k);
  w(A, {
    children: (e, t) => {
      T(e, {
        class: `pt-5 flex items-start gap-3`,
        children: (e, t) => {
          var n = ae();
          (S(m(n), { class: `h-5 w-5 text-primary mt-0.5 shrink-0` }), y(2), r(e, n));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  });
  var j = _(A, 2);
  (w(j, {
    children: (e, t) => {
      T(e, {
        class: `pt-5 flex items-start gap-3`,
        children: (e, t) => {
          var n = oe();
          (D(m(n), { class: `h-5 w-5 text-primary mt-0.5 shrink-0` }), y(2), r(e, n));
        },
        $$slots: { default: !0 },
      });
    },
    $$slots: { default: !0 },
  }),
    w(_(j, 2), {
      children: (e, t) => {
        T(e, {
          class: `pt-5 flex items-start gap-3`,
          children: (e, t) => {
            var n = se();
            (C(m(n), { class: `h-5 w-5 text-primary mt-0.5 shrink-0` }), y(2), r(e, n));
          },
          $$slots: { default: !0 },
        });
      },
      $$slots: { default: !0 },
    }),
    s(k));
  var M = _(k, 2),
    N = f(M);
  (S(f(N), { class: `h-5 w-5` }), y(), s(N), y(2), s(M));
  var P = _(M, 2),
    F = f(P);
  (re(f(F), { class: `h-5 w-5` }), y(), s(F));
  var I = _(F, 2);
  (i(
    I,
    5,
    () => d,
    a,
    (t, i) => {
      var a = ce(),
        o = f(a),
        u = f(o, !0);
      s(o);
      var d = _(o, 2),
        p = f(d, !0);
      s(d);
      var m = _(d, 2),
        h = f(m, !0);
      (s(m),
        E(_(m, 2), {
          variant: `outline`,
          class: `text-[10px] shrink-0`,
          children: (t, a) => {
            y();
            var o = c();
            (e(() => n(o, l(i).auth)), r(t, o));
          },
          $$slots: { default: !0 },
        }),
        s(a),
        e(() => {
          (v(
            o,
            1,
            `text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${(g[l(i).method] || ``) ?? ``}`,
          ),
            n(u, l(i).method),
            n(p, l(i).path),
            n(h, l(i).description));
        }),
        r(t, a));
    },
  ),
    s(I),
    s(P));
  var L = _(P, 2),
    R = f(L);
  (ne(f(R), { class: `h-5 w-5` }), y(), s(R));
  var z = _(R, 2);
  (i(
    z,
    5,
    () => p,
    a,
    (t, i) => {
      var a = le(),
        o = f(a),
        u = f(o, !0);
      s(o);
      var d = _(o, 2),
        p = f(d, !0);
      s(d);
      var m = _(d, 2),
        h = f(m, !0);
      (s(m),
        E(_(m, 2), {
          variant: `outline`,
          class: `text-[10px] shrink-0`,
          children: (t, a) => {
            y();
            var o = c();
            (e(() => n(o, l(i).auth)), r(t, o));
          },
          $$slots: { default: !0 },
        }),
        s(a),
        e(() => {
          (v(
            o,
            1,
            `text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${(g[l(i).method] || ``) ?? ``}`,
          ),
            n(u, l(i).method),
            n(p, l(i).path),
            n(h, l(i).description));
        }),
        r(t, a));
    },
  ),
    s(z),
    s(L));
  var B = _(L, 2),
    V = f(B);
  (C(f(V), { class: `h-5 w-5` }), y(), s(V));
  var H = _(V, 2),
    U = _(f(H), 6),
    W = f(U),
    de = _(f(W), 2);
  ((de.textContent = `{ ok: true }`), s(W), y(12), s(U), y(2), s(H), s(B));
  var G = _(B, 2),
    K = f(G);
  (te(f(K), { class: `h-5 w-5` }), y(), s(K));
  var q = _(K, 2),
    J = _(f(q), 4),
    Y = _(f(J), 2);
  Y.textContent = `import { McpClient } from "@atlasit/mcp-sdk";`;
  var X = _(Y, 2);
  X.textContent = `const client = new McpClient({`;
  var Z = _(X, 6);
  Z.textContent = `});`;
  var fe = _(Z, 2);
  fe.textContent = `const result = await client.call("lookup_user", {`;
  var pe = _(fe, 4);
  ((pe.textContent = `});`), s(J), s(q), s(G));
  var me = _(G, 2),
    Q = f(me);
  (D(f(Q), { class: `h-5 w-5` }), y(), s(Q));
  var he = _(Q, 2),
    ge = _(f(he), 2),
    _e = f(ge);
  _e.textContent = `{`;
  var ve = _(_e, 8);
  ve.textContent = `\xA0\xA0"payload": {`;
  var $ = _(ve, 10);
  $.textContent = `\xA0\xA0},`;
  var ye = _($, 4);
  ((ye.textContent = `}`), s(ge), y(4), s(he), s(me), y(2), s(x), s(b), r(o, b));
}
export { O as component };
