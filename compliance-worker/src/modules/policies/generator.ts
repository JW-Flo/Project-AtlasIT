import {
  hashCanonicalJson,
  sha256Hex,
} from "../../../../src/lib/canonical-json";
import type { PolicyTemplateRecord } from "./templates";

export interface GeneratePolicyOptions {
  template: PolicyTemplateRecord;
  tenantId: string;
  input?: Record<string, unknown>;
}

export interface GeneratedPolicyData {
  content: string;
  hash: string;
  contextHash: string;
  contextCanonical: string;
  generatedAt: string;
  sizeBytes: number;
}

function resolvePlaceholder(
  context: Record<string, unknown>,
  path: string,
): string {
  const segments = path.split(".");
  let current: any = context;
  for (const segment of segments) {
    if (current == null) {
      return "";
    }
    current = current[segment];
  }
  if (current == null) return "";
  if (typeof current === "string") return current;
  return JSON.stringify(current);
}

function sanitizeValue(value: string): string {
  // Hardened escaping to mitigate simple injection / template breakouts.
  // 1. Normalize line endings.
  // 2. Truncate excessively long values (defensive against gigantic substitutions).
  // 3. Escape HTML special chars.
  // 4. Escape backticks and backslashes to reduce risk if rendered inside code blocks.
  const MAX_LEN = 5000; // defensive cap
  let out = value.replace(/\r\n?/g, "\n");
  if (out.length > MAX_LEN) {
    // Truncate at the byte level to avoid breaking multi-byte UTF-8 sequences
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const bytes = encoder.encode(out);
    let truncatedBytes = bytes;
    if (bytes.length > MAX_LEN) {
      truncatedBytes = bytes.slice(0, MAX_LEN);
      // Remove incomplete trailing multi-byte character
      let validLength = truncatedBytes.length;
      while (validLength > 0) {
        try {
          out = decoder.decode(truncatedBytes.slice(0, validLength));
          break;
        } catch {
          validLength--;
        }
      }
      out = out + "…"; // ellipsis to indicate truncation
    } else {
      out = decoder.decode(truncatedBytes);
    }
  }
  return out
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/`/g, "&#96;")
    .replace(/\\/g, "&#92;");
}

function renderTemplate(
  body: string,
  context: Record<string, unknown>,
): string {
  return body.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, path) => {
    const value = resolvePlaceholder(context, String(path));
    return value ? sanitizeValue(value) : "";
  });
}

async function generateWithAI(
  template: PolicyTemplateRecord,
  baseContent: string,
  input: Record<string, unknown>,
  groqApiKey: string | undefined,
): Promise<string> {
  if (!groqApiKey) return baseContent;

  const userContext = input.summary
    ? `\nAdditional context from user: ${input.summary}`
    : "";
  const prompt = `You are a compliance policy expert. Enhance the following ${template.name} policy document with specific, actionable details. Keep the same structure and headings but expand each section with industry best practices, specific procedures, and implementation guidance. Be thorough but concise.${userContext}

Here is the base policy to enhance:

${baseContent}

Return ONLY the enhanced policy document in markdown format. Do not include any preamble or explanation.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a compliance and security policy expert. Generate professional, detailed policy documents.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 4096,
          temperature: 0.3,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      console.error("Groq API error:", response.status);
      return baseContent;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const aiContent = data.choices?.[0]?.message?.content;
    if (aiContent && aiContent.length > 100) {
      return aiContent;
    }
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      console.warn("Groq API timed out, falling back to base content");
    } else {
      console.error("AI generation failed, using template:", e);
    }
  } finally {
    clearTimeout(timeoutId);
  }

  return baseContent;
}

export async function generatePolicy(
  options: GeneratePolicyOptions & { groqApiKey?: string },
): Promise<GeneratedPolicyData> {
  const generatedAt = new Date().toISOString();
  const input = options.input ?? {};
  // Stable context for hashing/caching should exclude volatile timestamps
  const stableContext = {
    tenantId: options.tenantId,
    templateKey: options.template.key,
    input,
    ai: !!options.groqApiKey,
  };
  const { canonical, hash: contextHash } =
    await hashCanonicalJson(stableContext);
  // Rendering context can include the actual generation time for human readability without affecting reuse hash
  const renderContext = { ...stableContext, generatedAt };
  let content = renderTemplate(options.template.body, renderContext);

  // Enhance with AI if Groq API key is available
  content = await generateWithAI(
    options.template,
    content,
    input,
    options.groqApiKey,
  );

  const hash = await sha256Hex(content);
  const sizeBytes = new TextEncoder().encode(content).byteLength;

  return {
    content,
    hash,
    contextHash,
    contextCanonical: canonical,
    generatedAt,
    sizeBytes,
  };
}
