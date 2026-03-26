/**
 * AtlasIT Agent Mesh — Multi-model routing with Groq
 *
 * Architecture (from design spec):
 *   User --> Guard (Prompt Guard: llama-prompt-guard-2-86m)
 *   Guard --> Router
 *   Router --> FastAgent (Operations: llama-3.1-8b-instant)
 *   Router --> DeepAgent (Architecture: gpt-oss-120b)
 *   Router --> InfraAgent (DevOps: qwen3-32b)
 *   All Agents --> Actions --> Systems (Terraform / Kubernetes / AWS / CI)
 *   Audio --> Whisper (whisper-large-v3-turbo) --> FastAgent
 *
 * Routing Policy:
 *   Incoming Task --> Prompt Guard (Block or Escalate if unsafe)
 *   safe --> classify Task Type:
 *     C --> simple ops / alert / summary     --> D[llama-3.1-8b-instant]
 *     C --> infra / automation / config / policy --> E[qwen/qwen3-32b]
 *     C --> deep review / RCA / change analysis --> F[gpt-oss-20b]
 *     C --> audio input                      --> G[whisper-large-v3-turbo]
 *
 * Production recommendation (free tier):
 *   Primary:   qwen/qwen3-32b
 *   Secondary: llama-3.1-8b-instant
 *   Review:    openai/gpt-oss-20b
 *   Guard:     meta-llama/llama-prompt-guard-2-86m
 *   Optional:  whisper-large-v3-turbo
 */
export declare const ATLASIT_MODELS: {
  /** Automation planner — Terraform / CI-CD */
  readonly INFRA: "qwen/qwen3-32b";
  /** Fast ops agent — alerts + commands */
  readonly FAST_OPS: "llama-3.1-8b-instant";
  /** Architecture reasoning — system design, deep review */
  readonly DEEP_REVIEW: "openai/gpt-oss-120b";
  /** Guardrail layer — safety classification */
  readonly GUARD: "meta-llama/llama-prompt-guard-2-86m";
  /** Speech ingestion — transcripts */
  readonly WHISPER: "whisper-large-v3-turbo";
};
export type AgentRole =
  | "fast_ops"
  | "infra"
  | "deep_review"
  | "guard"
  | "whisper";
export interface TaskClassification {
  role: AgentRole;
  model: string;
  confidence: number;
  reason: string;
  blocked: boolean;
  blockReason?: string;
}
export interface AgentMeshConfig {
  groqApiKey: string;
  guardEnabled?: boolean;
  /** Override model for a role */
  modelOverrides?: Partial<Record<AgentRole, string>>;
}
export declare function runPromptGuard(
  input: string,
  config: AgentMeshConfig,
): Promise<{
  safe: boolean;
  reason?: string;
}>;
export declare function classifyTask(input: string): TaskClassification;
export interface AgentMeshResult {
  response: string;
  classification: TaskClassification;
  guardResult?: {
    safe: boolean;
    reason?: string;
  };
  model: string;
  durationMs: number;
}
/**
 * Execute a task through the AtlasIT Agent Mesh.
 * Flow: Guard -> Classify -> Route to appropriate model -> Return result.
 */
export declare function executeAgentMesh(
  input: string,
  config: AgentMeshConfig,
  systemPrompt?: string,
): Promise<AgentMeshResult>;
//# sourceMappingURL=agent-mesh.d.ts.map
