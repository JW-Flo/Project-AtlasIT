/** Shared types for the widget component library. */

/** Standard props accepted by every widget. */
export interface WidgetProps {
  /** Optional CSS class appended to the widget container. */
  class?: string;
}

/** Possible states a widget can be in. */
export type WidgetState = "loading" | "error" | "empty" | "ready";

/** A single compliance framework score. */
export interface FrameworkScore {
  framework: string;
  score: number;
  grade: string;
  controlsTotal?: number;
  controlsImplemented?: number;
  controlsVerified?: number;
  source?: string;
}

/** A single point in a time-series trend. */
export interface TrendPoint {
  week: string;
  score: number;
}

/** Evidence volume per week. */
export interface EvidenceVolume {
  week: string;
  count: number;
}

/** Evidence feed item. */
export interface EvidenceFeedItem {
  id: string;
  framework: string;
  controlId: string;
  impact: "positive" | "detrimental" | "neutral";
  eventType: string;
  source: string;
  actor: string;
  createdAt: string;
}

/** Adapter health entry. */
export interface AdapterHealth {
  appId: string;
  appName: string;
  connected: boolean;
  status: "healthy" | "degraded" | "down" | "unknown";
  lastSyncAt: string | null;
  errorCount: number;
}

/** Automation performance metrics. */
export interface AutomationMetrics {
  totalRules: number;
  activeRules: number;
  rulesExecuted: number;
  successRate: number;
  failureCount: number;
  timeSavedHours: number;
}

/** A recent automation execution. */
export interface AutomationExecution {
  id: string;
  ruleId?: string | null;
  ruleName: string | null;
  triggerEvent: unknown;
  status: string;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
}

/** Security posture summary. */
export interface SecurityPosture {
  openIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  accessReviewsTotal: number;
  accessReviewsCompleted: number;
  accessReviewCompletionRate: number;
}

/** Top-risk control. */
export interface TopRisk {
  controlRef: string;
  title: string;
  framework: string;
  score: number;
  status: string;
}

/** JML (Joiner-Mover-Leaver) lifecycle metrics. */
export interface JmlMetrics {
  joiners30d: number;
  movers30d: number;
  leavers30d: number;
  pendingActions: number;
  automatedRate: number;
}

/** Adapter provisioning entry. */
export interface AdapterProvision {
  appId: string;
  appName: string;
  provisionedCount: number;
  deprovisionedCount: number;
  pendingCount: number;
  lastActionAt: string | null;
}

/** Workflow run entry. */
export interface WorkflowRun {
  id: string;
  type: string;
  status: string;
  userId?: string;
  userEmail?: string;
  appId?: string;
  appName?: string;
  startedAt: string;
  completedAt?: string;
  stepCount?: number;
  stepsCompleted?: number;
}

/** Alert item. */
export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  dismissible: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}
