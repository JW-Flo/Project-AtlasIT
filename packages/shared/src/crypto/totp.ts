/**
 * TOTP (RFC 6238) implementation using Web Crypto API.
 * Compatible with Cloudflare Workers — no Node.js crypto dependency.
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(data: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let result = "";
  for (const byte of data) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return result;
}

export function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/=+$/, "");
  const output: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(output);
}

/** Generate a random 20-byte TOTP secret, base32-encoded. */
export function generateTotpSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

/** Build an otpauth:// URI for QR code rendering. */
export function generateTotpUri(secret: string, email: string, issuer: string = "AtlasIT"): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** HMAC-SHA1 using Web Crypto API. */
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, message.buffer as ArrayBuffer);
  return new Uint8Array(sig);
}

/** Generate a TOTP code for the given secret and unix timestamp. */
export async function generateTotp(
  secret: string,
  timeSeconds?: number,
  period: number = 30,
  digits: number = 6,
): Promise<string> {
  const key = base32Decode(secret);
  const time = timeSeconds ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(time / period);

  // Encode counter as 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = c & 0xff;
    c = Math.floor(c / 256);
  }

  const hmac = await hmacSha1(key, counterBytes);

  // Dynamic truncation (RFC 4226 section 5.4)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}

export interface TotpVerifyResult {
  valid: boolean;
  drift?: number; // which time step matched (-1, 0, +1)
}

/** Verify a TOTP code, allowing +-1 time step drift. */
export async function verifyTotp(
  secret: string,
  code: string,
  timeSeconds?: number,
  window: number = 1,
  period: number = 30,
): Promise<TotpVerifyResult> {
  if (!code || !/^\d{6}$/.test(code)) {
    return { valid: false };
  }

  const time = timeSeconds ?? Math.floor(Date.now() / 1000);

  for (let drift = -window; drift <= window; drift++) {
    const candidate = await generateTotp(secret, time + drift * period, period);
    if (candidate === code) {
      return { valid: true, drift };
    }
  }

  return { valid: false };
}

// ---------------------------------------------------------------------------
// TOTP secret encryption at rest (AES-256-GCM)
// C-3 FIX: Secrets must be encrypted before storage in D1.
// ---------------------------------------------------------------------------

async function deriveKey(secret: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Encrypt a TOTP secret for storage. Returns `iv_hex:ciphertext_hex`. */
export async function encryptTotpSecret(
  totpSecret: string,
  encryptionKey: string,
): Promise<string> {
  const key = await deriveKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(totpSecret),
  );
  return `${toHex(iv.buffer)}:${toHex(ct)}`;
}

/** Decrypt a stored TOTP secret. */
export async function decryptTotpSecret(encrypted: string, encryptionKey: string): Promise<string> {
  const key = await deriveKey(encryptionKey);
  const [ivHex, ctHex] = encrypted.split(":");
  const iv = fromHex(ivHex);
  const ct = fromHex(ctHex);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ct.buffer as ArrayBuffer,
  );
  return new TextDecoder().decode(pt);
}

/** Check if a value looks like an encrypted secret (iv_hex:ct_hex format). */
export function isEncryptedSecret(value: string): boolean {
  return /^[a-f0-9]{24}:[a-f0-9]+$/.test(value);
}

/** Generate recovery codes in xxxx-xxxx format. */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  while (codes.length < count) {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const code = `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
    if (!codes.includes(code)) {
      codes.push(code);
    }
  }
  return codes;
}
