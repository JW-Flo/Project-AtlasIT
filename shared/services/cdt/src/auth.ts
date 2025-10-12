export async function verifySignature(req: Request, secret: string) {
  // Simple HMAC example; replace with Ed25519/JWS later.
  const sig = req.headers.get("X-Atlas-Signature");
  if (!sig) return false;
  const data = await req.clone().text();
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const hex = Array.from(new Uint8Array(mac)).map(b=>b.toString(16).padStart(2,"0")).join("");
  return sig === hex;
}
