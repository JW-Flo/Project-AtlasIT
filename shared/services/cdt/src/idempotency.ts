// Idempotency utilities for POST /twin/event
export async function enforceIdempotency(ns: KVNamespace, req: Request) {
  const keyHdr = req.headers.get("Idempotency-Key");
  if (!keyHdr) return null; // process normally
  const body = await req.clone().text();
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const hash = Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,"0")).join("");
  const k = `${keyHdr}:${hash}`;
  const exists = await ns.get(k);
  if (exists) return JSON.parse(exists);
  return { key: k, bodyHash: hash };
}

export async function persistIdempotency(ns: KVNamespace, token: {key:string}, resp: unknown, ttl=86400) {
  await ns.put(token.key, JSON.stringify(resp), { expirationTtl: ttl });
}
