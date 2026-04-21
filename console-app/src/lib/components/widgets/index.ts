/** Widget component library barrel export. */

// Base container
export { default as WidgetContainer } from "./WidgetContainer.svelte";

// Loading skeletons
export { default as SkeletonCard } from "./SkeletonCard.svelte";
export { default as SkeletonStat } from "./SkeletonStat.svelte";
export { default as SkeletonChart } from "./SkeletonChart.svelte";
export { default as SkeletonTable } from "./SkeletonTable.svelte";

// Compliance
export { default as ComplianceScoresWidget } from "./ComplianceScoresWidget.svelte";
export { default as ComplianceTrendWidget } from "./ComplianceTrendWidget.svelte";

// Evidence
export { default as EvidenceFeedWidget } from "./EvidenceFeedWidget.svelte";
export { default as EvidenceVolumeWidget } from "./EvidenceVolumeWidget.svelte";

// Adapters
export { default as AdapterHealthWidget } from "./AdapterHealthWidget.svelte";

// Automation
export { default as AutomationMetricsWidget } from "./AutomationMetricsWidget.svelte";
export { default as AutomationRecentWidget } from "./AutomationRecentWidget.svelte";

// JML / Workflows
export { default as JmlMetricsWidget } from "./JmlMetricsWidget.svelte";
export { default as JmlAdapterProvisionsWidget } from "./JmlAdapterProvisionsWidget.svelte";
export { default as WorkflowRunsWidget } from "./WorkflowRunsWidget.svelte";

// Security & Alerts
export { default as SecurityPostureWidget } from "./SecurityPostureWidget.svelte";
export { default as AlertsBannerWidget } from "./AlertsBannerWidget.svelte";

// Layout & Controls
export { default as WidgetGrid } from "./WidgetGrid.svelte";
export { default as WidgetPicker } from "./WidgetPicker.svelte";
export { default as DateRangePicker } from "./DateRangePicker.svelte";
export { default as FrameworkFilter } from "./FrameworkFilter.svelte";

// Types & utilities (re-export for consumers)
export type {
  WidgetProps,
  WidgetState,
  FrameworkScore,
  TrendPoint,
  EvidenceVolume,
  EvidenceFeedItem,
  AdapterHealth,
  AutomationMetrics,
  AutomationExecution,
  SecurityPosture,
  TopRisk,
  JmlMetrics,
  AdapterProvision,
  WorkflowRun,
  AlertItem,
} from "./types";

/** Widget registry — maps widget IDs to metadata for the widget picker. */
export const WIDGET_REGISTRY = {
  "compliance-scores": { title: "Compliance Scores", category: "Compliance", defaultSize: "md" },
  "compliance-trend": { title: "Compliance Trend", category: "Compliance", defaultSize: "lg" },
  "evidence-feed": { title: "Evidence Feed", category: "Evidence", defaultSize: "lg" },
  "evidence-volume": { title: "Evidence Volume", category: "Evidence", defaultSize: "md" },
  "adapter-health": { title: "Adapter Health", category: "Integrations", defaultSize: "md" },
  "automation-metrics": {
    title: "Automation Performance",
    category: "Automation",
    defaultSize: "md",
  },
  "automation-recent": {
    title: "Recent Automation Runs",
    category: "Automation",
    defaultSize: "lg",
  },
  "jml-metrics": { title: "JML Lifecycle", category: "Workflows", defaultSize: "md" },
  "jml-adapter-provisions": {
    title: "Adapter Provisioning",
    category: "Workflows",
    defaultSize: "md",
  },
  "workflow-runs": { title: "Workflow Runs", category: "Workflows", defaultSize: "lg" },
  "security-posture": { title: "Security Posture", category: "Security", defaultSize: "md" },
  "alerts-banner": { title: "Alerts", category: "Security", defaultSize: "lg" },
} as const;

export type WidgetId = keyof typeof WIDGET_REGISTRY;

/** Preset dashboard layouts. */
export const PRESET_LAYOUTS = {
  executive: {
    name: "Executive",
    description: "Compliance + security overview",
    widgets: [
      "alerts-banner",
      "compliance-scores",
      "compliance-trend",
      "security-posture",
      "evidence-volume",
      "automation-metrics",
    ] as WidgetId[],
  },
  operations: {
    name: "Operations",
    description: "JML + adapters + alerts",
    widgets: [
      "alerts-banner",
      "jml-metrics",
      "adapter-health",
      "jml-adapter-provisions",
      "workflow-runs",
      "automation-recent",
    ] as WidgetId[],
  },
  evidence: {
    name: "Evidence",
    description: "Evidence feed + volume + health",
    widgets: [
      "evidence-feed",
      "evidence-volume",
      "compliance-scores",
      "adapter-health",
      "compliance-trend",
    ] as WidgetId[],
  },
} as const;

export type PresetLayoutId = keyof typeof PRESET_LAYOUTS;
