import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch, parent }) => {
  const { session } = await parent();

  if (!session?.authenticated || !session.tenantId) {
    return { complianceScores: null };
  }

  const scores = await fetch("/api/tenant-compliance/scores")
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  return { complianceScores: scores };
};
