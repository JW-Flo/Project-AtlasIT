import { log } from "../log";
import type { DynamicConfig } from "../config/dynamicConfig";
import { getConfig, clearConfigCache } from "../config/dynamicConfig";
import { buildSnapshot } from "../registry/registry";
import type { RegistrySnapshot } from "../registry/types";
import { getFeatures, registerFeature } from "../features/registry";
import type { ScanFeature } from "../features/types";
import type {
  EnhancedFinding,
  EnhancedScanResult,
  ScanContext,
  ScanRunOutput,
} from "./types";
import { buildScanResult } from "./utils";
import {
  getLatestModuleDurations,
  getScanMetrics,
  recordFullScan,
  recordModuleRun,
  resetScanMetrics,
} from "./metrics";

import "./headers";
import "./ssl";
import "./info";
import "./threatIntel";
import "./cve";

registerFeature({
  id: "full",
  kind: "scan",
  version: "2.0.0",
  meta: { category: "Composite", composite: true },
  provides: ["meta"],
  run: (async (target: string, ctx: ScanContext) =>
    runFullScan(target, ctx)) as any,
});

let initialized = false;

export function initScans(): void {
  if (!initialized) {
    initialized = true;
    buildSnapshot();
  }
}

export function getRegisteredScanTypes(): string[] {
  initScans();
  return getFeatures("scan").map((feature) => feature.id);
}

export async function getAvailableScanTypes(
  config?: DynamicConfig,
): Promise<string[]> {
  initScans();
  const cfg = config ?? (await getConfig());
  return resolveEnabledScanIds(cfg, { includeFull: true });
}

export async function runScan(
  type: string,
  url: string,
  ctx: ScanContext,
  config?: DynamicConfig,
): Promise<EnhancedScanResult> {
  initScans();
  const cfg = config ?? (await getConfig());
  if (type === "full") {
    return runFullScan(url, ctx, cfg);
  }

  const allowed = new Set(resolveEnabledScanIds(cfg));
  if (!allowed.has(type)) {
    throw new Error(`Scan type disabled or unknown: ${type}`);
  }

  const feature = getFeatures("scan").find((item) => item.id === type) as
    | ScanFeature
    | undefined;
  if (!feature || typeof feature.run !== "function") {
    throw new Error(`Scan module missing run implementation: ${type}`);
  }

  return executeScanModule(feature, url, ctx);
}

export async function runFullScan(
  url: string,
  ctx: ScanContext,
  config?: DynamicConfig,
): Promise<EnhancedScanResult> {
  initScans();
  const cfg = config ?? (await getConfig());
  const scanFeatures = getFeatures("scan") as ScanFeature[];
  const modules = resolveEnabledScanIds(cfg)
    .map((id) => scanFeatures.find((feature) => feature.id === id))
    .filter((feature): feature is ScanFeature =>
      Boolean(feature && feature.run),
    );

  if (!modules.length) {
    log("warn", "scan.full.disabled", { target: url });
    throw new NoActiveScansError();
  }

  const start = now();
  log("info", "scan.full.start", { target: url });
  const individualResults: EnhancedScanResult[] = [];

  for (const feature of modules) {
    individualResults.push(await executeScanModule(feature, url, ctx));
  }

  const duration = now() - start;
  recordFullScan(duration);
  const findings = individualResults.flatMap((result) => result.findings);
  const externalApisUsed = Array.from(
    new Set(
      individualResults.flatMap((result) => result.metadata.externalApisUsed),
    ),
  );

  const compositeFeature = (getFeatures("scan") as ScanFeature[]).find(
    (feature) => feature.id === "full",
  );
  if (!compositeFeature) {
    throw new Error("Composite scan feature not registered");
  }

  log("info", "scan.full.completed", {
    modules: modules.map((feature) => feature.id),
    count: findings.length,
    durationMs: duration,
  });
  log("info", "scan.full.end", {
    durationMs: duration,
    modules: modules.map((feature) => feature.id),
    totalFindings: findings.length,
  });

  return buildScanResult({
    feature: compositeFeature,
    url,
    findings,
    durationMs: duration,
    runOutput: {
      findings,
      externalApisUsed,
    },
  });
}

