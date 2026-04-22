function base64urlEncode(data) {
  const str = btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (c) => c.charCodeAt(0));
}
function encodeJson(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return base64urlEncode(bytes);
}
async function hmacSign(key, data) {
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64urlEncode(new Uint8Array(sig));
}
async function importKey(secret) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function signJwt(payload, secret) {
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const body = encodeJson(payload);
  const key = await importKey(secret);
  const signature = await hmacSign(key, `${header}.${body}`);
  return `${header}.${body}.${signature}`;
}
async function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3)
    return null;
  const [header, body, signature] = parts;
  try {
    const key = await importKey(secret);
    const expectedSig = await hmacSign(key, `${header}.${body}`);
    if (expectedSig !== signature)
      return null;
    const decoded = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export { signJwt as s, verifyJwt as v };
//# sourceMappingURL=jwt-pK30hwC6.js.map
