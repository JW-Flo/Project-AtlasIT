import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { ruleTemplates } from "@atlasit/shared";

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  return json({ templates: ruleTemplates });
};
