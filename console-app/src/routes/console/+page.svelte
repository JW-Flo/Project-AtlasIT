<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { fetchSession } from "$lib/stores/session";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Alert from "$lib/components/ui/alert.svelte";
  import {
    AlertTriangle,
    RefreshCw,
    ShieldCheck,
    KeyRound,
    Siren,
    AppWindow,
    Workflow,
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

  let loading = true;
  let error: string | null = null;
  let session: any = null;
  let isPlatformOwner = false;

  let connectedAppsCount = 0;
  let complianceScores: ComplianceScore[] = [];
  let activeAccessReviews = 0;
  let openIncidents = 0;
  let recentAutomationRuns: AutomationExecution[] = [];

  let platformData: {
    tenants: { total: number; active: number; disabled: number };
    users: { total: number };
    workflows: { total: number };
  } | null = null;

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

      if (isPlatformOwner) {
        const res = await fetch("/api/platform/dashboard");
        if (!res.ok) throw new Error(`Dashboard fetch failed (${res.status})`);
        platformData = await res.json();
        return;
      }

      const [tenantRes, scoresRes, reviewsRes, incidentsRes, runsRes] =
        await Promise.all([
          fetch("/api/tenant/dashboard"),
          fetch("/api/tenant-compliance/scores"),
          fetch("/api/access-reviews"),
          fetch("/api/incidents"),
          fetch("/api/automation/executions?limit=5"),
        ]);

      if (!tenantRes.ok) {
        throw new Error(`Tenant dashboard fetch failed (${tenantRes.status})`);
      }

      const tenantData = await tenantRes.json();
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
      <Button href="/console/marketplace" size="sm">Connect Now</Button>
    </div>
  {/if}

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-8 w-56" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each [1, 2, 3, 4] as _}
          <Skeleton class="h-24 rounded-lg" />
        {/each}
      </div>
      <Skeleton class="h-64 rounded-lg" />
    </div>

  {:else if error}
    <Alert variant="destructive">
      <AlertTriangle class="h-4 w-4" />
      <p class="pl-7">{error}</p>
    </Alert>

  {:else if isPlatformOwner && platformData}
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Platform Overview</h1>
        <p class="text-sm text-muted-foreground">AtlasIT platform administration</p>
      </div>
      <Button on:click={load} variant="secondary" size="sm">
        <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
        Refresh
      </Button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Total Tenants</div><div class="text-3xl font-bold mt-1">{platformData.tenants.total}</div></CardContent></Card>
      <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Active Tenants</div><div class="text-3xl font-bold mt-1">{platformData.tenants.active}</div></CardContent></Card>
      <Card><CardContent class="pt-5"><div class="text-sm text-muted-foreground">Workflows (24h)</div><div class="text-3xl font-bold mt-1">{platformData.workflows.total}</div></CardContent></Card>
    </div>

  {:else}
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p class="text-sm text-muted-foreground">Live compliance and operations metrics</p>
      </div>
      <Button on:click={load} variant="secondary" size="sm">
        <RefreshCw class="h-3.5 w-3.5 mr-1.5" />
        Refresh
      </Button>
    </div>

    <!-- top KPI tiles -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-muted-foreground">Connected Apps</div>
            <AppWindow class="h-4 w-4 text-muted-foreground" />
          </div>
          <div class="text-3xl font-bold mt-1">{connectedAppsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-5">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-muted-foreground">Recent Automation Runs</div>
            <Workflow class="h-4 w-4 text-muted-foreground" />
          </div>
          <div class="text-3xl font-bold mt-1">{recentAutomationRuns.length}</div>
        </CardContent>
      </Card>
    </div>

    <!-- compliance tiles per framework -->
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
                  <tr class="border-t hover:bg-muted/50">
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
  {/if}
</div>
