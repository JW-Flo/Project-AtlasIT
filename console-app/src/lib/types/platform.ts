export interface HealthServiceStatus {
  ok: boolean;
  latencyMs: number | null;
  status: number | null;
  lastChecked: string;
}

export interface PlatformHealthResponse {
  ok: boolean;
  ts: string;
  services: {
    core: HealthServiceStatus;
    dispatch: HealthServiceStatus;
    compliance: HealthServiceStatus;
    orchestrator: HealthServiceStatus;
  };
  usage: {
    recentInvocations: number;
    breakerOpenScripts: number;
  };
}

export interface PlatformUsageSummary {
  ok: boolean;
  total?: number;
  failures?: number;
  failureRate?: number;
  tenants?: number;
  breakerOpenScripts?: number;
  topScripts?: Array<{ name: string; invocations: number }>;
}

export interface UserSession {
  userId: string;
  email: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface AuthSession {
  authenticated: boolean;
  email?: string;
}
