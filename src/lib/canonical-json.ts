// Using unknown allows widest accepted JSON-like inputs

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
    return (value as bigint).toString();
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

export function canonicalize(value: unknown): string {
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
  const subtle = webcrypto.subtle;
  if (
    subtle &&
    typeof subtle.digest === "function" &&
    typeof subtle.encrypt === "function" &&
    typeof subtle.decrypt === "function"
  ) {
    return subtle as SubtleCrypto;
  }
  throw new Error("webcrypto.subtle is not compatible with SubtleCrypto");
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (const byte of bytes) {
    const digest = await subtle.digest(
      "SHA-256",
      bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
        ? bytes.buffer
        : bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ),
    );
  }
  return hex;
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const subtle = await getSubtle();
  const bytes = toUint8(data);
  // Ensure we pass an ArrayBuffer (not SharedArrayBuffer) reference
  const digest = await subtle.digest("SHA-256", bytes.slice().buffer);
  return toHex(digest);
}

export async function hashCanonicalJson(value: unknown) {
  const canonical = canonicalize(value);
  const hash = await sha256Hex(canonical);
  return { canonical, hash };
}
