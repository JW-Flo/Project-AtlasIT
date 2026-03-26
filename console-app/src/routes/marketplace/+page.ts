import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
  const [appsRes, installsRes] = await Promise.all([
    fetch("/api/marketplace")
      .then((r) => r.json())
      .catch(() => ({ status: "error", data: [] })),
    fetch("/api/marketplace/installs")
      .then((r) => r.json())
      .catch(() => ({ status: "error", data: [] })),
  ]);

  const apps = appsRes?.data ?? [];
  const installs = installsRes?.data ?? [];

  return { apps, installs };
};
