import { json } from '@sveltejs/kit';
import { p as parseQuestionnaireText, m as mapQuestionsToControls } from './questionnaire-ai-hpl4AWlM.js';
import { r as requireTenantRole } from './guards-rSzq6XQW.js';

const GET = async ({ locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  try {
    const { results } = await db.prepare(
      `SELECT id, name, template_type, status, questions_count, responses_count, created_at, updated_at
         FROM questionnaires
         WHERE tenant_id = ?
         ORDER BY created_at DESC
         LIMIT 50`
    ).bind(tenantId).all();
    return json({ questionnaires: results ?? [] });
  } catch (e) {
    console.error("Questionnaires list error:", e);
    return json({ questionnaires: [] });
  }
};
const POST = async ({ request, locals, platform }) => {
  const guard = requireTenantRole(locals.user, ["owner", "admin"]);
  if (guard) return guard;
  const user = locals.user;
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  let body;
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
  const questions = parseQuestionnaireText(content);
  if (questions.length === 0) {
    return json({ error: "No questions found in content" }, { status: 400 });
  }
  const mappings = mapQuestionsToControls(questions);
  const id = crypto.randomUUID();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `INSERT INTO questionnaires (id, tenant_id, name, template_type, status, questions_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`
  ).bind(id, tenantId, name, templateType, questions.length, now, now).run();
  const stmts = mappings.map(
    (m) => db.prepare(
      `INSERT INTO questionnaire_responses (id, questionnaire_id, question_index, question_text, section, mapped_controls, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(
      crypto.randomUUID(),
      id,
      m.questionIndex,
      m.questionText,
      m.section,
      JSON.stringify(m.mappedControls)
    )
  );
  if (stmts.length > 0) {
    await db.batch(stmts);
  }
  return json(
    {
      id,
      name,
      templateType,
      questionsCount: questions.length,
      mappedCount: mappings.filter((m) => m.mappedControls.length > 0).length
    },
    { status: 201 }
  );
};

export { GET, POST };
//# sourceMappingURL=_server.ts-DP5vZmMk.js.map
