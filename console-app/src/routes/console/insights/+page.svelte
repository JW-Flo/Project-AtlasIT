<script lang="ts">
  import { onMount } from "svelte";
  import { push as pushToast } from "$lib/components/feedback/toastStore";
  import Card from "$lib/components/ui/card.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { AlertTriangle, ShieldAlert, TrendingDown, Lightbulb, FileText, Zap } from "lucide-svelte";

  interface GapSummary {
    totalControls: number;
    coveredControls: number;
    missingCount: number;
    staleCount: number;
    failingCount: number;
    coveragePercent: number;
  }

  interface ComplianceGap {
    controlId: string;
    controlName: string;
    framework: string;
    gapType: "missing" | "stale" | "failing";
    staleDays: number | null;
    recommendation: string;
    priority: string;
    suggestedAction: string | null;
  }

  interface DriftAlert {
    id: string;
    severity: string;
    category: string;
    data: Record<string, unknown>;
    createdAt: string;
  }

  interface RiskAnomaly {
    anomalyType: string;
    severity: string;
    description: string;
    affectedUsers: string[];
    affectedApps: string[];
    detectedAt: string;
  }

  let loading = true;
  let gapSummary: GapSummary | null = null;
  let gaps: ComplianceGap[] = [];
  let driftAlerts: DriftAlert[] = [];
  let anomalies: RiskAnomaly[] = [];
  let activeTab: "gaps" | "drift" | "anomalies" = "gaps";

  onMount(async () => {
    await Promise.allSettled([loadGaps(), loadDrift(), loadAnomalies()]);
    loading = false;
  });

  async function loadGaps() {
    try {
      const res = await fetch("/api/compliance-intelligence/gaps");
      if (!res.ok) throw new Error("Failed to load gaps");
      const data = await res.json();
      gapSummary = data.summary;
      gaps = data.gaps ?? [];
    } catch {
      pushToast({ type: "error", message: "Failed to load compliance gaps" });
    }
  }

  async function loadDrift() {
    try {
      const res = await fetch("/api/compliance-intelligence/drift");
      if (!res.ok) throw new Error("Failed to load drift");
      const data = await res.json();
      driftAlerts = data.alerts ?? [];
    } catch {
      pushToast({ type: "error", message: "Failed to load drift alerts" });
    }
  }

  async function loadAnomalies() {
    try {
      const res = await fetch("/api/compliance-intelligence/anomalies");
      if (!res.ok) throw new Error("Failed to load anomalies");
      const data = await res.json();
      anomalies = data.anomalies ?? [];
    } catch {
      pushToast({ type: "error", message: "Failed to load anomalies" });
    }
  }

  function severityColor(severity: string): string {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  }

  function gapTypeLabel(gapType: string): string {
    switch (gapType) {
      case "missing": return "No Evidence";
      case "stale": return "Stale Evidence";
      case "failing": return "Failing";
      default: return gapType;
    }
  }
</script>

