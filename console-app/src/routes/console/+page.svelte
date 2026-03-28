<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import { mark } from "$lib/instrumentation/ux-metrics";
  import { fetchSession } from "$lib/stores/session";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import Avatar from "$lib/components/ui/avatar.svelte";
  import {
    Users,
    AppWindow,
    GitBranch,
    Lightbulb,
    Building2,
    UserCheck,
    Workflow,
    RefreshCw,
    Copy,
    ArrowRight,
    AlertTriangle,
    KeyRound,
    Siren,
    ShieldCheck,
    Link,
    Sparkles,
    Activity,
  } from "lucide-svelte";

  interface ComplianceScore {
    framework: string;
    score: number;
    grade?: string;
  }

  interface AccessReviewCampaign {
    id: string;
    status: string;
  }

  interface Incident {
    id: string;
    status: string;
  }

  interface AutomationExecution {
    id: string;
    ruleId?: string | null;
    ruleName: string | null;
    triggerEvent: unknown;
    status: string;
    durationMs: number | null;
    startedAt: string;
    completedAt: string | null;
  }

  interface EvidenceWaterfallItem {
    id: string;
    framework: string;
    controlId: string;
    impact: "positive" | "detrimental" | "neutral";
    eventType: string;
    source: string;
    actor: string;
    createdAt: string;
  }

  let loading = true;
  let error: string | null = null;
  let session: any = null;
  let isPlatformOwner = false;
  let showPlatformView = false;

  let connectedAppsCount = 0;
  let complianceScores: ComplianceScore[] = [];
  let activeAccessReviews = 0;
  let openIncidents = 0;
  let recentAutomationRuns: AutomationExecution[] = [];
  let evidenceWaterfall: EvidenceWaterfallItem[] = [];
  let evidenceWaterfallTotal = 0;

  let platformData: {
    tenants: { total: number; active: number; disabled: number };
    users: { total: number };
    recentTenants: any[];
    recentActivity: any[];
    workflows: { total: number };
  } | null = null;

  let tenantData: {
    connectedApps: number;
    directory: { connected: boolean; provider: string | null; userCount: number; groupCount: number; lastSync: string | null };
    activeMappings: number;
    pendingSuggestions: number;
    recentActivity: any[];
    workflows: { total: number };
    compliance?: {
      scores: Array<{ framework: string; score: number; grade: string; controlsTotal: number; controlsImplemented: number; controlsVerified: number; calculatedAt: string }>;
      overallScore: number | null;
      evidenceCount: number;
    };
    automation?: {
      activeRules: number;
      executions24h: number;
    };
  } | null = null;

  let inviteCopied = false;

  $: showIdpBanner = $page.url.searchParams.get("setup") === "idp";

  function gradeFromScore(score: number): string {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  function scoreBadgeVariant(score: number): "success" | "warning" | "destructive" {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  }

  function formatDuration(ms: number | null): string {
    if (!ms || ms <= 0) return "--";
    if (ms < 1000) return `${ms}ms`;
    const sec = Math.round(ms / 1000);
    return `${sec}s`;
  }

  function triggerLabel(value: unknown): string {
    if (!value) return "manual";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return String(obj.type ?? obj.name ?? obj.event ?? "trigger");
    }
    return "trigger";
  }

  function escapeCSV(value: string | number | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    const safe = /^[=+\-@\t\r]/.test(str) ? "'" + str : str;
    if (safe.includes(",") || safe.includes('"') || safe.includes("\n") || safe.includes("\r")) {
      return '"' + safe.replace(/"/g, '""') + '"';
    }
    return safe;
  }

  async function trackGrowthEvent(event: string, inviteId: string) {
    mark(`growth:${event}`, { inviteId });
    try {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, inviteId }),
      });
    } catch {
      // non-blocking analytics
    }
  }

  async function copyInviteLink() {
    if (!session?.tenantId) return;
    try {
      const url = new URL(`${window.location.origin}/console/login`);
      url.searchParams.set("invite", session.tenantId);
      await navigator.clipboard.writeText(url.toString());
      inviteCopied = true;
      pushToast({ message: "Invite link copied. Share it with your team.", variant: "success" });
      await trackGrowthEvent("invite_link_copied", session.tenantId);
    } catch {
      pushToast({ message: "Could not copy link. Please copy it manually.", variant: "error" });
    }
  }

  async function load() {
    loading = true;
    error = null;

    try {
      session = await fetchSession();
      if (!session) throw new Error("Not authenticated");

      const email = session.email || "";
      isPlatformOwner =
        (email.endsWith("@atlasit.pro") || email.endsWith("@atlas.app")) &&
        session.superAdmin === true &&
        !session.impersonating;

      // If platform owner but no tenant context, force the platform view
      if (isPlatformOwner && !session.tenantId) {
        showPlatformView = true;
      }

      // Always load platform data for platform owners (used in toggle view)
      if (isPlatformOwner) {
        const res = await fetch("/api/platform/dashboard");
        if (res.ok) {
          platformData = await res.json();
        }
        // If no tenant context, stop here
        if (!session.tenantId) return;
      }

      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [tenantRes, scoresRes, reviewsRes, incidentsRes, runsRes, evidenceRes] =
        await Promise.all([
          fetch("/api/tenant/dashboard"),
          fetch("/api/tenant-compliance/scores"),
          fetch("/api/access-reviews"),
          fetch("/api/incidents"),
          fetch("/api/automation/executions?limit=5"),
          fetch(`/api/evidence-feed?limit=8&since=${encodeURIComponent(since)}`),
        ]);

      if (!tenantRes.ok) {
        throw new Error(`Tenant dashboard fetch failed (${tenantRes.status})`);
      }

      tenantData = await tenantRes.json();
      connectedAppsCount = tenantData?.connectedApps ?? 0;

      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        complianceScores = Array.isArray(scoresData?.scores)
          ? scoresData.scores.map((row: any) => ({
              framework: row.framework,
              score: Number(row.score ?? 0),
              grade: row.grade,
            }))
          : [];
      } else {
        complianceScores = [];
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const campaigns: AccessReviewCampaign[] = Array.isArray(reviewsData?.campaigns)
          ? reviewsData.campaigns
          : [];
        activeAccessReviews = campaigns.filter((c) => c.status === "active").length;
      } else {
        activeAccessReviews = 0;
      }

      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json();
        const incidents: Incident[] = Array.isArray(incidentsData?.items)
          ? incidentsData.items
          : [];
        const OPEN_INCIDENT_STATUSES = new Set(["open", "investigating", "triaged", "active"]);
        openIncidents = incidents.filter((incident) =>
          OPEN_INCIDENT_STATUSES.has(String(incident.status || "").toLowerCase()),
        ).length;
      } else {
        openIncidents = 0;
      }

      if (runsRes.ok) {
        const runsData = await runsRes.json();
        recentAutomationRuns = Array.isArray(runsData?.executions)
          ? runsData.executions
          : [];
      } else {
        recentAutomationRuns = [];
      }

      if (evidenceRes.ok) {
        const evidenceData = await evidenceRes.json();
        evidenceWaterfall = Array.isArray(evidenceData?.feed) ? evidenceData.feed : [];
        evidenceWaterfallTotal = evidenceData?.summary?.totalEvidence ?? 0;
      } else {
        evidenceWaterfall = [];
        evidenceWaterfallTotal = 0;
      }
    } catch (e: any) {
      error = e?.message || "Failed to load dashboard";
    } finally {
      loading = false;
    }
  }

  onMount(load);
