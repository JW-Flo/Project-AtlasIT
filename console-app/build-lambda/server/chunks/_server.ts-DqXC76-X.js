import { g as generateSpMetadata } from './saml-ndSwh4nV.js';

const GET = async ({ url }) => {
  const origin = url.origin;
  const spEntityId = `${origin}/api/auth/sso/metadata`;
  const acsUrl = `${origin}/api/auth/sso/callback`;
  const metadata = generateSpMetadata(spEntityId, acsUrl);
  return new Response(metadata, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
};

export { GET };
//# sourceMappingURL=_server.ts-DqXC76-X.js.map
