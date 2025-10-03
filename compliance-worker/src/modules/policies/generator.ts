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

export async function generatePolicy(
  options: GeneratePolicyOptions,
): Promise<GeneratedPolicyData> {
  const generatedAt = new Date().toISOString();
  const input = options.input ?? {};
  // Stable context for hashing/caching should exclude volatile timestamps
  const stableContext = {
    tenantId: options.tenantId,
    templateKey: options.template.key,
    input,
  };
  const { canonical, hash: contextHash } =
    await hashCanonicalJson(stableContext);
  // Rendering context can include the actual generation time for human readability without affecting reuse hash
  const renderContext = { ...stableContext, generatedAt };
  const content = renderTemplate(options.template.body, renderContext);
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