async function executeScanModule(
  feature: ScanFeature,
  url: string,
  ctx: ScanContext,
): Promise<EnhancedScanResult> {
  if (!feature.run) {
    throw new Error(`Scan feature lacks run implementation: ${feature.id}`);
  }

  const timeoutMs = resolveModuleTimeout(feature.id);
  const start = now();
  log("info", "scan.module.start", { id: feature.id, target: url });

  const runResult = await runModuleWithGuards(feature, url, ctx, timeoutMs);
  const duration = now() - start;

  recordModuleRun(feature.id, duration, {
    timeout: runResult.timedOut,
    failed: runResult.failed,
  });

  log("info", "scan.module.completed", {
    id: feature.id,
    durationMs: duration,
    findings: runResult.findings.length,
    timeout: runResult.timedOut || undefined,
    failed: runResult.failed || undefined,
  });
  log("info", "scan.module.end", {
    id: feature.id,
    durationMs: duration,
    findingsCount: runResult.findings.length,
    timeout: runResult.timedOut || undefined,
    failed: runResult.failed || undefined,
  });

  return buildScanResult({
    feature,
    url,
    findings: runResult.findings,
    durationMs: duration,
    runOutput: runResult.output,
  });
}

export function resolveEnabledScanIds(
  config: DynamicConfig,
  options?: { includeFull?: boolean },
): string[] {
  initScans();
  const includeFull = options?.includeFull ?? false;

  const scanFeatures = getFeatures("scan") as ScanFeature[];
  const featureMap = new Map<string, ScanFeature>(
    scanFeatures.map((feature) => [feature.id, feature]),
  );
  const baseIds = scanFeatures
    .filter((feature) => (includeFull ? true : feature.id !== "full"))
    .map((feature) => feature.id);

  const enableIds = mergeList(
    config.enable?.scans,
    process.env.ENABLED_SCAN_TYPES,
  );
  const disableIds = new Set(
    mergeList(config.disable?.scans, process.env.DISABLED_SCAN_TYPES),
  );
  const enableCapabilities = normalizeCapabilityList(
    config.enable?.capabilities,
  );
  const disableCapabilities = new Set(
    normalizeCapabilityList(config.disable?.capabilities),
  );

  let candidate: string[];
  if (enableIds.length) {
    candidate = baseIds.filter((id) => enableIds.includes(id));
  } else if (enableCapabilities.length) {
    candidate = baseIds.filter((id) => {
      const provides = normalizeArray(featureMap.get(id)?.provides);
      return provides.some((cap) => enableCapabilities.includes(cap));
    });
  } else {
    candidate = [...baseIds];
  }

  candidate = candidate.filter((id) => !disableIds.has(id));
  if (disableCapabilities.size) {
    candidate = candidate.filter((id) => {
      const provides = new Set(normalizeArray(featureMap.get(id)?.provides));
      for (const cap of disableCapabilities) {
        if (provides.has(cap)) {
          return false;
        }
      }
      return true;
    });
  }

  const result = new Set(candidate);

  if (includeFull) {
    const fullFeature = featureMap.get("full");
    if (fullFeature) {
      const provides = new Set(normalizeArray(fullFeature.provides));
      let allowFull = true;

      if (enableIds.length) {
        allowFull = enableIds.includes("full");
      } else if (enableCapabilities.length) {
        allowFull = normalizeArray(fullFeature.provides).some((cap) =>
          enableCapabilities.includes(cap),
        );
      }

      if (
        allowFull &&
        !disableIds.has("full") &&
        !Array.from(disableCapabilities).some((cap) => provides.has(cap))
      ) {
        result.add("full");
      }
    }
  }

  return Array.from(result);
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  return [];
}

