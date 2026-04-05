import type { RequestHandler } from "@sveltejs/kit";
import { generateSpMetadata } from "@atlasit/shared/sso/saml";

/**
 * GET /api/auth/sso/metadata — SP metadata for IdP configuration.
 * Public endpoint — no auth required.
 */
export const GET: RequestHandler = async ({ url }) => {
  const origin = url.origin;
  const spEntityId = `${origin}/api/auth/sso/metadata`;
  const acsUrl = `${origin}/api/auth/sso/callback`;

  const metadata = generateSpMetadata(spEntityId, acsUrl);

  return new Response(metadata, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
