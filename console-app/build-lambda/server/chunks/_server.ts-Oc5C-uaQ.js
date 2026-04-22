import { json } from '@sveltejs/kit';
import { f as fetchIdpMetadata } from './saml-ndSwh4nV.js';

const POST = async ({ request, locals }) => {
  const user = locals.user;
  if (!user?.tenantId) return json({ error: "Unauthorized" }, { status: 401 });
  const roles = user.roles ?? [];
  if (!user.superAdmin && !roles.includes("owner") && !roles.includes("admin")) {
    return json({ error: "Only owners and admins can configure SSO" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { metadataUrl } = body;
  if (!metadataUrl || typeof metadataUrl !== "string") {
    return json({ error: "metadataUrl is required" }, { status: 400 });
  }
  try {
    new URL(metadataUrl);
  } catch {
    return json({ error: "Invalid URL" }, { status: 400 });
  }
  try {
    const result = await fetchIdpMetadata(metadataUrl);
    if (!result) {
      return json(
        { error: "Could not parse SAML metadata. Ensure the URL returns valid IdP metadata XML." },
        { status: 422 }
      );
    }
    return json(result);
  } catch (e) {
    console.error("Metadata fetch error:", e);
    return json({ error: "Failed to fetch metadata from the provided URL" }, { status: 502 });
  }
};

export { POST };
//# sourceMappingURL=_server.ts-Oc5C-uaQ.js.map
