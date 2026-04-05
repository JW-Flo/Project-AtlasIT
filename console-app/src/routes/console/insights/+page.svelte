<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
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

  interface AnalyticsData {
    overallScore: number;
    trendDelta: number;
    frameworkBreakdown: Array<{ framework: string; score: number; grade: string; controlsTotal: number; controlsImplemented: number; controlsVerified: number }>;
    automationMetrics: { totalRules: number; activeRules: number; rulesExecuted: number; successRate: number; timeSavedHours: number };
    topRisks: Array<{ controlRef: string; title: string; framework: string; score: number; status: string }>;
  }

  let loading = true;
  let analyticsData: AnalyticsData | null = null;
  let gapSummary: GapSummary | null = null;
  let gaps: ComplianceGap[] = [];
  let driftAlerts: DriftAlert[] = [];
  let anomalies: RiskAnomaly[] = [];
  let activeTab: "gaps" | "drift" | "anomalies" | "analytics" = "gaps";
  let connectedAdapters: Set<string> = new Set();
  let collectingGap: string | null = null;

  // Map control IDs to adapter slugs that can provide evidence
  const CONTROL_TO_ADAPTER: Record<string, { slug: string; name: string; type: string }[]> = {
    "CC6.1": [
      { slug: "okta", name: "Okta", type: "MFA policy" },
      { slug: "google-workspace", name: "Google Workspace", type: "2-Step Verification" },
      { slug: "microsoft-365", name: "Microsoft 365", type: "MFA enforcement" },
      { slug: "aws", name: "AWS", type: "IAM MFA" },
    ],
    "CC6.6": [
      { slug: "google-workspace", name: "Google Workspace", type: "sharing settings" },
      { slug: "slack", name: "Slack", type: "retention policy" },
    ],
    "CC6.7": [
      { slug: "microsoft-365", name: "Microsoft 365", type: "encryption status" },
      { slug: "aws", name: "AWS", type: "encryption at rest" },
    ],
    "CC7.1": [{ slug: "aws", name: "AWS", type: "CloudTrail" }],
    "CC8.1": [{ slug: "github", name: "GitHub", type: "branch protection" }],
    "A.9.2.1": [
      { slug: "okta", name: "Okta", type: "password policy" },
      { slug: "google-workspace", name: "Google Workspace", type: "SSO enforcement" },
      { slug: "slack", name: "Slack", type: "SSO enforcement" },
    ],
    "A.9.4.2": [
      { slug: "okta", name: "Okta", type: "MFA policy" },
      { slug: "microsoft-365", name: "Microsoft 365", type: "Conditional Access" },
    ],
    "A.12.6.1": [{ slug: "github", name: "GitHub", type: "branch protection" }],
  };

  function getConnectedAdaptersForGap(gap: ComplianceGap): { slug: string; name: string; type: string }[] {
    const adapters = CONTROL_TO_ADAPTER[gap.controlId] ?? [];
    return adapters.filter((a) => connectedAdapters.has(a.slug));
  }

  async function collectEvidenceForGap(gap: ComplianceGap) {
    const adapters = getConnectedAdaptersForGap(gap);
    if (adapters.length === 0) return;
    collectingGap = gap.controlId;
    try {
      const res = await fetch("/api/evidence-collection/collect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ controlId: gap.controlId, framework: gap.framework, adapters: adapters.map((a) => a.slug) }),
      });
      if (res.ok) {
        pushToast({ type: "success", message: `Evidence collection triggered for ${gap.controlId}` });
        await loadGaps();
      } else {
        pushToast({ type: "error", message: "Evidence collection failed" });
      }
    } catch {
      pushToast({ type: "error", message: "Evidence collection request failed" });
    }
    collectingGap = null;
  }

  function enrichRecommendation(gap: ComplianceGap): string {
    const adapters = getConnectedAdaptersForGap(gap);
    if (adapters.length > 0) {
      const adapterList = adapters.map((a) => `${a.name} (${a.type})`).join(", ");
      if (gap.gapType === "missing") {
        return `Collect ${gap.controlName} evidence from your connected ${adapterList}`;
      }
      if (gap.gapType === "stale") {
        return `Re-collect ${gap.controlName} evidence from ${adapterList} — last collected ${gap.staleDays}d ago`;
      }
      return `Review ${gap.controlName} configuration in ${adapterList} — evidence is failing`;
    }
    return gap.recommendation;
  }

  onMount(async () => {
    await Promise.allSettled([loadGaps(), loadDrift(), loadAnomalies(), loadConnectedAdapters(), loadAnalytics()]);
    loading = false;
  });

  async function loadConnectedAdapters() {
    try {
      const res = await fetch("/api/apps/status");
      if (res.ok) {
        const data = await res.json();
        for (const app of data.applications ?? []) {
          if (app.connected) connectedAdapters.add(app.id);
        }
        connectedAdapters = connectedAdapters; // trigger reactivity
      }
    } catch {}
  }

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

  async function loadAnalytics() {
    try {
      const res = await fetch("/api/analytics/dashboard?days=30");
      if (res.ok) {
        analyticsData = await res.json();
      }
    } catch {
      // Non-critical — analytics tab will show graceful empty state
    }
  }

  function gradeColor(grade: string): string {
    if (grade === "A" || grade === "A+") return "text-green-500";
    if (grade === "B" || grade === "B+") return "text-blue-500";
    if (grade === "C") return "text-yellow-500";
    return "text-red-500";
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
        <button
          class="px-3 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
          on:click={() => activeTab = "analytics"}
        >
          Analytics
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
            <Card class="cursor-pointer hover:border-primary/50 transition-colors" on:click={() => goto(`/console/compliance/feed?framework=${gap.framework}&controlId=${gap.controlId}`)}>
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
                    <p class="text-sm text-muted-foreground">{enrichRecommendation(gap)}</p>
                  </div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <div class="flex flex-col gap-1 shrink-0" on:click|stopPropagation role="group">
                    {#if getConnectedAdaptersForGap(gap).length > 0}
                      <Button
                        variant="default"
                        size="sm"
                        disabled={collectingGap === gap.controlId}
                        on:click={() => collectEvidenceForGap(gap)}
                      >
                        <Zap class="h-3 w-3 mr-1" />
                        {collectingGap === gap.controlId ? "Collecting..." : "Collect Now"}
                      </Button>
                    {/if}
                    {#if gap.suggestedAction}
                      <Button variant="outline" size="sm" href="/console/automation">
                        Create Rule
                      </Button>
                    {/if}
                  </div>
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
                <p class="text-sm">{alert.data.description ?? "Compliance drift detected — review details in the compliance dashboard."}</p>
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

    <!-- Analytics -->
    {#if activeTab === "analytics"}
      {#if !analyticsData}
        <Card>
          <CardContent class="p-8 text-center text-muted-foreground">
            <p class="text-lg font-medium">Analytics unavailable</p>
            <p>Unable to load analytics data. Try refreshing the page.</p>
          </CardContent>
        </Card>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground mb-1">Overall Score</div>
              <div class="text-3xl font-bold">{analyticsData.overallScore}%</div>
              <div class="text-xs {analyticsData.trendDelta >= 0 ? 'text-green-500' : 'text-red-500'}">
                {analyticsData.trendDelta >= 0 ? '+' : ''}{analyticsData.trendDelta}% vs last period
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground mb-1">Automation Rules</div>
              <div class="text-3xl font-bold">{analyticsData.automationMetrics.activeRules}</div>
              <div class="text-xs text-muted-foreground">
                {analyticsData.automationMetrics.rulesExecuted} executions, {analyticsData.automationMetrics.successRate}% success
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent class="p-4">
              <div class="text-sm text-muted-foreground mb-1">Time Saved</div>
              <div class="text-3xl font-bold">{analyticsData.automationMetrics.timeSavedHours}h</div>
              <div class="text-xs text-muted-foreground">estimated via automation</div>
            </CardContent>
          </Card>
        </div>

        <!-- Framework Breakdown -->
        {#if analyticsData.frameworkBreakdown.length > 0}
          <Card>
            <CardContent class="p-4">
              <h3 class="font-medium mb-3">Framework Breakdown</h3>
              <div class="space-y-3">
                {#each analyticsData.frameworkBreakdown as fw}
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <span class="text-2xl font-bold {gradeColor(fw.grade)}">{fw.grade}</span>
                      <div>
                        <div class="font-medium">{fw.framework}</div>
                        <div class="text-xs text-muted-foreground">
                          {fw.controlsImplemented}/{fw.controlsTotal} implemented, {fw.controlsVerified} verified
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-medium">{fw.score}%</div>
                    </div>
                  </div>
                {/each}
              </div>
            </CardContent>
          </Card>
        {/if}

        <!-- Top Risks -->
        {#if analyticsData.topRisks.length > 0}
          <Card>
            <CardContent class="p-4">
              <h3 class="font-medium mb-3">Top Risks</h3>
              <div class="space-y-2">
                {#each analyticsData.topRisks.slice(0, 5) as risk}
                  <div class="flex items-center justify-between py-1 border-b border-border last:border-0">
                    <div>
                      <span class="text-sm font-medium">{risk.controlRef}</span>
                      <span class="text-sm text-muted-foreground ml-2">{risk.title}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Badge variant="outline">{risk.framework}</Badge>
                      <span class="text-sm font-medium {risk.score < 30 ? 'text-red-500' : risk.score < 60 ? 'text-yellow-500' : 'text-green-500'}">{risk.score}%</span>
                    </div>
                  </div>
                {/each}
              </div>
            </CardContent>
          </Card>
        {/if}
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
