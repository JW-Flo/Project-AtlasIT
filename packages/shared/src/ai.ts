import { Logger } from "./logger";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export interface AIOptions {
  provider?: "cloudflare" | "together" | "openai" | "groq" | "bedrock";
  model?: string;
  maxTokens?: number;
  temperature?: number;
  deterministic?: boolean; // force deterministic hashing of output (used in tests)
  fallbackProviders?: ("cloudflare" | "together" | "openai" | "groq" | "bedrock")[]; // explicit fallback order override
  /** Enable streaming (provider must support it) */
  stream?: boolean;
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

/**
 * AWS Bedrock AI Provider — uses the Bedrock Runtime Converse API.
 * Uses inference profiles (us.* prefix) for on-demand access.
 * Recommended models for AtlasIT:
 *   - us.anthropic.claude-sonnet-4-6 (primary — compliance copilot reasoning)
 *   - us.anthropic.claude-haiku-4-5-20251001-v1:0 (fast — daily digests, classification)
 *   - us.anthropic.claude-3-5-haiku-20241022-v1:0 (budget — simple tasks)
 */
export class BedrockAIProvider implements AIProvider {
  constructor(
    private readonly region: string,
    private readonly accessKeyId: string,
    private readonly secretAccessKey: string,
    private readonly logger = new Logger({ service: "ai-bedrock" }),
  ) {}

  async generate(messages: AIMessage[], opts: AIOptions = {}): Promise<string> {
    const model = opts.model || "us.anthropic.claude-sonnet-4-6";
    this.logger.debug("Calling Bedrock", { model, messageCount: messages.length });

    // Separate system message from conversation messages
    const systemMessages = messages.filter((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const body: Record<string, unknown> = {
      messages: conversationMessages.map((m) => ({
        role: m.role,
        content: [{ text: m.content }],
      })),
      inferenceConfig: {
        maxTokens: opts.maxTokens || 1024,
        temperature: opts.temperature ?? 0.7,
      },
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map((m) => ({ text: m.content }));
    }

    // Sign and call Bedrock Converse API using AWS Signature V4
    // Inference profile IDs (us.anthropic.*) go in the URL path
    const endpoint = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${encodeURIComponent(model)}/converse`;
    const payload = JSON.stringify(body);
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");

    const headers = await this.signRequest(
      "POST",
      endpoint,
      payload,
      dateStamp,
      amzDate,
    );

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Bedrock API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      output?: { message?: { content?: Array<{ text?: string }> } };
    };

    const content = data.output?.message?.content?.[0]?.text;
    if (!content) {
      throw new Error("Bedrock returned empty response");
    }
    return content;
  }

  private async signRequest(
    method: string,
    url: string,
    payload: string,
    dateStamp: string,
    amzDate: string,
  ): Promise<Record<string, string>> {
    const parsedUrl = new URL(url);
    const host = parsedUrl.host;
    const path = parsedUrl.pathname;
    const service = "bedrock";

    // Create canonical request
    const payloadHash = await this.sha256Hex(payload);
    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-date";
    const canonicalRequest = [
      method,
      path,
      "", // query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    // Create string to sign
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await this.sha256Hex(canonicalRequest),
    ].join("\n");

    // Calculate signature
    const signingKey = await this.getSignatureKey(dateStamp, this.region, service);
    const signature = await this.hmacHex(signingKey, stringToSign);

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      "x-amz-date": amzDate,
      Authorization: authorization,
    };
  }

  private async sha256Hex(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private async hmac(
    key: ArrayBuffer,
    message: string,
  ): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  }

  private async hmacHex(
    key: ArrayBuffer,
    message: string,
  ): Promise<string> {
    const sig = await this.hmac(key, message);
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private async getSignatureKey(
    dateStamp: string,
    region: string,
    service: string,
  ): Promise<ArrayBuffer> {
    const kDate = await this.hmac(
      new TextEncoder().encode(`AWS4${this.secretAccessKey}`),
      dateStamp,
    );
    const kRegion = await this.hmac(kDate, region);
    const kService = await this.hmac(kRegion, service);
    return this.hmac(kService, "aws4_request");
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
    case "bedrock":
      return new BedrockAIProvider(
        env.AWS_REGION || "us-east-1",
        env.AWS_ACCESS_KEY_ID,
        env.AWS_SECRET_ACCESS_KEY,
      );
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
