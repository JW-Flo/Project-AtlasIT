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
  deterministic?: boolean; // force deterministic hashing of output (used in tests)
  fallbackProviders?: ("cloudflare" | "together" | "openai" | "groq")[]; // explicit fallback order override
}

export interface AIProvider {
  generate(messages: AIMessage[], opts?: AIOptions): Promise<string>;
}

export class CloudflareAIProvider implements AIProvider {
  constructor(
    private readonly token: string | undefined,
    private readonly logger = new Logger({ service: "ai-cf" }),
  ) {}
  async generate(messages: AIMessage[], opts: AIOptions = {}): Promise<string> {
    const prompt = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");
    this.logger.debug("Calling Cloudflare AI", { length: prompt.length });
    // Placeholder: real implementation would call Workers AI fetch binding
    return `cf-ai-response: ${prompt.slice(0, 120)}`;
  }
}

export class TogetherAIProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly logger = new Logger({ service: "ai-together" }),
  ) {}
  async generate(messages: AIMessage[], opts: AIOptions = {}): Promise<string> {
    const body = {
      model: opts.model || "meta-llama/Llama-3-70B-Instruct",
      messages,
      max_tokens: opts.maxTokens || 512,
      temperature: opts.temperature ?? 0.7,
    };
    this.logger.debug("Calling Together AI", { body });
    // Placeholder: would perform fetch
    return "together-ai-response";
  }
}

export class OpenAIAIProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly logger = new Logger({ service: "ai-openai" }),
  ) {}
  async generate(messages: AIMessage[], opts: AIOptions = {}): Promise<string> {
    const body = {
      model: opts.model || "gpt-4o-mini",
      messages,
      max_tokens: opts.maxTokens || 512,
      temperature: opts.temperature ?? 0.7,
    };
    this.logger.debug("Calling OpenAI", { body });
    // Placeholder
    return "openai-response";
  }
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
export class GroqAIProvider implements AIProvider {
  constructor(
    private readonly apiKey: string,
    private readonly logger = new Logger({ service: "ai-groq" }),
  ) {}
  async generate(messages: AIMessage[], opts: AIOptions = {}): Promise<string> {
    const model = opts.model || "qwen/qwen3-32b";
    const body = {
      model,
      messages,
      max_tokens: opts.maxTokens || 1024,
      temperature: opts.temperature ?? 0.7,
    };
    this.logger.debug("Calling Groq", { model, messageCount: messages.length });
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Groq API error ${response.status}: ${text.slice(0, 200)}`);
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq returned empty response");
    }
    return content;
  }
}

export function createAIProvider(
  env: Record<string, any>,
  providerName?: string,
): AIProvider {
  const provider = providerName || env.AI_PROVIDER || "cloudflare";
  switch (provider) {
    case "together":
      return new TogetherAIProvider(env.TOGETHER_API_KEY);
    case "openai":
      return new OpenAIAIProvider(env.OPENAI_API_KEY);
    case "groq":
      return new GroqAIProvider(env.GROQ_API_KEY);
    default:
      return new CloudflareAIProvider(env.AI_GATEWAY_TOKEN);
  }
}

// Simple deterministic hash (FNV-1a like) for stable pseudo output
function deterministicHash(str: string): string {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export async function generateAI(
  messages: AIMessage[],
  env: Record<string, any>,
  _opts: AIOptions = {},
) {
  const logger = new Logger({ service: "ai" });

  // Deterministic short‑circuit (env or opts flag)
  const deterministic = _opts.deterministic || env.AI_DETERMINISTIC === "1";
  if (deterministic) {
    const basis = JSON.stringify({
      messages,
      model: _opts.model,
      temperature: _opts.temperature,
    });
    const h = deterministicHash(basis);
    return `deterministic-response:${h.slice(0, 16)}`;
  }

  const primary = _opts.provider || env.AI_PROVIDER || "cloudflare";
  // Resolve fallback chain: opts fallbackProviders overrides env.AI_FALLBACKS (comma list)
  const fallbackList: string[] = _opts.fallbackProviders?.length
    ? [primary, ..._opts.fallbackProviders]
    : [
        primary,
        ...(env.AI_FALLBACKS
          ? String(env.AI_FALLBACKS)
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : []),
      ];

  const tried: string[] = [];
  let lastError: any;
  for (const providerName of fallbackList) {
    if (tried.includes(providerName)) continue; // skip duplicates
    tried.push(providerName);
    const prov = createAIProvider(env, providerName as any);
    try {
      logger.debug("AI generate attempt", { provider: providerName });
      const result = await prov.generate(messages, _opts);
      if (providerName !== primary) {
        logger.warn("AI primary provider failed, used fallback", {
          primary,
          used: providerName,
        });
      }
      return result;
    } catch (err: any) {
      lastError = err;
      logger.error("AI provider failed", {
        provider: providerName,
        error: err?.message,
      });
      continue;
    }
  }
  throw new Error(
    `All AI providers failed. Tried: ${tried.join(", ")}. Last error: ${lastError?.message || lastError}`,
  );
}
