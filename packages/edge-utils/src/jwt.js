// Minimal JWT helper (HS256) for edge/runtime usage without large deps.
// Not for production-grade multi-alg support; extend as needed.
function base64url(data) {
  const str =
    typeof data === "string" ? data : Buffer.from(data).toString("base64");
  return str.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function hmac(key, msg) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return base64url(new Uint8Array(sig));
}
export async function createJWT(claims, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmac(secret, toSign);
  return `${toSign}.${signature}`;
}
export async function verifyJWT(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = await hmac(secret, data);
  if (expected !== s) throw new Error("signature mismatch");
  // Edge-compatible base64url decode
  function base64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    const decoded = atob(str);
    // Convert binary string to UTF-8 string
    let result = "";
    for (let i = 0; i < decoded.length; ++i) {
      result += String.fromCharCode(decoded.charCodeAt(i));
    }
    try {
      // Decode as UTF-8
      return decodeURIComponent(escape(result));
    } catch {
      return result;
    }
  }
  const json = JSON.parse(base64urlDecode(p));
  if (json.exp && Date.now() / 1000 > json.exp) throw new Error("expired");
  return json;
}
//# sourceMappingURL=jwt.js.map
