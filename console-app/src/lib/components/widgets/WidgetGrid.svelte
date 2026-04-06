<script lang="ts">
  import { WIDGET_REGISTRY, type WidgetId } from "./index";
  import ComplianceScoresWidget from "./ComplianceScoresWidget.svelte";
  import ComplianceTrendWidget from "./ComplianceTrendWidget.svelte";
  import EvidenceFeedWidget from "./EvidenceFeedWidget.svelte";
  import EvidenceVolumeWidget from "./EvidenceVolumeWidget.svelte";
  import AdapterHealthWidget from "./AdapterHealthWidget.svelte";
  import AutomationMetricsWidget from "./AutomationMetricsWidget.svelte";
  import AutomationRecentWidget from "./AutomationRecentWidget.svelte";
  import JmlMetricsWidget from "./JmlMetricsWidget.svelte";
  import JmlAdapterProvisionsWidget from "./JmlAdapterProvisionsWidget.svelte";
  import WorkflowRunsWidget from "./WorkflowRunsWidget.svelte";
  import SecurityPostureWidget from "./SecurityPostureWidget.svelte";
  import AlertsBannerWidget from "./AlertsBannerWidget.svelte";

  /** Ordered list of widget IDs to render. */
  export let widgets: WidgetId[] = [];

  const componentMap: Record<WidgetId, any> = {
    "compliance-scores": ComplianceScoresWidget,
    "compliance-trend": ComplianceTrendWidget,
    "evidence-feed": EvidenceFeedWidget,
    "evidence-volume": EvidenceVolumeWidget,
    "adapter-health": AdapterHealthWidget,
    "automation-metrics": AutomationMetricsWidget,
    "automation-recent": AutomationRecentWidget,
    "jml-metrics": JmlMetricsWidget,
    "jml-adapter-provisions": JmlAdapterProvisionsWidget,
    "workflow-runs": WorkflowRunsWidget,
    "security-posture": SecurityPostureWidget,
    "alerts-banner": AlertsBannerWidget,
  };

  function sizeClass(id: WidgetId): string {
    const size = WIDGET_REGISTRY[id]?.defaultSize ?? "md";
    if (size === "lg") return "col-span-1 lg:col-span-2";
    return "col-span-1";
  }
</script>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
  {#each widgets as id (id)}
    {@const Component = componentMap[id]}
    {#if Component}
      <div class={sizeClass(id)}>
        <svelte:component this={Component} />
      </div>
    {/if}
  {/each}
</div>
