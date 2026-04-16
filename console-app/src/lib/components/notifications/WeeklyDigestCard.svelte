<script lang="ts">
  import { onMount } from "svelte";
  import Card from "$lib/components/ui/card.svelte";
  import CardHeader from "$lib/components/ui/card-header.svelte";
  import CardTitle from "$lib/components/ui/card-title.svelte";
  import CardContent from "$lib/components/ui/card-content.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { Calendar, TrendingUp, TrendingDown, FileText, AlertTriangle, Clock } from "lucide-svelte";

  interface ScoreChange {
    framework: string;
    previousScore: number;
    currentScore: number;
    delta: number;
    grade: string;
  }

  interface DriftAlert {
    title: string;
    detail: string;
    severity: "info" | "warning" | "critical";
    recommendedAction: string;
  }

  interface UpcomingDeadline {
    type: string;
    label: string;
    dueDate: string;
    daysRemaining: number;
  }

  interface WeeklyDigest {
    tenantId: string;
    generatedAt: string;
    weekStart: string;
    weekEnd: string;
    executiveSummary: string;
    scoreChanges: ScoreChange[];
    evidenceSummary: { newItems: number; expiredItems: number; totalItems: number };
    driftAlerts: DriftAlert[];
    upcomingDeadlines: UpcomingDeadline[];
    recommendations: string[];
  }

  let digest: WeeklyDigest | null = null;
  let loading = true;

  async function loadDigest() {
    try {
      const res = await fetch("/api/copilot/weekly-digest");
      if (res.ok) {
        const data = await res.json();
        digest = data.digest;
      }
    } catch {}
    loading = false;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  onMount(loadDigest);
</script>

{#if loading}
  <Skeleton class="h-64 w-full" />
{:else if digest}
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2 text-lg">
          <Calendar class="h-5 w-5 text-primary" />
          Weekly Digest
        </CardTitle>
        <span class="text-xs text-muted-foreground">
          {formatDate(digest.weekStart)} — {formatDate(digest.weekEnd)}
        </span>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Executive Summary -->
      <p class="text-sm text-foreground leading-relaxed">{digest.executiveSummary}</p>

      <!-- Score Changes -->
      {#if digest.scoreChanges.length > 0}
        <div>
          <h4 class="text-sm font-semibold mb-2">Score Changes</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {#each digest.scoreChanges as sc}
              <div class="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                {#if sc.delta > 0}
                  <TrendingUp class="h-4 w-4 text-success shrink-0" />
                {:else if sc.delta < 0}
                  <TrendingDown class="h-4 w-4 text-destructive shrink-0" />
                {:else}
                  <span class="h-4 w-4 shrink-0" />
                {/if}
                <div class="min-w-0">
                  <span class="font-medium truncate block">{sc.framework}</span>
                  <span class="text-xs text-muted-foreground">
                    {sc.currentScore}%
                    <span class={sc.delta > 0 ? "text-success" : sc.delta < 0 ? "text-destructive" : ""}>
                      ({sc.delta >= 0 ? "+" : ""}{sc.delta})
                    </span>
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Evidence Summary -->
      <div class="flex gap-4 text-sm">
        <div class="flex items-center gap-1.5">
          <FileText class="h-4 w-4 text-muted-foreground" />
          <span><strong>{digest.evidenceSummary.newItems}</strong> new evidence</span>
        </div>
        <div class="flex items-center gap-1.5 text-muted-foreground">
          <span>{digest.evidenceSummary.totalItems} total</span>
        </div>
        {#if digest.evidenceSummary.expiredItems > 0}
          <div class="flex items-center gap-1.5 text-warning">
            <AlertTriangle class="h-4 w-4" />
            <span>{digest.evidenceSummary.expiredItems} stale</span>
          </div>
        {/if}
      </div>

      <!-- Drift Alerts -->
      {#if digest.driftAlerts.length > 0}
        <div>
          <h4 class="text-sm font-semibold mb-2">Drift Alerts</h4>
          <div class="space-y-2">
            {#each digest.driftAlerts as alert}
              <div class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm
                {alert.severity === 'critical' ? 'bg-destructive-muted border-destructive/30' :
                 alert.severity === 'warning' ? 'bg-warning-muted border-warning/30' :
                 'border-border'}">
                <AlertTriangle class="h-4 w-4 shrink-0 mt-0.5
                  {alert.severity === 'critical' ? 'text-destructive' : 'text-warning'}" />
                <div>
                  <span class="font-medium">{alert.title}</span>
                  <p class="text-xs text-muted-foreground mt-0.5">{alert.recommendedAction}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Upcoming Deadlines -->
      {#if digest.upcomingDeadlines.length > 0}
        <div>
          <h4 class="text-sm font-semibold mb-2">Upcoming Deadlines</h4>
          <div class="space-y-1">
            {#each digest.upcomingDeadlines.slice(0, 5) as dl}
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <Clock class="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{dl.label}</span>
                  <Badge variant={dl.type === "remediation" ? "destructive" : "secondary"} class="text-xs">
                    {dl.type.replace("_", " ")}
                  </Badge>
                </div>
                <span class="text-xs font-medium {dl.daysRemaining <= 3 ? 'text-destructive' : 'text-muted-foreground'}">
                  {dl.daysRemaining === 0 ? "Today" : `${dl.daysRemaining}d`}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Recommendations -->
      {#if digest.recommendations.length > 0}
        <div>
          <h4 class="text-sm font-semibold mb-2">Recommendations</h4>
          <ol class="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            {#each digest.recommendations as rec}
              <li>{rec}</li>
            {/each}
          </ol>
        </div>
      {/if}
    </CardContent>
  </Card>
{/if}