function normalizeCapabilityList(values: unknown): string[] {
  return toArray(values)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeArray(values?: string[]): string[] {
  return (values ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function mergeList(configValue: unknown, envValue?: string): string[] {
  return [...toArray(configValue), ...splitEnvList(envValue)];
}

function splitEnvList(value?: string): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export class NoActiveScansError extends Error {
  constructor() {
    super("No active scans available");
    this.name = "NoActiveScansError";
  }
}

const timeoutCache = new Map<string, number>();

function resolveModuleTimeout(id: string): number {
  if (timeoutCache.has(id)) {
    return timeoutCache.get(id)!;
  }

  const envOverride = readTimeoutOverride(id);
  if (envOverride) {
    timeoutCache.set(id, envOverride);
    return envOverride;
  }

  if (id === "threat-intel") {
    timeoutCache.set(id, 8000);
    return 8000;
  }

  const fallback = readDefaultTimeout();
  timeoutCache.set(id, fallback);
  return fallback;
}

function readDefaultTimeout(): number {
  const raw = process.env.SCAN_MODULE_TIMEOUT_DEFAULT;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function readTimeoutOverride(id: string): number | undefined {
  const key = `SCAN_MODULE_TIMEOUT_${id.replace(/-/g, "_").toUpperCase()}`;
  const raw = process.env[key];
  if (!raw) {
    return undefined;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

const timeoutSymbol = Symbol("scan-module-timeout");

async function runModuleWithGuards(
  feature: ScanFeature,
  url: string,
  ctx: ScanContext,
  timeoutMs: number,
): Promise<{
  output: ScanRunOutput;
  findings: EnhancedFinding[];
  timedOut: boolean;
  failed: boolean;
}> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    const handle = setTimeout(() => reject(timeoutSymbol), timeoutMs);
    if (typeof handle.unref === "function") {
      handle.unref();
    }
    timeoutHandle = handle;
  });

  let output: ScanRunOutput = { findings: [] };
  let timedOut = false;
  let failed = false;

  try {
    output = (await Promise.race([
      feature.run!(url, ctx),
      timeoutPromise,
    ])) as ScanRunOutput;
  } catch (error) {
    if (error === timeoutSymbol) {
      timedOut = true;
    } else {
      failed = true;
      output = output ?? { findings: [] };
      const err = error as Error;
      const baseMessage = err?.message ?? String(error);
      const truncated = truncate(baseMessage, 140);
      output.findings = appendSynthetic(output.findings, {
        severity: "warning",
        category: "Scan Execution",
        title: "MODULE_FAILED",
        description: truncated,
        code: "MODULE_FAILED",
      });
    }
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }

  if (timedOut) {
    output.findings = appendSynthetic(output.findings, {
      severity: "info",
      category: "Scan Execution",
      title: "MODULE_TIMEOUT",
      description: `module ${feature.id} exceeded ${timeoutMs}ms`,
      code: "MODULE_TIMEOUT",
    });
  }

  const findings = Array.isArray(output.findings) ? [...output.findings] : [];
  return {
    output,
    findings,
    timedOut,
    failed,
  };
}

function appendSynthetic(
  existing: unknown,
  synthetic: EnhancedFinding,
): EnhancedFinding[] {
  const list = Array.isArray(existing) ? [...existing] : [];
  list.push(synthetic);
  return list;
}

function truncate(message: string, maxLength: number): string {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.slice(0, maxLength - 1)}…`;
}

function now(): number {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }
  return Date.now();
}

export function getScanTimings() {
  return getScanMetrics();
}

export function resetScanRuntime(): void {
  timeoutCache.clear();
  resetScanMetrics();
  lastReloadTs = 0;
}

let lastReloadTs = 0;
const RELOAD_DEBOUNCE_MS = 2000;

export async function reloadScanRuntime(): Promise<{
  throttled: boolean;
  nextAllowedTs?: number;
  snapshot?: RegistrySnapshot;
  enabledScanIds?: string[];
}> {
  const nowTs = Date.now();
  if (nowTs - lastReloadTs < RELOAD_DEBOUNCE_MS) {
    return {
      throttled: true,
      nextAllowedTs: lastReloadTs + RELOAD_DEBOUNCE_MS,
    };
  }

  log("info", "config.reload.start", {});
  lastReloadTs = nowTs;
  timeoutCache.clear();
  resetScanMetrics();
  clearConfigCache();
  const snapshot = buildSnapshot();
  const config = await getConfig({ forceReload: true });
  const enabled = resolveEnabledScanIds(config, { includeFull: true });
  log("info", "config.reload.end", { version: snapshot.version });
  return { throttled: false, snapshot, enabledScanIds: enabled };
}

export function getHealthScanPerf() {
  const metrics = getScanMetrics();
  if (!metrics.total.count) {
    return undefined;
  }
  return {
    totalP95: metrics.total.p95,
    modules: getLatestModuleDurations(),
  };
}
