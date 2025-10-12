import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

// Deprecated password login endpoint.
// Returns 410 Gone to signal migration to Cloudflare Access SSO.
export const POST: RequestHandler = async () => {
  return json(
    {
      error: "Password login removed. Use Cloudflare Access SSO.",
      migration: {
        provider: "cloudflare-access",
        header: "CF-Access-Authenticated-User-Email",
        doc: "See internal auth migration notes",
      },
    },
    { status: 410 }
  );
};
