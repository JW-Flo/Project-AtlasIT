const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(data) {
  let bits = 0;
  let value = 0;
  let result = "";
  for (const byte of data) {
    value = value << 8 | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[value >>> bits & 31];
    }
  }
  if (bits > 0) {
    result += BASE32_ALPHABET[value << 5 - bits & 31];
  }
  return result;
}
function base32Decode(input) {
  const clean = input.toUpperCase().replace(/=+$/, "");
  const output = [];
  let bits = 0;
  let value = 0;
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1)
      continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push(value >>> bits & 255);
    }
  }
  return new Uint8Array(output);
}
function generateTotpSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}
function generateTotpUri(secret, email, issuer = "AtlasIT") {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(email)}`;
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30"
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
async function hmacSha1(key, message) {
  const cryptoKey = await crypto.subtle.importKey("raw", key.buffer, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, message.buffer);
  return new Uint8Array(sig);
}
async function generateTotp(secret, timeSeconds, period = 30, digits = 6) {
  const key = base32Decode(secret);
  const time = timeSeconds ?? Math.floor(Date.now() / 1e3);
  const counter = Math.floor(time / period);
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = c & 255;
    c = Math.floor(c / 256);
  }
  const hmac = await hmacSha1(key, counterBytes);
  const offset = hmac[hmac.length - 1] & 15;
  const binary = (hmac[offset] & 127) << 24 | (hmac[offset + 1] & 255) << 16 | (hmac[offset + 2] & 255) << 8 | hmac[offset + 3] & 255;
  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}
async function verifyTotp(secret, code, timeSeconds, window = 1, period = 30) {
  if (!code || !/^\d{6}$/.test(code)) {
    return { valid: false };
  }
  const time = Math.floor(Date.now() / 1e3);
  for (let drift = -window; drift <= window; drift++) {
    const candidate = await generateTotp(secret, time + drift * period, period);
    if (candidate === code) {
      return { valid: true, drift };
    }
  }
  return { valid: false };
}
async function deriveKey(secret) {
  const raw = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
async function encryptTotpSecret(totpSecret, encryptionKey) {
  const key = await deriveKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(totpSecret));
  return `${toHex(iv.buffer)}:${toHex(ct)}`;
}
async function decryptTotpSecret(encrypted, encryptionKey) {
  const key = await deriveKey(encryptionKey);
  const [ivHex, ctHex] = encrypted.split(":");
  const iv = fromHex(ivHex);
  const ct = fromHex(ctHex);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv.buffer }, key, ct.buffer);
  return new TextDecoder().decode(pt);
}
function isEncryptedSecret(value) {
  return /^[a-f0-9]{24}:[a-f0-9]+$/.test(value);
}
function generateRecoveryCodes(count = 8) {
  const codes = [];
  while (codes.length < count) {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const code = `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
    if (!codes.includes(code)) {
      codes.push(code);
    }
  }
  return codes;
}

export { generateTotpUri as a, generateRecoveryCodes as b, decryptTotpSecret as d, encryptTotpSecret as e, generateTotpSecret as g, isEncryptedSecret as i, verifyTotp as v };
//# sourceMappingURL=totp-BDHpqMjI.js.map
