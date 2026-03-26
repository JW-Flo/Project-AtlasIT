import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ fetch }) => {
  const [health, usage] = await Promise.all([
    fetch("/api/health")
      .then((r) => r.json())
      .catch(() => ({ ok: false })),
    fetch("/api/platform/usage")
      .then((r) => r.json())
      .catch(() => ({ ok: false })),
  ]);
  return { health, usage };
};
