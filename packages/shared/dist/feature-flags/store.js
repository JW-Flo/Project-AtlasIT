import { evaluateFlag } from "./evaluator.js";
const KEY_PREFIX = "ff:";
export async function getFlag(kv, key) {
  const raw = await kv.get(`${KEY_PREFIX}${key}`);
  if (!raw) return null;
  return JSON.parse(raw);
}
export async function setFlag(kv, flag) {
  await kv.put(`${KEY_PREFIX}${flag.key}`, JSON.stringify(flag));
}
export async function deleteFlag(kv, key) {
  await kv.delete(`${KEY_PREFIX}${key}`);
}
export async function listFlags(kv) {
  const flags = [];
  let cursor;
  do {
    const list = await kv.list({ prefix: KEY_PREFIX, cursor });
    for (const entry of list.keys) {
      const raw = await kv.get(entry.name);
      if (raw) {
        flags.push(JSON.parse(raw));
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return flags;
}
export async function isEnabled(kv, key, context) {
  const flag = await getFlag(kv, key);
  if (!flag) return false;
  return evaluateFlag(flag, context).enabled;
}
//# sourceMappingURL=store.js.map
