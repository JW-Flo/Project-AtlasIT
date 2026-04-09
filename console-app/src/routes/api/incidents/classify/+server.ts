/**
 * POST /api/incidents/classify — Auto-classify severity from event data
 * Returns suggested severity, confidence, and matched rules without creating an incident.
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { classifySeverity, type EventData } from "@atlasit/shared/incidents/classifier";

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, source, title, description, metadata } = body;
  if (!title || typeof title !== "string") {
    return json({ error: "Missing required field: title" }, { status: 400 });
  }

  const event: EventData = {
    type: type ?? "unknown",
    source: source ?? "manual",
    title,
    description: description ?? "",
    metadata: metadata ?? {},
  };

  const result = classifySeverity(event);

  return json({
    classification: {
      severity: result.severity,
      confidence: result.confidence,
      matchedRules: result.matchedRules,
      autoClassified: result.autoClassified,
    },
  });
};
