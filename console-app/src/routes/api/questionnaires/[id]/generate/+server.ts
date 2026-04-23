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
import { queryPg, queryPgOne } from "$lib/server/pg";

export const POST: RequestHandler = async ({ params, locals, platform }) => {
  const user = locals.user as any;
  if (!user) return json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = user.tenantId;
  if (!tenantId) return json({ error: "Tenant context required" }, { status: 403 });

  const questionnaireId = params.id;
  if (!questionnaireId) return json({ error: "id is required" }, { status: 400 });

  // Verify questionnaire belongs to tenant
  const q = await queryPgOne<{ id: string; status: string }>(
    `SELECT id, status FROM questionnaires WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
    [questionnaireId, tenantId],
  );

  if (!q) return json({ error: "Questionnaire not found" }, { status: 404 });

  // Mark as generating
  await queryPg(
    `UPDATE questionnaires SET status = 'generating', updated_at = NOW() WHERE id = $1`,
    [questionnaireId],
  );

  // Fetch pending questions
  const questions = await queryPg<{
    id: string;
    question_index: number;
    question_text: string;
    section: string | null;
    mapped_controls: string | null;
  }>(
    `SELECT id, question_index, question_text, section, mapped_controls
     FROM questionnaire_responses
     WHERE questionnaire_id = $1 AND status = 'pending'
     ORDER BY question_index`,
    [questionnaireId],
  );

  if (!questions || questions.length === 0) {
    await queryPg(`UPDATE questionnaires SET status = 'ready', updated_at = NOW() WHERE id = $1`, [
      questionnaireId,
    ]);
    return json({ generated: 0, message: "No pending questions" });
  }

  // Build evidence summaries
  const evidenceSummaries = await buildEvidenceSummaries(tenantId);

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
  let updatedCount = 0;
  for (const r of responses) {
    const row = mappings.find((m) => m.questionIndex === r.questionIndex);
    if (!row) continue;
    await queryPg(
      `UPDATE questionnaire_responses
       SET generated_response = $1, evidence_refs = $2, status = 'generated'
       WHERE id = $3`,
      [r.response, JSON.stringify(r.evidenceRefs), row.rowId],
    );
    updatedCount++;
  }

  // Update questionnaire status
  await queryPg(
    `UPDATE questionnaires
     SET status = 'ready', responses_count = $1, updated_at = NOW()
     WHERE id = $2`,
    [updatedCount, questionnaireId],
  );

  return json({
    generated: updatedCount,
    total: questions.length,
    status: "ready",
  });
};
