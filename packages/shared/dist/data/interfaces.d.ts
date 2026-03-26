export interface PolicyTemplate {
  key: string;
  name: string;
  format: "rego" | "json" | "yaml";
  body: string;
}
export interface GeneratedPolicy {
  hash: string;
  tenantId: string;
  templateKey: string;
  content: string;
  contextHash: string;
  createdAt: string;
  sizeBytes: number;
}
export interface PolicyEvaluation {
  id: string;
  tenantId: string;
  policyKey: string;
  inputHash: string;
  resultHash: string;
  result: Record<string, unknown>;
  createdAt: string;
}
export interface CoverageControl {
  controlKey: string;
  title: string;
  evidenceCount: number;
}
export interface CoverageSummary {
  framework: string;
  totalControls: number;
  controls: CoverageControl[];
  coveragePercent: number;
}
export interface PolicyRepository {
  listTemplates(): Promise<PolicyTemplate[]>;
  getTemplate(key: string): Promise<PolicyTemplate | null>;
  findGeneratedByContext(
    tenantId: string,
    templateKey: string,
    contextHash: string,
  ): Promise<GeneratedPolicy | null>;
  saveGenerated(policy: GeneratedPolicy, inputCanonical: string): Promise<void>;
  recordEvaluation(data: {
    tenantId: string;
    policyKey: string;
    inputHash: string;
    resultHash: string;
    resultJson: string;
  }): Promise<void>;
  upsertControlEvidenceLink(
    controlKey: string,
    evidenceHash: string,
    tenantId: string,
  ): Promise<{
    created: boolean;
    createdAt: string;
  }>;
  getCoverage(framework: string, tenantId: string): Promise<CoverageSummary>;
}
export interface WorkflowStep {
  stepId: string;
  action: string;
  status: string;
  attempts: number;
  output?: unknown;
  error?: string | null;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
}
export interface WorkflowExecution {
  id: string;
  tenantId: string;
  workflowType: string;
  subjectRef: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  durationMs: number;
  idempotencyKey?: string | null;
  context: Record<string, unknown>;
  steps: WorkflowStep[];
}
export interface WorkflowRepository {
  recordExecution(
    execution: Omit<WorkflowExecution, "steps">,
    steps: WorkflowStep[],
  ): Promise<void>;
  findById(tenantId: string, id: string): Promise<WorkflowExecution | null>;
  findByIdempotencyKey(
    tenantId: string,
    key: string,
  ): Promise<WorkflowExecution | null>;
  countSince(tenantId: string, sinceIso: string): Promise<number>;
}
export interface Incident {
  id: string;
  tenantId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  description?: string;
}
export interface AccessRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  resourceType: string;
  resourceId: string;
  justification: string;
  status: "pending" | "approved" | "denied" | "fulfilled";
  createdAt: string;
  updatedAt: string;
  decidedAt?: string | null;
  decidedBy?: string | null;
}
export interface SecurityRepository {
  createIncident(incident: Incident): Promise<void>;
  getIncident(tenantId: string, id: string): Promise<Incident | null>;
  listIncidents(
    tenantId: string,
    opts?: {
      status?: string;
      limit?: number;
    },
  ): Promise<Incident[]>;
  updateIncident(
    tenantId: string,
    id: string,
    updates: Partial<Incident>,
  ): Promise<void>;
  createAccessRequest(request: AccessRequest): Promise<void>;
  getAccessRequest(tenantId: string, id: string): Promise<AccessRequest | null>;
  listAccessRequests(
    tenantId: string,
    opts?: {
      status?: string;
      limit?: number;
    },
  ): Promise<AccessRequest[]>;
  updateAccessRequest(
    tenantId: string,
    id: string,
    updates: Partial<AccessRequest>,
  ): Promise<void>;
}
export interface TokenRecord {
  hash: string;
  tenantId: string;
  roles: string[];
  algorithm: string;
  salt: string;
  createdAt: string;
}
export interface Session {
  id: string;
  tenantId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}
export interface AuthRepository {
  findToken(hash: string): Promise<TokenRecord | null>;
  storeToken(token: TokenRecord): Promise<void>;
  deleteToken(hash: string): Promise<void>;
  getSession(id: string): Promise<Session | null>;
  putSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
}
export interface AuditEntry {
  id: string;
  tenantId: string;
  action: string;
  actor: string;
  resource: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
export interface AuditRepository {
  append(entry: AuditEntry): Promise<void>;
  list(
    tenantId: string,
    opts?: {
      limit?: number;
      startAfter?: string;
    },
  ): Promise<AuditEntry[]>;
}
//# sourceMappingURL=interfaces.d.ts.map
