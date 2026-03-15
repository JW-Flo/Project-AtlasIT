import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const [appRes, installsRes] = await Promise.all([
    fetch(`/api/marketplace/${params.appId}`)
      .then((r) => r.json())
      .catch(() => ({ status: "error", data: null })),
    fetch("/api/marketplace/installs")
      .then((r) => r.json())
      .catch(() => ({ status: "error", data: [] })),
  ]);

  const app = appRes?.data ?? null;
  const installs = (installsRes?.data ?? []) as Array<{
    app_id: string;
    status: string;
    [key: string]: unknown;
  }>;
  const install =
    installs.find(
      (i) => i.app_id === params.appId && i.status !== "uninstalled",
    ) ?? null;

  return { app, install };
};
