// Shared health schema builder for AtlasIT workers
// Append-only: do not remove existing fields; only add new optional ones.

export interface AtlasHealthResourceStatus {
  d1_database?: string;
  r2_storage?: string;
  kv?: string;
  queue_system?: string;
  ai_gateway?: string;
}

export interface AtlasHealthIngestionMetrics {
  vehicleState?: { lastUpdate: string | null; ageSeconds: number | null };
  drives?: {
    lastUpdate: string | null;
    ageSeconds: number | null;
    total?: number;
  };
  charges?: {
    lastUpdate: string | null;
    ageSeconds: number | null;
    total?: number;
  };
  statesVisited?: number;
}

export interface AtlasHealthPerformanceMetrics {
  responseTimeMs: number;
  latency?: { count: number; p50: number; p95: number };
}

export interface AtlasHealth {
  status: "ok" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  service: string;
  resources: AtlasHealthResourceStatus;
  ingestion: AtlasHealthIngestionMetrics;
  performance: AtlasHealthPerformanceMetrics;
  warnings: string[];
  // Future: add journey, auth, cache sections (append-only)
}

export function buildBaseHealth(params: {
  version: string;
  service: string;
  startTime: number;
}): AtlasHealth {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: params.version,
    service: params.service,
    resources: {},
    ingestion: {},
    performance: { responseTimeMs: Date.now() - params.startTime },
    warnings: [],
  };
}

export function finalizeHealth(h: AtlasHealth): AtlasHealth {
  // Ensure mandatory sections exist (defensive for partial builders)
  h.resources ||= {};
  h.ingestion ||= {};
  if (!h.performance) {
    h.performance = { responseTimeMs: 0 };
  } else if (typeof (h.performance as any).responseTimeMs !== "number") {
    (h.performance as any).responseTimeMs = 0;
  }
  h.warnings ||= [];
  return h;
}
