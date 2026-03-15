import type {
  PlatformHealthResponse,
  PlatformUsageSummary,
} from "./types/platform";

export async function fetchPlatformStatus(): Promise<{
  health: PlatformHealthResponse | null;
  usage: PlatformUsageSummary | null;
}> {
  const [healthRes, usageRes] = await Promise.allSettled([
    fetch("/api/health"),
    fetch("/api/platform/usage"),
  ]);

  const health: PlatformHealthResponse | null =
    healthRes.status === "fulfilled" && healthRes.value.ok
      ? ((await healthRes.value.json()) as PlatformHealthResponse)
      : null;
  const usage: PlatformUsageSummary | null =
    usageRes.status === "fulfilled" && usageRes.value.ok
      ? ((await usageRes.value.json()) as PlatformUsageSummary)
      : null;

  if (health && usage) {
    (health as PlatformHealthResponse).usage.recentInvocations =
      (usage as PlatformUsageSummary).total || 0;
    (health as PlatformHealthResponse).usage.breakerOpenScripts =
      (usage as PlatformUsageSummary).breakerOpenScripts || 0;
  }

  return { health, usage };
}
