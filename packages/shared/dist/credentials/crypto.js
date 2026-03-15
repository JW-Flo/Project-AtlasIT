const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const HKDF_SALT = new TextEncoder().encode("atlasit-credential-vault-v1");
const HKDF_INFO = new TextEncoder().encode("credential-encryption");
function base64Encode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function base64Decode(encoded) {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
async function deriveKey(masterKey) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterKey),
    "HKDF",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: HKDF_SALT,
      info: HKDF_INFO,
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function generateDataKey() {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );
  const rawKey = await crypto.subtle.exportKey("raw", key);
  return { key, exportedKey: base64Encode(rawKey) };
}
export async function encrypt(plaintext, masterKey) {
  const derivedKey = await deriveKey(masterKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    derivedKey,
    encoded,
  );
  return {
    ciphertext: base64Encode(encrypted),
    iv: base64Encode(iv.buffer),
  };
}
export async function decrypt(ciphertext, iv, masterKey) {
  const derivedKey = await deriveKey(masterKey);
  const ivBuffer = new Uint8Array(base64Decode(iv));
  const encryptedBuffer = base64Decode(ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBuffer },
    derivedKey,
    encryptedBuffer,
  );
  return new TextDecoder().decode(decrypted);
}
//# sourceMappingURL=crypto.js.map
