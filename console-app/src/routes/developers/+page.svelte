<script lang="ts">
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { ArrowLeft, Code2, Webhook, Key, Puzzle, Terminal, BookOpen } from "lucide-svelte";

  interface ApiEndpoint {
    method: string;
    path: string;
    description: string;
    auth: string;
  }

  const coreEndpoints: ApiEndpoint[] = [
    { method: "GET", path: "/api/v1/events", description: "List tenant events (paginated)", auth: "API Key" },
    { method: "POST", path: "/api/v1/events", description: "Ingest a new event", auth: "API Key + HMAC" },
    { method: "GET", path: "/api/v1/cdt/evaluate", description: "Evaluate CDT controls for a framework", auth: "API Key" },
    { method: "POST", path: "/api/v1/policies/evaluate-all", description: "Bulk policy evaluation with CDT payload", auth: "Internal" },
    { method: "GET", path: "/api/v1/compliance/evidence", description: "Query compliance evidence", auth: "API Key" },
    { method: "POST", path: "/workflow", description: "Create a new workflow execution", auth: "API Key" },
    { method: "GET", path: "/workflow/:id", description: "Get workflow execution status", auth: "API Key" },
  ];

  const consoleEndpoints: ApiEndpoint[] = [
    { method: "GET", path: "/api/tenant-compliance/scores", description: "Compliance scores for all frameworks", auth: "Session" },
    { method: "POST", path: "/api/tenant-compliance/scores", description: "Recalculate compliance scores", auth: "Session" },
    { method: "GET", path: "/api/evidence-feed", description: "Evidence activity feed with filters", auth: "Session" },
    { method: "GET", path: "/api/automation/rules", description: "List automation rules", auth: "Session" },
    { method: "POST", path: "/api/automation/rules", description: "Create automation rule", auth: "Session" },
    { method: "POST", path: "/api/automation/simulate", description: "Dry-run simulate a rule", auth: "Session" },
    { method: "GET", path: "/api/integrations/health", description: "Adapter collection health status", auth: "Session" },
    { method: "GET", path: "/api/access-reviews", description: "List access review campaigns", auth: "Session" },
    { method: "GET", path: "/api/trust/:slug", description: "Public trust center data", auth: "None" },
  ];

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
  };
</script>

