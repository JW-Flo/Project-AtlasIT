import { C as ComplianceAPI } from "../../../../chunks/client.js";
const load = async ({ fetch, url }) => {
  const limit = Number(url.searchParams.get("limit") || 25);
  try {
    const incidents = await ComplianceAPI.listIncidents({ limit }, fetch);
    return { incidents };
  } catch (e) {
    return { error: e?.body?.error || "Failed to load incidents" };
  }
};
export { load };
//# sourceMappingURL=_page.ts.js.map
