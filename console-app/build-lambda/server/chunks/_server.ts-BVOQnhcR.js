import { json } from '@sveltejs/kit';
import './gap-analyzer-CVZTZ0l9.js';
import { r as ruleTemplates } from './templates-CNh06UPP.js';

const GET = async ({ locals }) => {
  const user = locals.user;
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
        error: String(error)
      })
    );
    return json({ error: "Failed to load templates. Please try again." }, { status: 500 });
  }
};

export { GET };
//# sourceMappingURL=_server.ts-BVOQnhcR.js.map
