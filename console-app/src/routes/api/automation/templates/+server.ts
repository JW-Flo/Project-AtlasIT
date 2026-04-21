import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { ruleTemplates } from "@atlasit/shared";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user as any;
  if (!user) {
    return json({ error: "Authentication required. Please sign in again." }, { status: 401 });
  }

  try {
    return json({ templates: ruleTemplates });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Failed to load automation templates",
        error: String(error),
      }),
    );
    return json({ error: "Failed to load templates. Please try again." }, { status: 500 });
  }
};
