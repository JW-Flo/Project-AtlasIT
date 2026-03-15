export interface MarketplaceApp {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  provider: string;
  logo_url: string | null;
  auth_model: string;
  config_schema: Record<string, unknown> | null;
  capabilities: string[] | null;
  version: string;
  status: string;
  documentation_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Install {
  id: string;
  tenant_id: string;
  app_id: string;
  status: "installed" | "configuring" | "active" | "error" | "uninstalled";
  config: Record<string, unknown> | null;
  installed_by: string | null;
  installed_at: string;
  activated_at: string | null;
  uninstalled_at: string | null;
  updated_at: string;
  app_name?: string;
  app_slug?: string;
  app_category?: string;
  app_logo_url?: string | null;
  app_provider?: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "select"
    | "multiselect"
    | "url"
    | "email"
    | "secret";
  required: boolean;
  description?: string;
  placeholder?: string;
  default?: unknown;
  options?: { label: string; value: string }[];
  validation?: { min?: number; max?: number; pattern?: string };
}

interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  meta?: { total: number; limit: number; offset: number };
  correlationId?: string;
  timestamp?: string;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchApps(category?: string): Promise<MarketplaceApp[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const qs = params.toString();
  const url = `/api/marketplace${qs ? `?${qs}` : ""}`;
  const res = await api<ApiResponse<MarketplaceApp[]>>(url);
  return res.data;
}

export async function fetchApp(appId: string): Promise<MarketplaceApp> {
  const res = await api<ApiResponse<MarketplaceApp>>(
    `/api/marketplace/${appId}`,
  );
  return res.data;
}

export async function fetchInstalls(tenantId: string): Promise<Install[]> {
  const res = await api<ApiResponse<Install[]>>(
    `/api/marketplace/installs?tenantId=${tenantId}`,
  );
  return res.data;
}

export async function installApp(
  tenantId: string,
  appId: string,
  config?: Record<string, unknown>,
): Promise<Install> {
  const res = await api<ApiResponse<Install>>("/api/marketplace/installs", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId, app_id: appId, config }),
  });
  return res.data;
}

export async function uninstallApp(installId: string): Promise<void> {
  await api<ApiResponse<{ id: string; uninstalled: boolean }>>(
    `/api/marketplace/installs/${installId}`,
    {
      method: "DELETE",
    },
  );
}

export async function activateInstall(installId: string): Promise<Install> {
  const res = await api<ApiResponse<Install>>(
    `/api/marketplace/installs/${installId}/activate`,
    {
      method: "POST",
    },
  );
  return res.data;
}

export async function updateInstallConfig(
  installId: string,
  config: Record<string, unknown>,
): Promise<Install> {
  const res = await api<ApiResponse<Install>>(
    `/api/marketplace/installs/${installId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ config }),
    },
  );
  return res.data;
}
