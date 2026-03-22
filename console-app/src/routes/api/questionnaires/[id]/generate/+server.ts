/**
 * Questionnaire AI response generation — requires auth.
 *
 * POST /api/questionnaires/:id/generate
 * Generates AI-backed responses for all pending questions using evidence.
 */
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
  generateResponses,
  buildEvidenceSummaries,
  type QuestionMapping,
} from "$lib/server/questionnaire-ai";

export const POST: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const db = (platform?.env as any)?.ATLAS_SHARED_DB;
  if (!db) return json({ error: "Database unavailable" }, { status: 500 });

  const questionnaireId = params.id;
  if (!questionnaireId) return json({ error: "id is required" }, { status: 400 });

  // Verify questionnaire belongs to tenant
  const q = await db
    .prepare(`SELECT id, status FROM questionnaires WHERE id = ? AND tenant_id = ? LIMIT 1`)
    .bind(questionnaireId, tenantId)
    .first<{ id: string; status: string }>();

  if (!q) return json({ error: "Questionnaire not found" }, { status: 404 });

  // Mark as generating
  await db
    .prepare(`UPDATE questionnaires SET status = 'generating', updated_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), questionnaireId)
    .run();

  // Fetch pending questions
  const { results: questions } = await db
    .prepare(
      `SELECT id, question_index, question_text, section, mapped_controls
       FROM questionnaire_responses
       WHERE questionnaire_id = ? AND status = 'pending'
       ORDER BY question_index`,
    )
    .bind(questionnaireId)
    .all<{
      id: string;
      question_index: number;
      question_text: string;
      section: string | null;
      mapped_controls: string | null;
    }>();

  if (!questions || questions.length === 0) {
    await db
      .prepare(`UPDATE questionnaires SET status = 'ready', updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), questionnaireId)
      .run();
    return json({ generated: 0, message: "No pending questions" });
  }

  // Build evidence summaries
  const evidenceSummaries = await buildEvidenceSummaries(db, tenantId);

  // Build mappings
  const mappings: (QuestionMapping & { rowId: string })[] = questions.map((q) => ({
    rowId: q.id,
    questionIndex: q.question_index,
    questionText: q.question_text,
    section: q.section,
    mappedControls: q.mapped_controls ? JSON.parse(q.mapped_controls) : [],
    confidence: 0,
  }));

  // Get Groq API key from env
  const groqApiKey = (platform?.env as any)?.GROQ_API_KEY;

  // Generate responses
  const responses = await generateResponses(mappings, evidenceSummaries, groqApiKey);

  // Update question rows with generated responses
  const updateStmts = responses
    .map((r) => {
      const row = mappings.find((m) => m.questionIndex === r.questionIndex);
      if (!row) return null;
      return db
        .prepare(
          `UPDATE questionnaire_responses
         SET generated_response = ?, evidence_refs = ?, status = 'generated'
         WHERE id = ?`,
        )
        .bind(r.response, JSON.stringify(r.evidenceRefs), row.rowId);
    })
    .filter(Boolean);

  if (updateStmts.length > 0) {
    await db.batch(updateStmts);
  }

  // Update questionnaire status
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE questionnaires
       SET status = 'ready', responses_count = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(updateStmts.length, now, questionnaireId)
    .run();

  return json({
    generated: updateStmts.length,
    total: questions.length,
    status: "ready",
  });
};