<svelte:head>
  <title>Developers — AtlasIT</title>
  <meta name="description" content="AtlasIT developer documentation — APIs, webhooks, adapters, and MCP integration." />
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
  <div class="max-w-4xl mx-auto px-4 py-12">
    <a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
      <ArrowLeft class="h-4 w-4" /> Back
    </a>

    <h1 class="text-3xl font-bold mb-2">Developer Documentation</h1>
    <p class="text-muted-foreground mb-10">Build on AtlasIT — APIs, webhooks, custom adapters, and the MCP agent protocol.</p>

    <!-- Quick Links -->
    <div class="grid gap-4 md:grid-cols-3 mb-12">
      <Card>
        <CardContent class="pt-5 flex items-start gap-3">
          <Key class="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 class="font-semibold text-sm">Authentication</h3>
            <p class="text-xs text-muted-foreground mt-1">API keys, HMAC signing, CF Access JWT, and SSO integration</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-5 flex items-start gap-3">
          <Webhook class="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 class="font-semibold text-sm">Webhooks</h3>
            <p class="text-xs text-muted-foreground mt-1">Receive real-time events via HMAC-signed webhook delivery</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="pt-5 flex items-start gap-3">
          <Puzzle class="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h3 class="font-semibold text-sm">Custom Adapters</h3>
            <p class="text-xs text-muted-foreground mt-1">Build connectors with the adapter SDK and manifest schema</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Authentication -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Key class="h-5 w-5" /> Authentication
      </h2>
      <div class="space-y-4 text-sm text-muted-foreground">
        <p>AtlasIT uses multiple authentication methods depending on the context:</p>
        <div class="bg-muted/50 rounded-lg p-4 space-y-3">
          <div>
            <span class="font-medium text-foreground">API Key</span> — For server-to-server calls to the orchestrator and core API. Pass via <code class="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization: Bearer &lt;key&gt;</code> header.
          </div>
          <div>
            <span class="font-medium text-foreground">HMAC Signing</span> — Event ingestion requires HMAC-SHA256 signatures. Sign the request body with your <code class="bg-muted px-1.5 py-0.5 rounded text-xs">EVENT_PUBLISH_SECRET</code> and pass via <code class="bg-muted px-1.5 py-0.5 rounded text-xs">X-Signature</code> header.
          </div>
          <div>
            <span class="font-medium text-foreground">Session (CF Access)</span> — Console API routes authenticate via Cloudflare Access JWT. The platform extracts tenant context from the JWT claims.
          </div>
          <div>
            <span class="font-medium text-foreground">SSO (OIDC/SAML)</span> — Enterprise tenants can configure SSO in Settings &gt; Security. AtlasIT supports any OIDC-compliant identity provider.
          </div>
        </div>
      </div>
    </section>

    <!-- Core API Endpoints -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Terminal class="h-5 w-5" /> Core API (Orchestrator & Compliance Worker)
      </h2>
      <div class="space-y-2">
        {#each coreEndpoints as ep}
          <div class="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
            <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded border {methodColors[ep.method] || ''}">{ep.method}</span>
            <code class="text-sm font-mono flex-1">{ep.path}</code>
            <span class="text-xs text-muted-foreground hidden md:block">{ep.description}</span>
            <Badge variant="outline" class="text-[10px] shrink-0">{ep.auth}</Badge>
          </div>
        {/each}
      </div>
    </section>

    <!-- Console API Endpoints -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Code2 class="h-5 w-5" /> Console API
      </h2>
      <div class="space-y-2">
        {#each consoleEndpoints as ep}
          <div class="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
            <span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded border {methodColors[ep.method] || ''}">{ep.method}</span>
            <code class="text-sm font-mono flex-1">{ep.path}</code>
            <span class="text-xs text-muted-foreground hidden md:block">{ep.description}</span>
            <Badge variant="outline" class="text-[10px] shrink-0">{ep.auth}</Badge>
          </div>
        {/each}
      </div>
    </section>

    <!-- Adapter SDK -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Puzzle class="h-5 w-5" /> Building Custom Adapters
      </h2>
      <div class="text-sm text-muted-foreground space-y-4">
        <p>AtlasIT adapters are Cloudflare Workers that implement a standard interface. Use the adapter generator to scaffold a new connector from a manifest:</p>
        <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs">
          <div class="text-muted-foreground mb-2"># Generate a new adapter from a manifest</div>
          <div>npx @atlasit/adapter-gen scaffold --manifest manifests/your-app.json --output adapters/your-app/</div>
        </div>
        <p>Each adapter must implement these endpoints:</p>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /health</code> — Health check returning <code class="bg-muted px-1.5 py-0.5 rounded text-xs">{"{ ok: true }"}</code></li>
          <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/auth/callback</code> — OAuth callback handler</li>
          <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /api/sync</code> — Directory sync (users, groups)</li>
          <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">GET /api/evidence</code> — Compliance evidence collection</li>
          <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/provision</code> — Provision user access</li>
          <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /api/deprovision</code> — Revoke user access</li>
          <li><code class="bg-muted px-1.5 py-0.5 rounded text-xs">POST /webhook</code> — Inbound webhook handler</li>
        </ul>
        <p>
          The <code class="bg-muted px-1.5 py-0.5 rounded text-xs">/api/evidence</code> endpoint is critical for compliance scoring. It returns an array of evidence items, each with a type, status (pass/fail/unknown), control references, and details object. The CDT field mapper translates these details into the flat boolean fields that CDT rules evaluate.
        </p>
      </div>
    </section>

    <!-- MCP Protocol -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <BookOpen class="h-5 w-5" /> MCP Agent Protocol
      </h2>
      <div class="text-sm text-muted-foreground space-y-4">
        <p>
          AtlasIT includes an MCP (Model Context Protocol) server and SDK for building AI-powered IT agents. The MCP SDK provides:
        </p>
        <ul class="list-disc pl-5 space-y-1.5">
          <li><strong>Client SDK</strong> — Connect to the AtlasIT MCP server from desktop agents or mobile clients</li>
          <li><strong>Server SDK</strong> — Build custom MCP servers with HMAC-signed request verification</li>
          <li><strong>Tool definitions</strong> — Pre-built tools for user lookup, access provisioning, compliance queries, and incident management</li>
        </ul>
        <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs">
          <div class="text-muted-foreground mb-2">// Example: MCP client connecting to AtlasIT</div>
          <div>import {"{ McpClient }"} from "@atlasit/mcp-sdk";</div>
          <div class="mt-1">const client = new McpClient({"{"}</div>
          <div>&nbsp;&nbsp;serverUrl: "https://mcp.atlasit.pro",</div>
          <div>&nbsp;&nbsp;apiKey: process.env.ATLASIT_MCP_KEY,</div>
          <div>{"}"});</div>
          <div class="mt-2">const result = await client.call("lookup_user", {"{"}</div>
          <div>&nbsp;&nbsp;email: "jane@company.com",</div>
          <div>{"}"});</div>
        </div>
      </div>
    </section>

    <!-- Event Schema -->
    <section class="mb-12">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Webhook class="h-5 w-5" /> Event Schema
      </h2>
      <div class="text-sm text-muted-foreground space-y-4">
        <p>All events in AtlasIT follow a standard schema. Events trigger automation rules, generate compliance evidence, and drive the JML pipeline:</p>
        <div class="bg-muted/50 rounded-lg p-4 font-mono text-xs">
          <div>{"{"}</div>
          <div>&nbsp;&nbsp;"tenantId": "tenant_abc123",</div>
          <div>&nbsp;&nbsp;"type": "directory.user.joined",</div>
          <div>&nbsp;&nbsp;"source": "adapter:google-workspace",</div>
          <div>&nbsp;&nbsp;"payload": {"{"}</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;"userId": "user_xyz",</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;"email": "jane@company.com",</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;"department": "Engineering",</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;"title": "Software Engineer"</div>
          <div>&nbsp;&nbsp;{"}"},</div>
          <div>&nbsp;&nbsp;"idempotencyKey": "gws-joined-user_xyz-1712345678"</div>
          <div>{"}"}</div>
        </div>
        <p>Common event types:</p>
        <ul class="list-disc pl-5 space-y-1 text-xs">
          <li><code class="bg-muted px-1 rounded">directory.user.joined</code> / <code class="bg-muted px-1 rounded">moved</code> / <code class="bg-muted px-1 rounded">left</code> — JML lifecycle events</li>
          <li><code class="bg-muted px-1 rounded">compliance.score_changed</code> — Framework score crossed a threshold</li>
          <li><code class="bg-muted px-1 rounded">compliance.evidence_collected</code> — New evidence from an adapter</li>
          <li><code class="bg-muted px-1 rounded">access.review_required</code> — Access review campaign started</li>
          <li><code class="bg-muted px-1 rounded">provisioning.requested</code> / <code class="bg-muted px-1 rounded">completed</code> — App access provisioning</li>
          <li><code class="bg-muted px-1 rounded">incident.created</code> / <code class="bg-muted px-1 rounded">resolved</code> — Security incident lifecycle</li>
        </ul>
      </div>
    </section>

    <div class="mt-12 text-center text-sm text-muted-foreground">
      <p>Need help integrating? <a href="/support" class="text-primary hover:underline">Contact support</a></p>
    </div>
  </div>
</div>
