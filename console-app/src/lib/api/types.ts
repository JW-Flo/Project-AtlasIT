// Consolidated types (copied from apps/atlasit-web) for console-app
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
  description?: string;
}
export interface AccessRequest {
  id: number;
  subject: string;
  resource?: string;
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
