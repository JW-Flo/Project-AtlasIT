import { Logger } from "./logger";
export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export interface AIOptions {
  provider?: "cloudflare" | "together" | "openai" | "groq";
  model?: string;
  maxTokens?: number;
  temperature?: number;
  deterministic?: boolean;
  fallbackProviders?: ("cloudflare" | "together" | "openai" | "groq")[];
}
export interface AIProvider {
  generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare class CloudflareAIProvider implements AIProvider {
  private readonly token;
  private readonly logger;
  constructor(token: string | undefined, logger?: Logger);
  generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare class TogetherAIProvider implements AIProvider {
  private readonly apiKey;
  private readonly logger;
  constructor(apiKey: string, logger?: Logger);
  generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare class OpenAIAIProvider implements AIProvider {
  private readonly apiKey;
  private readonly logger;
  constructor(apiKey: string, logger?: Logger);
  generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
/**
 * Groq AI Provider — uses the Groq API (OpenAI-compatible chat completions).
 * Recommended models for AtlasIT:
 *   - qwen/qwen3-32b (primary — automation planner, Terraform/CI-CD)
 *   - llama-3.1-8b-instant (fast ops agent — alerts + commands)
 *   - openai/gpt-oss-120b (architecture reasoning — system design)
 *   - meta-llama/llama-prompt-guard-2-86m (guardrail layer — safety)
 *   - whisper-large-v3-turbo (speech ingestion — transcripts)
 */
export declare class GroqAIProvider implements AIProvider {
  private readonly apiKey;
  private readonly logger;
  constructor(apiKey: string, logger?: Logger);
  generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}
export declare function createAIProvider(
  env: Record<string, any>,
  providerName?: string,
): AIProvider;
export declare function generateAI(
  messages: AIMessage[],
  env: Record<string, any>,
  _opts?: AIOptions,
): Promise<string>;
//# sourceMappingURL=ai.d.ts.map
