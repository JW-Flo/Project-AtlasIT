async function api(path, init) {
  const res = await fetch(path, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    ...init
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json();
}
async function installApp(tenantId, appId, config) {
  const res = await api("/api/marketplace/installs", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId, app_id: appId, config })
  });
  return res.data;
}
async function updateInstallConfig(installId, config) {
  const res = await api(
    `/api/marketplace/installs/${installId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ config })
    }
  );
  return res.data;
}

export { installApp as i, updateInstallConfig as u };
//# sourceMappingURL=marketplace-CZLQH-xI.js.map
