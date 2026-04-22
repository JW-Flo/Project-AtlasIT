import { json } from '@sveltejs/kit';
import { c as classifySeverity } from './classifier-DdU2lVeG.js';

const POST = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { type, source, title, description, metadata } = body;
  if (!title || typeof title !== "string") {
    return json({ error: "Missing required field: title" }, { status: 400 });
  }
  const event = {
    type: type ?? "unknown",
    source: source ?? "manual",
    title,
    description: description ?? "",
    metadata: metadata ?? {}
  };
  const result = classifySeverity(event);
  return json({
    classification: {
      severity: result.severity,
      confidence: result.confidence,
      matchedRules: result.matchedRules,
      autoClassified: result.autoClassified
    }
  });
};

export { POST };
//# sourceMappingURL=_server.ts-BbelQVxi.js.map
