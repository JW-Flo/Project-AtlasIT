import { C as ComplianceAPI } from "../../../../chunks/client.js";
const load = async ({ fetch, url }) => {
  const limit = Number(url.searchParams.get("limit") || 50);
  try {
    const activity = await ComplianceAPI.listActivity({ limit }, fetch);
    return { activity };
  } catch (e) {
    return { error: e?.body?.error || "Failed to load activity" };
  }
};
export { load };
//# sourceMappingURL=_page.ts.js.map
