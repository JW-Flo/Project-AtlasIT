/**
 * Questionnaire AI — port of console-app/src/lib/server/questionnaire-ai.ts
 *
 * Flow:
 *   1. parseQuestionnaireText(text) — split CSV/text into questions
 *   2. mapQuestionsToControls(questions) — keyword → CDT control IDs
 *   3. buildEvidenceSummaries(tenantId) — pg query against compliance_evidence
 *   4. buildLearningContext(tenantId) — pg query for accepted/edited prior answers
 *   5. generateResponses(...) — Groq LLM call grounded in evidence
 *
 * Differences from the SvelteKit-server version:
 *   - Uses pg pool instead of D1 db.prepare().bind().all()
 *   - Reads tenant_id from auth context, not URL slug
 *   - Returns plain objects (no D1 result wrapper)
 */

import type { Pool } from "pg";

const CONTROL_DESCRIPTIONS: Record<string, string> = {
  "CC6.1": "Logical access security — provisioning, RBAC, and removal",
  "CC6.2": "MFA and credential management",
  "CC6.3": "Access removal on termination or role change",
  "CC7.1": "Detection of configuration changes and vulnerabilities",
  "CC7.2": "Anomalous activity monitoring",
  "CC7.3": "Security incident evaluation and response",
  "A.9.1.1": "Access control policy",
  "A.9.2.1": "User registration and de-registration",
  "A.9.2.3": "Management of privileged access rights",
  "A.9.4.2": "Secure log-on procedures (MFA)",
  "164.312(a)(1)": "Access control — ePHI",
  "PR.AC-1": "Identity management and access control",
  "PR.AC-4": "Least privilege and separation of duties",
  "Art.5(1)(f)": "Integrity and confidentiality",
};

export interface ParsedQuestion {
  index: number;
  question: string;
  section: string | null;
}

export interface QuestionMapping {
  questionIndex: number;
  questionText: string;
  section: string | null;
  mappedControls: string[];
  confidence: number;
}

export interface GeneratedResponse {
  questionIndex: number;
  questionText: string;
  response: string;
  evidenceRefs: string[];
  mappedControls: string[];
}

export function parseQuestionnaireText(text: string): ParsedQuestion[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const questions: ParsedQuestion[] = [];
  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    // ALL-CAPS section headers (no question mark)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes("?")) {
      currentSection = trimmed;
      continue;
    }
    if (trimmed.length < 10) continue;
    questions.push({ index: questions.length, question: trimmed, section: currentSection });
  }
  return questions;
}

export function mapQuestionsToControls(questions: ParsedQuestion[]): QuestionMapping[] {
  const keywordMap: Record<string, string[]> = {
    "access control": ["CC6.1", "A.9.1.1", "PR.AC-1"],
    mfa: ["CC6.2", "A.9.4.2"],
    "multi-factor": ["CC6.2", "A.9.4.2"],
    authentication: ["CC6.2", "A.9.4.2"],
    termination: ["CC6.3"],
    offboarding: ["CC6.3"],
    provisioning: ["A.9.2.1", "CC6.1"],
    privileged: ["A.9.2.3", "PR.AC-4"],
    "least privilege": ["CC6.1", "PR.AC-4"],
    vulnerability: ["CC7.1", "CC7.2"],
    incident: ["CC7.3"],
    monitoring: ["CC7.2"],
    encryption: ["Art.5(1)(f)"],
    "data protection": ["Art.5(1)(f)", "164.312(a)(1)"],
    hipaa: ["164.312(a)(1)"],
    ephi: ["164.312(a)(1)"],
    gdpr: ["Art.5(1)(f)"],
    logging: ["CC7.1"],
    audit: ["CC7.1", "A.9.2.3"],
    password: ["CC6.2"],
  };

  return questions.map((q) => {
    const lower = q.question.toLowerCase();
    const matched = new Set<string>();
    for (const [keyword, controls] of Object.entries(keywordMap)) {
      if (lower.includes(keyword)) {
        for (const ctrl of controls) matched.add(ctrl);
      }
    }
    return {
      questionIndex: q.index,
      questionText: q.question,
      section: q.section,
      mappedControls: Array.from(matched),
      confidence: matched.size > 0 ? Math.min(1, matched.size * 0.3) : 0,
    };
  });
}

/**
 * Aggregate evidence per control over the last 90 days. Returns a Map from
 * normalized control_id → human-readable summary string.
 */
