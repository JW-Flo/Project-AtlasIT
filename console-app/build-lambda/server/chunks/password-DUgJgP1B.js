async function hashPasswordPBKDF2(password, salt, iterations = 1e5) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2$${iterations}$${hex}`;
}
async function hashPasswordLegacy(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function verifyPassword(password, salt, storedHash) {
  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    const iterations = parseInt(parts[1], 10) || 1e5;
    const candidate2 = await hashPasswordPBKDF2(password, salt, iterations);
    return candidate2 === storedHash;
  }
  const candidate = await hashPasswordLegacy(password, salt);
  return candidate === storedHash;
}

export { hashPasswordPBKDF2 as h, verifyPassword as v };
//# sourceMappingURL=password-DUgJgP1B.js.map
