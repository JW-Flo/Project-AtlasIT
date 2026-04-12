export type Evidence = {
  id: string;
  control_id: string;
  uri: string;
  sha256: string;
  producer: string;
  tenant: string;
  trace_id: string;
  timestamp: string;
  meta?: Record<string, unknown>;
};

export type ControlState = {
  tenant: string;
  control_id: string;
  state: "unknown" | "pass" | "fail" | "waived";
  updated_at: string;
  evidence_ids: string[];
  rationale?: string[];
  references?: string[];
  version: number;
};

export type CdtEvent = {
  type: string;
  tenant: string;
  occurred_at: string;
  payload: Record<string, unknown>;
  trace_id: string;
};
