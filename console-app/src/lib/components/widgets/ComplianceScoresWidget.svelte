<script lang="ts">
  import { onMount } from "svelte";
  import WidgetContainer from "./WidgetContainer.svelte";
  import Badge from "$lib/components/ui/badge.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import { Shield, ArrowRight } from "lucide-svelte";
  import { computeGrade, gradeVariant } from "./utils";
  import type { WidgetState, FrameworkScore } from "./types";

  let className = "";
  export { className as class };

  let state: WidgetState = "loading";
  let error: string | null = null;
  let scores: FrameworkScore[] = [];
  let overallScore = 0;

  async function load() {
    state = "loading";
    error = null;
    try {
      const res = await fetch("/api/tenant-compliance/scores");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      scores = (data.scores || []).map((s: any) => ({
        framework: s.framework,
        score: Math.round(s.score ?? 0),
        grade: s.grade || computeGrade(s.score ?? 0),
        controlsTotal: s.controlsTotal,
        controlsImplemented: s.controlsImplemented,
        controlsVerified: s.controlsVerified,
        source: s.source,
      }));
      if (scores.length === 0) {
        state = "empty";
        return;
      }
      overallScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
      state = "ready";
    } catch (e: any) {
      error = e?.message || "Failed to load compliance scores";
      state = "error";
    }
  }

  onMount(load);
</script>

<WidgetContainer title="Compliance Scores" {state} {error} onRetry={load} class={className}>
  <Shield slot="icon" class="h-4 w-4 text-primary" />
  <Button slot="actions" href="/console/compliance" variant="ghost" size="sm" class="h-7 text-xs">
    Details <ArrowRight class="ml-1 h-3 w-3" />
  </Button>

  <div slot="empty" class="py-4 text-center">
    <p class="text-sm text-muted-foreground mb-2">No compliance scores yet.</p>
    <Button href="/console/compliance" variant="outline" size="sm">Evaluate Compliance</Button>
  </div>

  <!-- Overall score -->
  <div class="mb-4 flex items-center gap-3">
    <div class="text-3xl font-bold text-foreground">{overallScore}%</div>
    <Badge variant={gradeVariant(computeGrade(overallScore))}>{computeGrade(overallScore)}</Badge>
    <span class="text-xs text-muted-foreground">overall</span>
  </div>

  <!-- Per-framework -->
  <div class="space-y-3">
    {#each scores as fw}
      <div class="space-y-1">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium text-foreground">{fw.framework}</span>
          <div class="flex items-center gap-2">
            <Badge variant={gradeVariant(fw.grade)} class="text-xs">{fw.grade}</Badge>
            <span class="w-12 text-right text-muted-foreground">{fw.score}%</span>
          </div>
        </div>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full transition-all duration-500 {fw.score >= 80 ? 'bg-green-500' : fw.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}"
            style="width: {fw.score}%"
          ></div>
        </div>
      </div>
    {/each}
  </div>
</WidgetContainer>
