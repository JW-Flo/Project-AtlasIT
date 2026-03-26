// Shared frontend types for Compliance & Security API
// Keep minimal until OpenAPI spec is formalized.

export interface HealthLatencyBucket {
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  count?: number;
  avg?: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: number;
  version: string;
  buildVersion: string;
  snapshotAgeSeconds?: number;
  d1: boolean;
  r2: boolean;
  evidenceCount: number;
  latency?: Record<string, HealthLatencyBucket>;
}

export interface SnapshotFrameworkSummary {
  framework: string;
  coveragePercent: number;
  passing: number;
  failing: number;
  total: number;
}

export interface SnapshotRisk {
  id: string;
  title: string;
  likelihood: number;
  impact: number;
  score: number;
  severity: string;
  owner?: string;
}

export interface ComplianceSnapshot {
  tenantId: string;
  generatedAt: string;
  ageSeconds?: number;
  frameworkSummary: SnapshotFrameworkSummary[];
  risks: SnapshotRisk[];
  policies: Array<{
    id: string;
    name: string;
    status: string;
    updated: string;
  }>;
}

export interface IncidentRecord {
  id: number;
  tenantId: string;
  title: string;
  severity: string;
  status: string;
  source?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface IncidentsListResponse {
  items: IncidentRecord[];
  nextCursor?: number | null;
}

export interface CreateIncidentInput {
  title: string;
  severity?: string;
  source?: string | null;
}

export interface ActivityEvent {
  id: number;
  tenantId: string;
  type: string;
  severity?: string | null;
  ref?: string | null;
  message: string;
  createdAt: string;
}

export interface ActivityListResponse {
  items: ActivityEvent[];
  nextCursor?: number | null;
}

export interface PolicyTemplateMeta {
  key: string;
  name: string;
  format: string;
}
export interface PolicyTemplatesResponse {
  templates: PolicyTemplateMeta[];
}

export interface GeneratePolicyInput {
  templateKey: string;
  input?: Record<string, unknown>;
}
export interface GeneratedPolicyResponse {
  hash: string;
  contextHash: string;
  content: string;
  templateKey: string;
  reused: boolean;
  createdAt: string;
  sizeBytes: number;
}

export interface EvaluatePolicyInput {
  policyKey: string;
  input?: Record<string, unknown>;
}
export interface EvaluatePolicyResponse {
  hash: string;
  result: unknown;
  meta: { deterministic: boolean };
}

export interface CoverageSummaryResponse {
  framework: string;
  total: number;
  passing: number;
  failing: number;
  coveragePercent: number;
}

export interface EvidenceSearchItem {
  id: number;
  hash: string;
  tenantId: string;
  pack: string;
  subject: string | null;
  createdAt: string;
}
export interface EvidenceSearchResponse {
  items: EvidenceSearchItem[];
  nextCursor?: string | null;
  count: number;
}

export interface EvidenceVerifyResponse {
  hash: string;
  recomputedHash: string;
  integrity: boolean;
  tenantId: string | null;
  pack: string | null;
  subject: string | null;
  createdAt: string | null;
  sizeBytes: number;
}

// Notifications extended responses
export interface NotificationsListResponse {
  items: NotificationItem[];
  nextCursor?: string | null;
  unreadCount: number;
}

export interface NotificationsMarkReadResponse {
  updated: string[]; // ids marked read
  unreadCount: number; // remaining unread after operation
}

export type ApiErrorShape = { error: string; requestId?: string };

// ---- Newly added typed models for dashboard enrichment ----

export interface HealthPayload {
  status?: string;
  service?: string;
  timestamp?: number | string;
  version?: string;
  buildVersion?: string;
  evidenceCount?: number;
  policies?: { total?: number; templates?: number } | null;
  incidents?: { open?: number; critical?: number; high?: number } | null;
  latency?: Record<string, HealthLatencyBucket> | null;
  [key: string]: unknown;
}

export interface CoverageControl {
  controlKey: string;
  evidenceCount: number;
}

export interface CoverageSummary {
  framework: string;
  controls: CoverageControl[];
  totalControls: number;
  coveragePercent: number;
}

export interface SecurityIncident {
  id: string;
  title?: string | null;
  severity?: string | null;
  status?: string | null;
  source?: string | null;
  tenantId?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface NotificationItem {
  id: string;
  kind?: string | null;
  severity?: string | null;
  message: string;
  createdAt: string;
  ageSeconds?: number | null;
  ref?: string | null;
  read: boolean;
}

export interface AccessRequest {
  id: number;
  subject: string;
  status: string;
  reason?: string;
  createdAt: string;
  decidedAt?: string | null;
  approver?: string | null;
}

export interface AccessRequestList {
  items: AccessRequest[];
  nextCursor?: number | null;
}

// Page load aggregate shape (used by +page.ts) - exported for svelte types
export interface ComplianceDashboardData {
  health?: HealthPayload | null;
  coverage?: CoverageSummary | null;
  incidents?: SecurityIncident[];
  activity?: ActivityEvent[];
  notifications?: NotificationItem[];
  notificationsUnreadCount?: number;
  fetchedAt: string;
  partialError?: string; // present if some calls failed
  allFailed?: boolean;
}
