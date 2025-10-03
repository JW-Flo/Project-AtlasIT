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

  const health =
    healthRes.status === "fulfilled" && healthRes.value.ok
      ? await healthRes.value.json()
      : null;
  const usage =
    usageRes.status === "fulfilled" && usageRes.value.ok
      ? await usageRes.value.json()
      : null;

  if (health && usage) {
    (health as PlatformHealthResponse).usage.recentInvocations =
      (usage as PlatformUsageSummary).total || 0;
    (health as PlatformHealthResponse).usage.breakerOpenScripts =
      (usage as PlatformUsageSummary).breakerOpenScripts || 0;
  }

  return { health, usage };
}
