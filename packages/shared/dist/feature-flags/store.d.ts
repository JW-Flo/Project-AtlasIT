import type { FeatureFlag, FlagEvaluationContext } from "./types.js";
export declare function getFlag(
  kv: KVNamespace,
  key: string,
): Promise<FeatureFlag | null>;
export declare function setFlag(
  kv: KVNamespace,
  flag: FeatureFlag,
): Promise<void>;
export declare function deleteFlag(kv: KVNamespace, key: string): Promise<void>;
export declare function listFlags(kv: KVNamespace): Promise<FeatureFlag[]>;
export declare function isEnabled(
  kv: KVNamespace,
  key: string,
  context: FlagEvaluationContext,
): Promise<boolean>;
//# sourceMappingURL=store.d.ts.map
