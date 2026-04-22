import { json } from '@sveltejs/kit';
import { b as buildEvidenceSummaries, g as generateResponses } from './questionnaire-ai-hpl4AWlM.js';

const POST = async ({ params, locals, platform }) => {
  const user = locals.user;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });
  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });
  const db = platform?.env?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });
  const questionnaireId = params.id;
  if (!questionnaireId) return json({ error: "id is required" }, { status: 400 });
  const q = await db.prepare(`SELECT id, status FROM questionnaires WHERE id = ? AND tenant_id = ? LIMIT 1`).bind(questionnaireId, tenantId).first();
  if (!q) return json({ error: "Questionnaire not found" }, { status: 404 });
  await db.prepare(`UPDATE questionnaires SET status = 'generating', updated_at = ? WHERE id = ?`).bind((/* @__PURE__ */ new Date()).toISOString(), questionnaireId).run();
  const { results: questions } = await db.prepare(
    `SELECT id, question_index, question_text, section, mapped_controls
       FROM questionnaire_responses
       WHERE questionnaire_id = ? AND status = 'pending'
       ORDER BY question_index`
  ).bind(questionnaireId).all();
  if (!questions || questions.length === 0) {
    await db.prepare(`UPDATE questionnaires SET status = 'ready', updated_at = ? WHERE id = ?`).bind((/* @__PURE__ */ new Date()).toISOString(), questionnaireId).run();
    return json({ generated: 0, message: "No pending questions" });
  }
  const evidenceSummaries = await buildEvidenceSummaries(db, tenantId);
  const mappings = questions.map((q2) => ({
    rowId: q2.id,
    questionIndex: q2.question_index,
    questionText: q2.question_text,
    section: q2.section,
    mappedControls: q2.mapped_controls ? JSON.parse(q2.mapped_controls) : [],
    confidence: 0
  }));
  const groqApiKey = platform?.env?.GROQ_API_KEY;
  const responses = await generateResponses(mappings, evidenceSummaries, groqApiKey);
  const updateStmts = responses.map((r) => {
    const row = mappings.find((m) => m.questionIndex === r.questionIndex);
    if (!row) return null;
    return db.prepare(
      `UPDATE questionnaire_responses
         SET generated_response = ?, evidence_refs = ?, status = 'generated'
         WHERE id = ?`
    ).bind(r.response, JSON.stringify(r.evidenceRefs), row.rowId);
  }).filter(Boolean);
  if (updateStmts.length > 0) {
    await db.batch(updateStmts);
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(
    `UPDATE questionnaires
       SET status = 'ready', responses_count = ?, updated_at = ?
       WHERE id = ?`
  ).bind(updateStmts.length, now, questionnaireId).run();
  return json({
    generated: updateStmts.length,
    total: questions.length,
    status: "ready"
  });
};

export { POST };
//# sourceMappingURL=_server.ts-CB5wN0Ka.js.map
