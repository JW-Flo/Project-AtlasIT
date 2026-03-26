import type { FeatureFlag, FlagEvaluationContext } from "./types.js";
import { evaluateFlag } from "./evaluator.js";

const KEY_PREFIX = "ff:";

export async function getFlag(
  kv: KVNamespace,
  key: string,
): Promise<FeatureFlag | null> {
  const raw = await kv.get(`${KEY_PREFIX}${key}`);
  if (!raw) return null;
  return JSON.parse(raw) as FeatureFlag;
}

export async function setFlag(
  kv: KVNamespace,
  flag: FeatureFlag,
): Promise<void> {
  await kv.put(`${KEY_PREFIX}${flag.key}`, JSON.stringify(flag));
}

export async function deleteFlag(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(`${KEY_PREFIX}${key}`);
}

export async function listFlags(kv: KVNamespace): Promise<FeatureFlag[]> {
  const flags: FeatureFlag[] = [];
  let cursor: string | undefined;

  do {
    const list = await kv.list({ prefix: KEY_PREFIX, cursor });
    for (const entry of list.keys) {
      const raw = await kv.get(entry.name);
      if (raw) {
        flags.push(JSON.parse(raw) as FeatureFlag);
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return flags;
}

export async function isEnabled(
  kv: KVNamespace,
  key: string,
  context: FlagEvaluationContext,
): Promise<boolean> {
  const flag = await getFlag(kv, key);
  if (!flag) return false;
  return evaluateFlag(flag, context).enabled;
}
