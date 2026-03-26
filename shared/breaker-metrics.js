// Breaker metrics persistence (KV optional)
// Key pattern: breaker:<name>:stats
export async function recordBreakerTrip(env, name) {
  const kv = env?.AI_QUOTA || env?.KV_CACHE; // reuse an existing KV binding
  if (!kv || typeof kv.get !== "function") return; // silent fallback
  const key = `breaker:${name}:stats`;
  try {
    const data = (await kv.get(key, { type: "json" }).catch(() => null)) || {
      name,
      trips: 0,
      lastTrip: null,
    };
    data.trips += 1;
    data.lastTrip = new Date().toISOString();
    await kv.put(key, JSON.stringify(data));
  } catch {}
}

export async function readBreakerStats(env, name) {
  const kv = env?.AI_QUOTA || env?.KV_CACHE;
  if (!kv) return { name, trips: 0, lastTrip: null };
  try {
    const data = await kv.get(`breaker:${name}:stats`, { type: "json" });
    if (data && typeof data.trips === "number") return data;
  } catch {}
  return { name, trips: 0, lastTrip: null };
}