export async function buildEvidenceSummaries(
  pool: Pool,
  tenantId: string,
): Promise<Map<string, string>> {
  const result = await pool.query<{
    control_id: string;
    evidence_type: string;
    source: string;
    cnt: string;
    last_at: Date | null;
  }>(
    `SELECT control_id, evidence_type, source, COUNT(*)::int AS cnt, MAX(created_at) AS last_at
     FROM compliance_evidence
     WHERE tenant_id = $1
       AND created_at > NOW() - INTERVAL '90 days'
       AND control_id IS NOT NULL
     GROUP BY control_id, evidence_type, source
     ORDER BY control_id`,
    [tenantId],
  );

  const summaries = new Map<string, string>();
  for (const row of result.rows) {
    const existing = summaries.get(row.control_id) ?? "";
    const date = row.last_at ? row.last_at.toISOString().slice(0, 10) : "unknown";
    const fragment = `${row.cnt} ${row.evidence_type.replace(/_/g, " ")} records from ${row.source} (latest: ${date}).`;
    summaries.set(row.control_id, existing ? `${existing} ${fragment}` : fragment);
  }
  return summaries;
}

/**
 * Pull this tenant's previously accepted/edited responses, indexed by control ID,
 * so the AI can maintain consistency across questionnaires.
 */
export async function buildLearningContext(
  pool: Pool,
  tenantId: string,
): Promise<Map<string, string>> {
  const result = await pool.query<{
    response_text: string;
    edited_text: string | null;
    mapped_controls: string;
    feedback: string;
  }>(
    `SELECT response_text, edited_text, mapped_controls, feedback
     FROM questionnaire_responses
     WHERE tenant_id = $1 AND feedback IN ('accepted','edited')
     ORDER BY created_at DESC LIMIT 100`,
    [tenantId],
  );

  const priorAnswers = new Map<string, string>();
  for (const row of result.rows) {
    const finalText =
      row.feedback === "edited" && row.edited_text ? row.edited_text : row.response_text;
    if (!finalText) continue;
    const controls = (row.mapped_controls ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    for (const ctrl of controls) {
      if (!priorAnswers.has(ctrl)) priorAnswers.set(ctrl, finalText);
    }
  }
  return priorAnswers;
}

export async function generateResponses(
  mappings: QuestionMapping[],
  evidenceSummaries: Map<string, string>,
  groqApiKey: string | undefined,
  priorAnswers?: Map<string, string>,
): Promise<GeneratedResponse[]> {
  const responses: GeneratedResponse[] = [];

  for (const mapping of mappings) {
    const evidenceContext: string[] = [];
    const evidenceRefs: string[] = [];
    const priorContext: string[] = [];

    for (const controlId of mapping.mappedControls) {
      const summary = evidenceSummaries.get(controlId);
      if (summary) {
        evidenceContext.push(
          `[${controlId}] ${CONTROL_DESCRIPTIONS[controlId] ?? controlId}: ${summary}`,
        );
        evidenceRefs.push(controlId);
      }
      const priorAnswer = priorAnswers?.get(controlId);
      if (priorAnswer) {
        priorContext.push(
          `Previously accepted answer for ${controlId}: "${priorAnswer.slice(0, 200)}"`,
        );
      }
    }

    let response: string;
    if (groqApiKey && evidenceContext.length > 0) {
      try {
        response = await callGroq(groqApiKey, mapping.questionText, evidenceContext, priorContext);
      } catch (err) {
        console.warn("[questionnaire] groq call failed; falling back", {
          error: (err as Error).message,
        });
        response = generateFallbackResponse(evidenceContext);
      }
    } else {
      response = generateFallbackResponse(evidenceContext);
    }

    responses.push({
      questionIndex: mapping.questionIndex,
      questionText: mapping.questionText,
      response,
      evidenceRefs,
      mappedControls: mapping.mappedControls,
    });
  }
  return responses;
}

function generateFallbackResponse(evidenceContext: string[]): string {
  if (evidenceContext.length === 0) {
    return "This control area has not yet been evaluated. Evidence collection is in progress.";
  }
  return `Yes. Our platform maintains active controls for this area. ${evidenceContext.join(" ")} Evidence is continuously collected and evaluated against our compliance framework.`;
}

async function callGroq(
  apiKey: string,
  question: string,
  evidenceContext: string[],
  priorContext: string[],
): Promise<string> {
  let contextBlock = `Available evidence:\n${evidenceContext.join("\n")}`;
  if (priorContext.length > 0) {
    contextBlock += `\n\nPreviously accepted responses (maintain consistency with these):\n${priorContext.join("\n")}`;
  }

  const systemPrompt = `You are a compliance analyst helping respond to a security questionnaire.
Your responses must be:
1. Grounded in the evidence provided — never fabricate or assume controls exist
2. Concise (2-4 sentences)
3. Professional and factual
4. Reference specific controls when applicable
5. Consistent with previously accepted answers where available

${contextBlock}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Question: ${question}\n\nProvide a compliance-appropriate response based on the available evidence.`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error: ${res.status} ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "Unable to generate response.";
}
