/// <reference types="svelte" />

/// <reference types="@cloudflare/workers-types" />
declare var __APP_VERSION__: string;
declare var __GIT_COMMIT__: string;

// Cloudflare Platform env bindings (augmented)
declare global {
  namespace App {
    interface Platform {
      env: {
        // D1
        ATLAS_CORE_DB: D1Database;
        ATLAS_AUDIT_DB: D1Database;
        D1_COMPLIANCE?: D1Database; // optional placeholders
        D1_AUDIT?: D1Database;
        // KV
        KV_SESSIONS: KVNamespace;
        KV_CACHE: KVNamespace;
        KV_FEATURE_FLAGS?: KVNamespace;
        // R2
        R2_POLICIES: R2Bucket;
        R2_EVIDENCE: R2Bucket;
        R2_ARTIFACTS?: R2Bucket;
        // Analytics Datasets
        ANALYTICS_EVENTS: AnalyticsEngineDataset;
        ANALYTICS_METRICS?: AnalyticsEngineDataset;
        // Queues
        WORKFLOW_QUEUE: Queue;
        Q_POLICY_REBUILD?: Queue;
        Q_RISK_RECALC?: Queue;
      };
    }
  }
}

export {};
