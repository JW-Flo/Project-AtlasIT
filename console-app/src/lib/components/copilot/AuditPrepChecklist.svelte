<script lang="ts">
  import { onMount } from "svelte";
  import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    ChevronDown,
    ArrowRight,
    Loader2,
    Shield,
  } from "lucide-svelte";

  export let framework = "SOC2";

  interface ChecklistItem {
    id: string;
    category: string;
    title: string;
    description: string;
    status: "complete" | "incomplete" | "warning";
    controls?: string[];
    href: string;
  }

  let loading = true;
  let readinessScore = 0;
  let totalItems = 0;
  let completeItems = 0;
  let checklist: ChecklistItem[] = [];
  let expandedItems: Set<string> = new Set();

  onMount(async () => {
    try {
      const res = await fetch(`/api/copilot/audit-prep?framework=${encodeURIComponent(framework)}`);
      if (res.ok) {
        const data = await res.json();
        readinessScore = data.readinessScore;
        totalItems = data.totalItems;
        completeItems = data.completeItems;
        checklist = data.checklist;
      }
    } catch {
      // silently fail
    } finally {
      loading = false;
    }
  });

  function toggleItem(id: string) {
    if (expandedItems.has(id)) {
      expandedItems.delete(id);
    } else {
      expandedItems.add(id);
    }
    expandedItems = expandedItems;
  }

  function scoreColor(score: number): string {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  }

  function statusIcon(status: string) {
    if (status === "complete") return CheckCircle2;
    if (status === "warning") return AlertTriangle;
    return XCircle;
  }

  function statusColor(status: string): string {
    if (status === "complete") return "text-green-500";
    if (status === "warning") return "text-yellow-500";
    return "text-red-500";
  }
</script>

<div class="space-y-4">
  {#if loading}
    <div class="flex items-center gap-2 text-sm text-muted-foreground py-4">
      <Loader2 class="h-4 w-4 animate-spin" />
      <span>Analyzing audit readiness...</span>
    </div>
  {:else}
    <!-- Readiness score -->
    <div class="flex items-center gap-3 rounded-lg border p-3">
      <div class="h-12 w-12 rounded-full border-2 flex items-center justify-center shrink-0 {readinessScore >= 80 ? 'border-green-500' : readinessScore >= 60 ? 'border-yellow-500' : 'border-red-500'}">
        <span class="text-lg font-bold {scoreColor(readinessScore)}">{readinessScore}%</span>
      </div>
      <div>
        <div class="text-sm font-semibold">{framework} Audit Readiness</div>
        <div class="text-xs text-muted-foreground">{completeItems}/{totalItems} items ready</div>
      </div>
    </div>

    <!-- Checklist -->
    <div class="space-y-1.5">
      {#each checklist as item (item.id)}
        <div class="rounded-md border overflow-hidden">
          <button
            class="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-sm hover:bg-accent/30 transition-colors"
            on:click={() => toggleItem(item.id)}
          >
            <svelte:component
              this={statusIcon(item.status)}
              class="h-4 w-4 shrink-0 {statusColor(item.status)}"
            />
            <span class="flex-1 min-w-0 font-medium truncate">{item.title}</span>
            <ChevronDown class="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform {expandedItems.has(item.id) ? 'rotate-180' : ''}" />
          </button>

          {#if expandedItems.has(item.id)}
            <div class="px-3 pb-3 pt-0 text-xs text-muted-foreground border-t">
              <p class="mt-2">{item.description}</p>
              {#if item.controls && item.controls.length > 0}
                <p class="mt-1.5 font-mono text-[10px]">
                  Controls: {item.controls.slice(0, 8).join(", ")}{item.controls.length > 8 ? "..." : ""}
                </p>
              {/if}
              <a
                href={item.href}
                class="inline-flex items-center gap-1 mt-2 text-primary hover:underline"
              >
                Take action <ArrowRight class="h-3 w-3" />
              </a>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
