export type Canonicalizable = unknown;

function normalise(value: unknown): any {
  if (value === null) return null;
  const valueType = typeof value;
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return value;
  }
  if (valueType === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalised = normalise(item);
      return normalised === undefined ? null : normalised;
    });
  }
  if (valueType === "object") {
    const candidate: any = value;
    if (candidate && typeof candidate.toJSON === "function") {
      return normalise(candidate.toJSON());
    }
    const keys = Object.keys(candidate || {}).sort();
    const output: Record<string, unknown> = {};
    for (const key of keys) {
      const normalised = normalise(candidate[key]);
      if (normalised !== undefined) {
        output[key] = normalised;
      }
    }
    return output;
  }
  return undefined; // drop non-JSON values like functions/symbols
}

export function canonicalize(value: Canonicalizable): string {
  const normalised = normalise(value);
  return JSON.stringify(normalised);
}

function toUint8(data: string | Uint8Array): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  return data;
}

async function getSubtle(): Promise<SubtleCrypto> {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  const { webcrypto } = await import("node:crypto");
  return webcrypto.subtle;
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const subtle = await getSubtle();
  const digest = await subtle.digest("SHA-256", toUint8(data));
  return toHex(digest);
}

export async function hashCanonicalJson(value: Canonicalizable) {
  const canonical = canonicalize(value);
  const hash = await sha256Hex(canonical);
  return { canonical, hash };
}
