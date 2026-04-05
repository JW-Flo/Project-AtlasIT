import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch, parent }) => {
  const { session } = await parent();

  if (!session?.authenticated || !session.tenantId) {
    return { prefetched: null };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [tenant, scores, reviews, incidents, runs, evidence] = await Promise.all([
    fetch("/api/tenant/dashboard").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch("/api/tenant-compliance/scores").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch("/api/access-reviews").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch("/api/incidents").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch("/api/automation/executions?limit=5").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    fetch(`/api/evidence-feed?limit=8&since=${encodeURIComponent(since)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);

  return {
    prefetched: { tenant, scores, reviews, incidents, runs, evidence },
  };
};