</script>

<div class="space-y-6">
  {#if showIdpBanner}
    <div class="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
      <div>
        <div class="font-medium text-foreground">Complete your directory setup</div>
        <div class="text-sm text-muted-foreground">Authorize your identity provider to sync users and groups</div>
      </div>
      <Button href="/console/marketplace" size="sm">
        <Link class="h-4 w-4 mr-2" />
        Connect Now
      </Button>
    </div>
  {/if}

  {#if loading}
    <div class="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <Skeleton class="h-8 w-48" />
      <Skeleton class="h-4 w-64" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {#each [1, 2, 3, 4] as _}
          <Skeleton class="h-24 rounded-lg" />
        {/each}
      </div>
    </div>

  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>

  {:else if showPlatformView && platformData}
    <!-- Platform Owner Dashboard -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Platform Overview</h1>
        <p class="text-sm text-muted-foreground">AtlasIT platform administration</p>
      </div>
      <div class="flex items-center gap-2">
        {#if session?.tenantId}
          <Button on:click={() => { showPlatformView = false; }} variant="outline" size="sm">
            My Dashboard
          </Button>
        {/if}
        <Button href="/console/admin" variant="outline" size="sm">Admin</Button>
        <Button href="/console/settings" variant="outline" size="sm">Settings</Button>
        <Button on:click={load} variant="secondary" size="sm">
          <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <a href="/console/admin" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Total Tenants</div>
              <Building2 class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.tenants.total}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/admin" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Active Tenants</div>
              <UserCheck class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.tenants.active}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/admin" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Total Users</div>
              <Users class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.users.total}</div>
          </CardContent>
        </Card>
      </a>
      <a href="/console/workflows" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Workflows (24h)</div>
              <Workflow class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{platformData.workflows.total}</div>
          </CardContent>
        </Card>
      </a>
    </div>

    <!-- Recent Tenants -->
    {#if platformData.recentTenants.length > 0}
      <Card class="mb-6">
        <CardHeader class="flex-row items-center justify-between">
          <CardTitle>Recent Tenants</CardTitle>
          <Button href="/console/admin" variant="ghost" size="sm">
            View all
            <ArrowRight class="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-5 py-3 font-medium">Name</th>
                  <th class="px-5 py-3 font-medium">Owner</th>
                  <th class="px-5 py-3 font-medium">Users</th>
                  <th class="px-5 py-3 font-medium">Status</th>
                  <th class="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {#each platformData.recentTenants as tenant}
                  <tr class="border-t hover:bg-muted/50 cursor-pointer" on:click={() => window.location.href = `/console/admin?tenant=${tenant.id}`}>
                    <td class="px-5 py-3 font-medium">
                      <a href={`/console/admin?tenant=${tenant.id}`} class="hover:text-primary transition-colors">{tenant.name}</a>
                    </td>
                    <td class="px-5 py-3 text-muted-foreground">{tenant.owner || '-'}</td>
                    <td class="px-5 py-3 text-muted-foreground">{tenant.users ?? '-'}</td>
                    <td class="px-5 py-3">
                      <Badge variant={tenant.status === 'active' ? 'success' : 'warning'}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td class="px-5 py-3 text-muted-foreground">{tenant.created ? new Date(tenant.created).toLocaleDateString() : '-'}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Recent Activity -->
    {#if platformData.recentActivity.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            {#each platformData.recentActivity as entry}
              <div class="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-primary/60 shrink-0"></div>
                  <div>
                    <div class="text-sm">{entry.description || entry.action}</div>
                    {#if entry.tenant}
                      <div class="text-xs text-muted-foreground mt-0.5">{entry.tenant}</div>
                    {/if}
                  </div>
                </div>
                <div class="text-xs text-muted-foreground shrink-0 ml-4">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

  {:else}
    <!-- Tenant Dashboard -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          Dashboard
          {#if session?.orgName}
            <span class="text-lg font-normal text-muted-foreground ml-2">{session.orgName}</span>
          {/if}
        </h1>
        <p class="text-sm text-muted-foreground">Your organization overview</p>
      </div>
      <div class="flex items-center gap-2">
        {#if isPlatformOwner && platformData}
          <Button on:click={() => { showPlatformView = true; }} variant="outline" size="sm">
            Platform Overview
          </Button>
        {/if}
        <Button on:click={copyInviteLink} size="sm" title="Copy team invite link">
          <Copy class="h-3.5 w-3.5 mr-1.5" />
          {inviteCopied ? "Invite Link Copied" : "Invite Team"}
        </Button>
        <Button href="/console/workflows" variant="secondary" size="sm">View Workflows</Button>
        <Button on:click={load} variant="ghost" size="sm">
          <RefreshCw class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <!-- Directory setup banner -->
    {#if tenantData?.directory?.connected === false}
      <div class="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div class="font-medium text-foreground">Connect your identity provider to get started</div>
          <div class="text-sm text-muted-foreground">Sync users and groups from your directory to automate JML workflows</div>
        </div>
        <Button href="/console/marketplace" size="sm" variant="outline">
          Connect Directory
        </Button>
      </div>
    {/if}

    <!-- Getting started empty state -->
    {#if tenantData?.connectedApps === 0 && !tenantData?.directory?.connected}
      <Card class="border-dashed">
        <CardContent class="py-8 text-center">
          <Sparkles class="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h2 class="text-xl font-semibold mb-2">Welcome to AtlasIT</h2>
          <p class="text-muted-foreground mb-4 max-w-md mx-auto">Get started by connecting your identity provider and applications to automate compliance and lifecycle management.</p>
          <div class="flex gap-3 justify-center">
            <Button href="/console/onboarding">Setup Wizard</Button>
            <Button href="/console/marketplace" variant="outline">Browse Marketplace</Button>
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- top KPI tiles -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <a href="/console/marketplace" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Connected Apps</div>
              <AppWindow class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{connectedAppsCount}</div>
          </CardContent>
        </Card>
      </a>

      <a href="/console/directory" class="no-underline">
        <Card class="hover:border-primary/40 transition-colors cursor-pointer">
          <CardContent class="pt-5">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-muted-foreground">Directory Users</div>
              <Users class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="text-3xl font-bold mt-1">{tenantData?.directory?.userCount ?? 0}</div>
          </CardContent>
        </Card>
      </a>

      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-muted-foreground">Active Access Reviews</div>
            <KeyRound class="h-4 w-4 text-muted-foreground" />
          </div>
          <div class="text-3xl font-bold mt-1">{activeAccessReviews}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-muted-foreground">Open Incidents</div>
            <Siren class="h-4 w-4 text-muted-foreground" />
          </div>
          <div class="text-3xl font-bold mt-1">{openIncidents}</div>
        </CardContent>
      </Card>
    </div>

    <!-- Compliance Posture -->
    {#if tenantData?.compliance}
      <Card>
        <CardHeader class="flex-row items-center justify-between">
          <CardTitle>Compliance Posture</CardTitle>
          <Button href="/console/compliance" variant="ghost" size="sm">
            View Details
            <ArrowRight class="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {#if tenantData.compliance.scores.length > 0}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each tenantData.compliance.scores as fw}
                <div class="flex items-center gap-3 p-3 rounded-lg border">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm {fw.score >= 80 ? 'bg-green-500/15 text-green-500' : fw.score >= 50 ? 'bg-yellow-500/15 text-yellow-500' : 'bg-red-500/15 text-red-500'}">
                    {fw.grade}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium">{fw.framework}</div>
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div class="h-full rounded-full transition-all {fw.score >= 80 ? 'bg-green-500' : fw.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}" style="width: {fw.score}%"></div>
                      </div>
                      <span class="text-xs text-muted-foreground shrink-0">{Math.round(fw.score)}%</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
            <div class="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
              <span>{tenantData.compliance.evidenceCount} evidence item{tenantData.compliance.evidenceCount !== 1 ? 's' : ''} collected</span>
              <span>{tenantData.automation?.activeRules ?? 0} active automation rule{(tenantData.automation?.activeRules ?? 0) !== 1 ? 's' : ''}</span>
              {#if tenantData.automation?.executions24h}
                <span>{tenantData.automation.executions24h} execution{tenantData.automation.executions24h !== 1 ? 's' : ''} (24h)</span>
              {/if}
            </div>
          {:else}
            <div class="text-center py-4">
              <p class="text-sm text-muted-foreground mb-2">No compliance scores yet. Visit Compliance to evaluate your configuration.</p>
              <Button href="/console/compliance" variant="outline" size="sm">Evaluate Compliance</Button>
            </div>
          {/if}
        </CardContent>
      </Card>
    {:else}
      <!-- Fallback: compliance tiles from API scores -->
      <div class="space-y-3">
        <div class="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Compliance by framework</div>
        {#if complianceScores.length === 0}
          <Card class="border-dashed">
            <CardContent class="py-6 text-sm text-muted-foreground">No compliance score data available yet.</CardContent>
          </Card>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each complianceScores as score}
              <Card>
                <CardContent class="pt-5 space-y-2">
                  <div class="flex items-center justify-between gap-2">
                    <div class="text-sm font-medium">{score.framework}</div>
                    <Badge variant={scoreBadgeVariant(score.score)}>{score.grade || gradeFromScore(score.score)}</Badge>
                  </div>
                  <div class="text-3xl font-bold">{Math.round(score.score)}%</div>
                  <div class="h-2 rounded-full bg-muted overflow-hidden">
                    <div class="h-full bg-primary" style={`width: ${Math.max(0, Math.min(100, score.score))}%`} />
                  </div>
                </CardContent>
              </Card>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Evidence Waterfall -->
    {#if evidenceWaterfall.length > 0}
      <Card>
        <CardHeader class="flex-row items-center justify-between">
          <div class="flex items-center gap-2">
            <Activity class="h-4 w-4 text-primary" />
            <CardTitle>Live Evidence Stream</CardTitle>
            <Badge variant="secondary">{evidenceWaterfallTotal} total</Badge>
          </div>
          <Button href="/console/compliance/feed" variant="ghost" size="sm">
            Full feed
            <ArrowRight class="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            {#each evidenceWaterfall as item}
              <div class="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-2 h-2 rounded-full shrink-0 {item.impact === 'positive' ? 'bg-green-500' : item.impact === 'detrimental' ? 'bg-red-500' : 'bg-gray-400'}"></div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate">
                      {item.eventType || item.source}
                      <span class="font-normal text-muted-foreground"> → {item.framework} {item.controlId}</span>
                    </div>
                    <div class="text-xs text-muted-foreground">{item.actor || "system"} · {item.source}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <Badge variant={item.impact === "positive" ? "success" : item.impact === "detrimental" ? "destructive" : "secondary"}>
                    {item.impact}
                  </Badge>
                  <span class="text-[11px] text-muted-foreground">{new Date(item.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Pending suggestions CTA -->
    {#if tenantData && tenantData.pendingSuggestions > 0}
      <Card class="border-primary/20 bg-primary/5">
        <CardContent class="py-4 flex items-center justify-between">
          <div>
            <div class="font-medium">Review {tenantData.pendingSuggestions} suggested app mapping{tenantData.pendingSuggestions !== 1 ? 's' : ''}</div>
            <div class="text-sm text-muted-foreground mt-1">AtlasIT detected apps that can be mapped to directory groups</div>
          </div>
          <Button href="/console/directory?tab=mappings" size="sm">
            Review Suggestions
            <ArrowRight class="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardContent>
      </Card>
    {/if}

    <!-- recent automation runs -->
    <Card>
      <CardHeader class="flex-row items-center justify-between">
        <CardTitle>Recent Automation Runs</CardTitle>
        <Button href="/console/automation/runs" variant="ghost" size="sm">View all</Button>
      </CardHeader>
      <CardContent class="p-0">
        {#if recentAutomationRuns.length === 0}
          <div class="px-5 py-8 text-sm text-muted-foreground">No recent automation executions found.</div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-muted-foreground text-xs uppercase tracking-wider border-b">
                  <th class="px-5 py-3 font-medium">Rule</th>
                  <th class="px-5 py-3 font-medium">Trigger</th>
                  <th class="px-5 py-3 font-medium">Status</th>
                  <th class="px-5 py-3 font-medium">Duration</th>
                  <th class="px-5 py-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {#each recentAutomationRuns as run}
                  <tr class="border-t hover:bg-muted/50 cursor-pointer transition-colors" on:click={() => { window.location.href = `/console/automation?tab=history&exec=${run.id}`; }}>
                    <td class="px-5 py-3 font-medium">{run.ruleName || run.ruleId || "Untitled rule"}</td>
                    <td class="px-5 py-3 text-muted-foreground">{triggerLabel(run.triggerEvent)}</td>
                    <td class="px-5 py-3">
                      <Badge variant={run.status === "success" ? "success" : run.status === "failed" ? "destructive" : "secondary"}>
                        {run.status}
                      </Badge>
                    </td>
                    <td class="px-5 py-3 text-muted-foreground">{formatDuration(run.durationMs)}</td>
                    <td class="px-5 py-3 text-muted-foreground">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "--"}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Recent Activity -->
    {#if tenantData && tenantData.recentActivity.length > 0}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="divide-y">
            {#each tenantData.recentActivity as entry}
              <div class="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full bg-primary/60 shrink-0"></div>
                  <div>
                    <div class="text-sm">{entry.description || entry.action}</div>
                    {#if entry.user}
                      <div class="text-xs text-muted-foreground mt-0.5">{entry.user}</div>
                    {/if}
                  </div>
                </div>
                <div class="text-xs text-muted-foreground shrink-0 ml-4">{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}</div>
              </div>
            {/each}
          </div>
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>
