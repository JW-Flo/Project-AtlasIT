/**
 * Copilot Types — shared between console-app API and UI.
 */

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  /** Optional structured actions the assistant recommends */
  actions?: CopilotAction[];
}

export interface CopilotAction {
  type: "navigate" | "create_rule" | "run_evidence" | "generate_policy" | "start_review";
  label: string;
  href?: string;
  payload?: Record<string, unknown>;
}

export interface CopilotConversation {
  id: string;
  tenantId: string;
  userId: string;
  messages: CopilotMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CopilotChatRequest {
  message: string;
  conversationId?: string;
  /** Pre-built quick action instead of free text */
  quickAction?: "what_next" | "audit_prep" | "create_rule";
  /** Framework filter for audit prep */
  framework?: string;
}

export interface CopilotChatResponse {
  conversationId: string;
  message: CopilotMessage;
}

export interface CopilotTenantContext {
  tenantId: string;
  tenantName: string;
  selectedFrameworks: string[];
  complianceScores: Record<string, number>;
  connectedApps: string[];
  adapterHealth: Array<{
    slug: string;
    lastCollected: string | null;
    itemCount: number;
    error: string | null;
  }>;
  recentInsights: Array<{
    type: string;
    severity: string;
    category: string | null;
    data: string;
    createdAt: string;
  }>;
  remediationStats: {
    total: number;
    open: number;
    overdue: number;
  };
  evidenceStats: {
    totalItems: number;
    staleCount: number;
    recentCount: number;
  };
  automationRuleCount: number;
  policyCount: number;
  openIncidents: number;
}

export interface DailyDigest {
  tenantId: string;
  generatedAt: string;
  summary: string;
  highlights: DigestHighlight[];
  recommendations: string[];
}

export interface DigestHighlight {
  category: "score_change" | "new_evidence" | "drift" | "gap" | "incident" | "adapter";
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
}

// ── Weekly Digest ──────────────────────────────────────────────────────

export interface WeeklyDigest {
  tenantId: string;
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
  executiveSummary: string;
  scoreChanges: WeeklyScoreChange[];
  evidenceSummary: WeeklyEvidenceSummary;
  driftAlerts: DigestDriftAlert[];
  upcomingDeadlines: UpcomingDeadline[];
  recommendations: string[];
}

export interface WeeklyScoreChange {
  framework: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  grade: string;
}

export interface WeeklyEvidenceSummary {
  newItems: number;
  expiredItems: number;
  totalItems: number;
  topSources: Array<{ source: string; count: number }>;
}

export interface DigestDriftAlert {
  controlId: string;
  framework: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  recommendedAction: string;
}

export interface UpcomingDeadline {
  type: "remediation" | "policy_review" | "evidence_expiry" | "audit";
  label: string;
  dueDate: string;
  daysRemaining: number;
}

// ── Smart Alerts ───────────────────────────────────────────────────────

export type SmartAlertType =
  | "evidence_collection_stopped"
  | "score_regression_trend"
  | "adapter_health_degraded"
  | "remediation_overdue_escalation"
  | "evidence_gap_detected"
  | "compliance_drift";

export interface SmartAlert {
  id: string;
  tenantId: string;
  type: SmartAlertType;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  impact: string;
  recommendedAction: string;
  affectedControls: string[];
  detectedAt: string;
  acknowledged: boolean;
}

// ── Notification Preferences ───────────────────────────────────────────

export interface DigestPreferences {
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday
  smartAlertsEnabled: boolean;
  channels: {
    inApp: boolean;
    slack: boolean;
    email: boolean;
  };
  /** Minimum severity for smart alerts (info=all, warning=warn+critical, critical=critical only) */
  smartAlertMinSeverity: "info" | "warning" | "critical";
}
