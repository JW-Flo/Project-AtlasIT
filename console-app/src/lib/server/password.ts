// PBKDF2 hash — stored as "pbkdf2$<iterations>$<hex>"
export async function hashPasswordPBKDF2(
  password: string,
  salt: string,
  iterations = 100000,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  const hex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pbkdf2$${iterations}$${hex}`;
}

// Legacy SHA-256 hash (salt + password) — used only during migration verification
export async function hashPasswordLegacy(
  password: string,
  salt: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Verify a password against a stored hash (supports both legacy SHA-256 and PBKDF2 formats)
export async function verifyPassword(
  password: string,
  salt: string,
  storedHash: string,
): Promise<boolean> {
  if (storedHash.startsWith("pbkdf2$")) {
    const parts = storedHash.split("$");
    const iterations = parseInt(parts[1], 10) || 100000;
    const candidate = await hashPasswordPBKDF2(password, salt, iterations);
    return candidate === storedHash;
  }
  // Legacy: plain hex SHA-256 hash
  const candidate = await hashPasswordLegacy(password, salt);
  return candidate === storedHash;
}