<svelte:head>
  <title>Compliance Insights | AtlasIT</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Compliance Intelligence</h1>
    <p class="text-muted-foreground">Proactive gap analysis, drift detection, and risk anomaly monitoring</p>
  </div>

  {#if loading}
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      {#each Array(4) as _}
        <Card><CardContent class="p-4"><Skeleton class="h-16 w-full" /></CardContent></Card>
      {/each}
    </div>
  {:else}
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ShieldAlert class="h-4 w-4" />
            Coverage
          </div>
          <div class="text-2xl font-bold">{gapSummary?.coveragePercent ?? 0}%</div>
          <div class="text-xs text-muted-foreground">
            {gapSummary?.coveredControls ?? 0} / {gapSummary?.totalControls ?? 0} controls covered
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertTriangle class="h-4 w-4 text-red-500" />
            Gaps
          </div>
          <div class="text-2xl font-bold">{(gapSummary?.missingCount ?? 0) + (gapSummary?.staleCount ?? 0) + (gapSummary?.failingCount ?? 0)}</div>
          <div class="text-xs text-muted-foreground">
            {gapSummary?.missingCount ?? 0} missing, {gapSummary?.staleCount ?? 0} stale, {gapSummary?.failingCount ?? 0} failing
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingDown class="h-4 w-4 text-orange-500" />
            Drift Alerts
          </div>
          <div class="text-2xl font-bold">{driftAlerts.length}</div>
          <div class="text-xs text-muted-foreground">Active compliance drift events</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4">
          <div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Zap class="h-4 w-4 text-yellow-500" />
            Anomalies
          </div>
          <div class="text-2xl font-bold">{anomalies.length}</div>
          <div class="text-xs text-muted-foreground">Risk anomalies detected</div>
        </CardContent>
      </Card>
    </div>

    <!-- Tabs -->
    <div class="border-b">
      <nav class="flex space-x-4">
        <button
          class="px-3 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'gaps' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
          on:click={() => activeTab = "gaps"}
        >
          Compliance Gaps ({gaps.length})
        </button>
        <button
          class="px-3 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'drift' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
          on:click={() => activeTab = "drift"}
        >
          Drift Alerts ({driftAlerts.length})
        </button>
        <button
          class="px-3 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'anomalies' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
          on:click={() => activeTab = "anomalies"}
        >
          Risk Anomalies ({anomalies.length})
        </button>
      </nav>
    </div>

    <!-- Gap List -->
    {#if activeTab === "gaps"}
      {#if gaps.length === 0}
        <Card>
          <CardContent class="p-8 text-center text-muted-foreground">
            <Lightbulb class="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p class="text-lg font-medium">No compliance gaps detected</p>
            <p>All controls have recent, passing evidence.</p>
          </CardContent>
        </Card>
      {:else}
        <div class="space-y-3">
          {#each gaps as gap}
            <Card>
              <CardContent class="p-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{gap.framework}</Badge>
                      <span class="font-medium">{gap.controlId}</span>
                      <span class="text-muted-foreground">— {gap.controlName}</span>
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {severityColor(gap.priority)}">{gap.priority}</span>
                    </div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {gap.gapType === 'failing' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : gap.gapType === 'stale' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}">
                        {gapTypeLabel(gap.gapType)}
                      </span>
                      {#if gap.staleDays !== null}
                        <span class="text-xs text-muted-foreground">{gap.staleDays}d since last evidence</span>
                      {/if}
                    </div>
                    <p class="text-sm text-muted-foreground">{gap.recommendation}</p>
                  </div>
                  {#if gap.suggestedAction}
                    <Button variant="outline" size="sm" href="/console/automation">
                      Create Rule
                    </Button>
                  {/if}
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Drift Alerts -->
    {#if activeTab === "drift"}
      {#if driftAlerts.length === 0}
        <Card>
          <CardContent class="p-8 text-center text-muted-foreground">
            <TrendingDown class="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p class="text-lg font-medium">No drift alerts</p>
            <p>No compliance regression events detected recently.</p>
          </CardContent>
        </Card>
      {:else}
        <div class="space-y-3">
          {#each driftAlerts as alert}
            <Card>
              <CardContent class="p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {severityColor(alert.severity)}">{alert.severity}</span>
                  <Badge variant="outline">{alert.category}</Badge>
                  <span class="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
                </div>
                <p class="text-sm">{alert.data.description ?? JSON.stringify(alert.data)}</p>
                {#if alert.data.suggestedRemediation}
                  <p class="text-xs text-muted-foreground mt-1">{alert.data.suggestedRemediation}</p>
                {/if}
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Anomalies -->
    {#if activeTab === "anomalies"}
      {#if anomalies.length === 0}
        <Card>
          <CardContent class="p-8 text-center text-muted-foreground">
            <Zap class="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p class="text-lg font-medium">No risk anomalies</p>
            <p>No unusual access patterns detected in recent automation history.</p>
          </CardContent>
        </Card>
      {:else}
        <div class="space-y-3">
          {#each anomalies as anomaly}
            <Card>
              <CardContent class="p-4">
                <div class="flex items-center gap-2 mb-2">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {severityColor(anomaly.severity)}">{anomaly.severity}</span>
                  <Badge variant="outline">{anomaly.anomalyType.replace(/_/g, " ")}</Badge>
                  <span class="text-xs text-muted-foreground">{new Date(anomaly.detectedAt).toLocaleString()}</span>
                </div>
                <p class="text-sm">{anomaly.description}</p>
                {#if anomaly.affectedApps.length > 0}
                  <div class="flex gap-1 mt-2">
                    {#each anomaly.affectedApps as app}
                      <Badge variant="secondary">{app}</Badge>
                    {/each}
                  </div>
                {/if}
                {#if anomaly.affectedUsers.length > 0}
                  <p class="text-xs text-muted-foreground mt-1">
                    Affected users: {anomaly.affectedUsers.slice(0, 5).join(", ")}{anomaly.affectedUsers.length > 5 ? ` +${anomaly.affectedUsers.length - 5} more` : ""}
                  </p>
                {/if}
              </CardContent>
            </Card>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- Quick Actions -->
    <Card>
      <CardContent class="p-4">
        <h3 class="font-medium mb-3">Quick Actions</h3>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" href="/console/automation">
            <Zap class="h-4 w-4 mr-1" /> Create Automation Rule
          </Button>
          <Button variant="outline" size="sm" href="/console/marketplace">
            <ShieldAlert class="h-4 w-4 mr-1" /> Connect Adapter
          </Button>
          <Button variant="outline" size="sm" href="/console/policies">
            <FileText class="h-4 w-4 mr-1" /> Generate Policy
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
