/**
 * Questionnaire CRUD — requires auth.
 *
 * GET  — list questionnaires for tenant
 * POST — create a new questionnaire (upload questions)
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { parseQuestionnaireText, mapQuestionsToControls } from "$lib/server/questionnaire-ai";
import { requireTenantRole } from "$lib/server/guards";
import { queryPg, queryPgOne } from "$lib/server/pg";

export const GET: RequestHandler = async ({ locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  try {
    const results = await queryPg<{
      id: string;
      name: string;
      template_type: string;
      status: string;
      questions_count: number;
      responses_count: number;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, name, template_type, status, questions_count, responses_count, created_at, updated_at
       FROM questionnaires
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [tenantId],
    );

    return json({ questionnaires: results ?? [] });
  } catch (e) {
    console.error("Questionnaires list error:", e);
    return json({ questionnaires: [] });
  }
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user!;

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  const templateType = typeof body.templateType === "string" ? body.templateType : "custom";

  if (!name) return json({ error: "name is required" }, { status: 400 });
  if (!content) return json({ error: "content (questionnaire text) is required" }, { status: 400 });

  // Parse questions from text content
  const questions = parseQuestionnaireText(content);
  if (questions.length === 0) {
    return json({ error: "No questions found in content" }, { status: 400 });
  }

  // Map questions to controls
  const mappings = mapQuestionsToControls(questions);

  // Create questionnaire
  const id = crypto.randomUUID();

  await queryPg(
    `INSERT INTO questionnaires (id, tenant_id, name, template_type, status, questions_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'draft', $5, NOW(), NOW())`,
    [id, tenantId, name, templateType, questions.length],
  );

  // Insert question rows with control mappings
  for (const m of mappings) {
    await queryPg(
      `INSERT INTO questionnaire_responses (id, questionnaire_id, question_index, question_text, section, mapped_controls, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [
        crypto.randomUUID(),
        id,
        m.questionIndex,
        m.questionText,
        m.section,
        JSON.stringify(m.mappedControls),
      ],
    );
  }

  return json(
    {
      id,
      name,
      templateType,
      questionsCount: questions.length,
      mappedCount: mappings.filter((m) => m.mappedControls.length > 0).length,
    },
    { status: 201 },
  );
};
