import { log } from "../log";

export interface DynamicConfig {
  enable: Record<string, ReadonlyArray<string>>;
  disable: Record<string, ReadonlyArray<string>>;
  rawEnv: Record<string, string>;
  extra: Record<string, unknown>;
  version: number;
  loadedAt: number;
  source: "kv" | "env" | "default" | "mixed";
}

const DEFAULT_TTL_MS = 30_000;
let ttlMs = DEFAULT_TTL_MS;
let cache: { value: DynamicConfig; expiresAt: number } | null = null;
let configVersion = 0;

const asStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry : String(entry ?? "")))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const freezeStrings = (values: string[]): ReadonlyArray<string> =>
  Object.freeze([...values]);

const freezeRecord = (
  record: Record<string, string[]>,
): Record<string, ReadonlyArray<string>> => {
  const next: Record<string, ReadonlyArray<string>> = {};
  for (const [key, value] of Object.entries(record)) {
    next[key] = freezeStrings(value);
  }
  return Object.freeze(next);
};

const bucketFromEnvKey = (envKey: string, prefix: string): string => {
  return envKey
    .slice(prefix.length)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
};

interface EnvConfig {
  enable: Record<string, string[]>;
  disable: Record<string, string[]>;
  rawEnv: Record<string, string>;
}

const parseEnv = (env: NodeJS.ProcessEnv): EnvConfig => {
  const enable: Record<string, string[]> = {};
  const disable: Record<string, string[]> = {};
  const rawEnv: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    if (key.startsWith("ENABLE_")) {
      const bucket = bucketFromEnvKey(key, "ENABLE_");
      enable[bucket] = asStringList(value);
      rawEnv[key] = value;
    } else if (key.startsWith("DISABLE_")) {
      const bucket = bucketFromEnvKey(key, "DISABLE_");
      disable[bucket] = asStringList(value);
      rawEnv[key] = value;
    }
  }

  return { enable, disable, rawEnv };
};

const applyRecord = (
  source: Record<string, string[]>,
  target: Record<string, string[]>,
): void => {
  for (const [key, values] of Object.entries(source)) {
    if (!values.length) continue;
    target[key] = [...values];
  }
};

const readKvPayload = async (): Promise<Record<string, unknown>> => {
  const maybeKv = (
    globalThis as typeof globalThis & {
      ATLAS_KV?: { get: (key: string) => Promise<unknown> | unknown };
    }
  ).ATLAS_KV;

  if (!maybeKv || typeof maybeKv.get !== "function") {
    return {};
  }

  try {
    const raw = await maybeKv.get("dynamic-config");
    if (!raw) {
      return {};
    }

    if (typeof raw === "string") {
      return JSON.parse(raw);
    }

    if (typeof raw === "object") {
      return raw as Record<string, unknown>;
    }
  } catch (error) {
    log("warn", "config.kv.parse-failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return {};
};

function asRecordOfArrays(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const result: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const list = asStringList(entry);
    if (list.length) {
      result[key] = list;
    }
  }
  return result;
}

export async function loadConfig(): Promise<DynamicConfig> {
  const now = Date.now();
  const enable: Record<string, string[]> = {};
  const disable: Record<string, string[]> = {};
  const extra: Record<string, unknown> = {};

  const envConfig = parseEnv(process.env);
  let source: DynamicConfig["source"] = "default";
  let envApplied = false;
  let kvApplied = false;

  if (
    Object.keys(envConfig.enable).length ||
    Object.keys(envConfig.disable).length
  ) {
    applyRecord(envConfig.enable, enable);
    applyRecord(envConfig.disable, disable);
    envApplied = true;
    source = "env";
  }

  const kvPayload = await readKvPayload();
  const kvEnable = asRecordOfArrays((kvPayload as { enable?: unknown }).enable);
  const kvDisable = asRecordOfArrays(
    (kvPayload as { disable?: unknown }).disable,
  );

  if (Object.keys(kvEnable).length || Object.keys(kvDisable).length) {
    applyRecord(kvEnable, enable);
    applyRecord(kvDisable, disable);
    kvApplied = true;
  }

  const extraKeys = Object.keys(kvPayload).filter(
    (key) => key !== "enable" && key !== "disable",
  );
  if (extraKeys.length) {
    for (const key of extraKeys) {
      extra[key] = kvPayload[key];
    }
    kvApplied = true;
  }

  const version = ++configVersion;
  const finalSource: DynamicConfig["source"] = kvApplied
    ? envApplied
      ? "mixed"
      : "kv"
    : source;

  return Object.freeze({
    enable: freezeRecord(enable),
    disable: freezeRecord(disable),
    rawEnv: Object.freeze({ ...envConfig.rawEnv }),
    extra: Object.freeze(extra),
    version,
    loadedAt: now,
    source: finalSource,
  });
}

export async function getConfig(options?: {
  forceReload?: boolean;
}): Promise<DynamicConfig> {
  const forceReload = options?.forceReload ?? false;
  const now = Date.now();

  if (!forceReload && cache && cache.expiresAt > now) {
    return cache.value;
  }

  const value = await loadConfig();
  cache = {
    value,
    expiresAt: value.loadedAt + ttlMs,
  };
  return value;
}

export function setConfigTTL(nextTtlMs: number): void {
  ttlMs =
    Number.isFinite(nextTtlMs) && nextTtlMs > 0
      ? Math.floor(nextTtlMs)
      : DEFAULT_TTL_MS;
  cache = null;
}

export function clearConfigCache(): void {
  cache = null;
}
