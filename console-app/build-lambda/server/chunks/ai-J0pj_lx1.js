import { L as Logger } from './gap-analyzer-CVZTZ0l9.js';

class CloudflareAIProvider {
  token;
  logger;
  constructor(token, logger = new Logger({ service: "ai-cf" })) {
    this.token = token;
    this.logger = logger;
  }
  async generate(messages, opts = {}) {
    throw new Error("CloudflareAI provider not implemented — configure bedrock or groq as primary");
  }
}
class TogetherAIProvider {
  apiKey;
  logger;
  constructor(apiKey, logger = new Logger({ service: "ai-together" })) {
    this.apiKey = apiKey;
    this.logger = logger;
  }
  async generate(messages, opts = {}) {
    ({
      model: opts.model || "meta-llama/Llama-3-70B-Instruct",
      max_tokens: opts.maxTokens || 512,
      temperature: opts.temperature ?? 0.7
    });
    throw new Error("TogetherAI provider not implemented — configure bedrock or groq as primary");
  }
}
class OpenAIAIProvider {
  apiKey;
  logger;
  constructor(apiKey, logger = new Logger({ service: "ai-openai" })) {
    this.apiKey = apiKey;
    this.logger = logger;
  }
  async generate(messages, opts = {}) {
    ({
      model: opts.model || "gpt-4o-mini",
      max_tokens: opts.maxTokens || 512,
      temperature: opts.temperature ?? 0.7
    });
    throw new Error("OpenAI provider not implemented — configure bedrock or groq as primary");
  }
}
class GroqAIProvider {
  apiKey;
  logger;
  constructor(apiKey, logger = new Logger({ service: "ai-groq" })) {
    this.apiKey = apiKey;
    this.logger = logger;
  }
  async generate(messages, opts = {}) {
    const model = opts.model || "qwen/qwen3-32b";
    const body = {
      model,
      messages,
      max_tokens: opts.maxTokens || 1024,
      temperature: opts.temperature ?? 0.7
    };
    this.logger.debug("Calling Groq", { model, messageCount: messages.length });
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Groq API error ${response.status}: ${text.slice(0, 200)}`);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq returned empty response");
    }
    return content;
  }
}
class BedrockAIProvider {
  region;
  accessKeyId;
  secretAccessKey;
  logger;
  constructor(region, accessKeyId, secretAccessKey, logger = new Logger({ service: "ai-bedrock" })) {
    this.region = region;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.logger = logger;
  }
  async generate(messages, opts = {}) {
    const model = opts.model || "us.anthropic.claude-sonnet-4-6";
    this.logger.debug("Calling Bedrock", { model, messageCount: messages.length });
    const systemMessages = messages.filter((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");
    const body = {
      messages: conversationMessages.map((m) => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
      inferenceConfig: {
        maxTokens: opts.maxTokens || 1024,
        temperature: opts.temperature ?? 0.7
      }
    };
    if (systemMessages.length > 0) {
      body.system = systemMessages.map((m) => ({ text: m.content }));
    }
    const endpoint = `https://bedrock-runtime.${this.region}.amazonaws.com/model/${encodeURIComponent(model)}/converse`;
    const payload = JSON.stringify(body);
    const now = /* @__PURE__ */ new Date();
    const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 8);
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const headers = await this.signRequest("POST", endpoint, payload, dateStamp, amzDate);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: payload
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Bedrock API error ${response.status}: ${text.slice(0, 200)}`);
    }
    const data = await response.json();
    const content = data.output?.message?.content?.[0]?.text;
    if (!content) {
      throw new Error("Bedrock returned empty response");
    }
    return content;
  }
  async signRequest(method, url, payload, dateStamp, amzDate) {
    const parsedUrl = new URL(url);
    const host = parsedUrl.host;
    const path = parsedUrl.pathname;
    const service = "bedrock";
    const payloadHash = await this.sha256Hex(payload);
    const canonicalHeaders = `content-type:application/json
host:${host}
x-amz-date:${amzDate}
`;
    const signedHeaders = "content-type;host;x-amz-date";
    const canonicalRequest = [
      method,
      path,
      "",
      // query string
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join("\n");
    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await this.sha256Hex(canonicalRequest)
    ].join("\n");
    const signingKey = await this.getSignatureKey(dateStamp, this.region, service);
    const signature = await this.hmacHex(signingKey, stringToSign);
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return {
      "x-amz-date": amzDate,
      Authorization: authorization
    };
  }
  async sha256Hex(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  toArrayBuffer(data) {
    if (data instanceof Uint8Array)
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    return data;
  }
  async hmac(key, message) {
    const buf = this.toArrayBuffer(key);
    const cryptoKey = await crypto.subtle.importKey("raw", buf, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const msgBuf = this.toArrayBuffer(new TextEncoder().encode(message));
    return crypto.subtle.sign("HMAC", cryptoKey, msgBuf);
  }
  async hmacHex(key, message) {
    const sig = await this.hmac(key, message);
    return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async getSignatureKey(dateStamp, region, service) {
    const kDate = await this.hmac(new TextEncoder().encode(`AWS4${this.secretAccessKey}`), dateStamp);
    const kRegion = await this.hmac(kDate, region);
    const kService = await this.hmac(kRegion, service);
    return this.hmac(kService, "aws4_request");
  }
}
function createAIProvider(env, providerName) {
  const provider = providerName || env.AI_PROVIDER || "cloudflare";
  switch (provider) {
    case "together":
      return new TogetherAIProvider(env.TOGETHER_API_KEY);
    case "openai":
      return new OpenAIAIProvider(env.OPENAI_API_KEY);
    case "groq":
      return new GroqAIProvider(env.GROQ_API_KEY);
    case "bedrock":
      return new BedrockAIProvider(env.AWS_REGION || "us-east-1", env.AWS_ACCESS_KEY_ID, env.AWS_SECRET_ACCESS_KEY);
    default:
      return new CloudflareAIProvider(env.AI_GATEWAY_TOKEN);
  }
}
function deterministicHash(str) {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
async function generateAI(messages, env, _opts = {}) {
  const logger = new Logger({ service: "ai" });
  const deterministic = _opts.deterministic || env.AI_DETERMINISTIC === "1";
  if (deterministic) {
    const basis = JSON.stringify({
      messages,
      model: _opts.model,
      temperature: _opts.temperature
    });
    const h = deterministicHash(basis);
    return `deterministic-response:${h.slice(0, 16)}`;
  }
  const primary = _opts.provider || env.AI_PROVIDER || "cloudflare";
  const fallbackList = _opts.fallbackProviders?.length ? [primary, ..._opts.fallbackProviders] : [
    primary,
    ...env.AI_FALLBACKS ? String(env.AI_FALLBACKS).split(",").map((s) => s.trim()).filter(Boolean) : []
  ];
  const tried = [];
  let lastError;
  for (const providerName of fallbackList) {
    if (tried.includes(providerName))
      continue;
    tried.push(providerName);
    const prov = createAIProvider(env, providerName);
    try {
      logger.debug("AI generate attempt", { provider: providerName });
      const result = await prov.generate(messages, _opts);
      if (providerName !== primary) {
        logger.warn("AI primary provider failed, used fallback", {
          primary,
          used: providerName
        });
      }
      return result;
    } catch (err) {
      lastError = err;
      logger.error("AI provider failed", {
        provider: providerName,
        error: err?.message
      });
      continue;
    }
  }
  throw new Error(`All AI providers failed. Tried: ${tried.join(", ")}. Last error: ${lastError?.message || lastError}`);
}

export { generateAI as g };
//# sourceMappingURL=ai-J0pj_lx1.js.map
