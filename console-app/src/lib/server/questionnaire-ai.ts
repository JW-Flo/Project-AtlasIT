/**
 * Questionnaire AI — maps security questionnaire questions to CDT controls
 * and generates evidence-backed responses using Groq.
 */

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

export interface QuestionMapping {
  questionIndex: number;
  questionText: string;
  section: string | null;
  mappedControls: string[];
  confidence: number;
}

interface GeneratedResponse {
  questionIndex: number;
  response: string;
  evidenceRefs: string[];
  mappedControls: string[];
}

/**
 * Parse a questionnaire CSV/text into structured questions.
 */
export function parseQuestionnaireText(text: string): Array<{
  index: number;
  question: string;
  section: string | null;
}> {
  const lines = text.split("\n").filter((l) => l.trim());
  const questions: Array<{ index: number; question: string; section: string | null }> = [];
  let currentSection: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers (all caps, no question mark)
    if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes("?")) {
      currentSection = trimmed;
      continue;
    }

    // Skip very short lines
    if (trimmed.length < 10) continue;

    questions.push({
      index: questions.length,
      question: trimmed,
      section: currentSection,
    });
  }

  return questions;
}

/**
 * Map questions to CDT controls using keyword matching.
 * This is a deterministic first pass — AI refines in generation step.
 */
export function mapQuestionsToControls(
  questions: Array<{ index: number; question: string; section: string | null }>,
): QuestionMapping[] {
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
 * Generate AI-backed responses for mapped questions.
 * Uses evidence summaries from the compliance_evidence table.
 */
export async function generateResponses(
  mappings: QuestionMapping[],
  evidenceSummaries: Map<string, string>,
  groqApiKey?: string,
): Promise<GeneratedResponse[]> {
  const responses: GeneratedResponse[] = [];

  for (const mapping of mappings) {
    const evidenceContext: string[] = [];
    const evidenceRefs: string[] = [];

    for (const controlId of mapping.mappedControls) {
      const summary = evidenceSummaries.get(controlId);
      if (summary) {
        evidenceContext.push(
          `[${controlId}] ${CONTROL_DESCRIPTIONS[controlId] ?? controlId}: ${summary}`,
        );
        evidenceRefs.push(controlId);
      }
    }

    let response: string;

    if (groqApiKey && evidenceContext.length > 0) {
      try {
        response = await callGroq(groqApiKey, mapping.questionText, evidenceContext);
      } catch {
        response = generateFallbackResponse(mapping, evidenceContext);
      }
    } else {
      response = generateFallbackResponse(mapping, evidenceContext);
    }

    responses.push({
      questionIndex: mapping.questionIndex,
      response,
      evidenceRefs,
      mappedControls: mapping.mappedControls,
    });
  }

  return responses;
}

function generateFallbackResponse(mapping: QuestionMapping, evidenceContext: string[]): string {
  if (evidenceContext.length === 0) {
    return "This control area has not yet been evaluated. Evidence collection is in progress.";
  }

  return `Yes. Our platform maintains active controls for this area. ${evidenceContext.join(" ")} Evidence is continuously collected and evaluated against our compliance framework.`;
}

async function callGroq(
  apiKey: string,
  question: string,
  evidenceContext: string[],
): Promise<string> {
  const systemPrompt = `You are a compliance analyst helping respond to a security questionnaire.
Your responses must be:
1. Grounded in the evidence provided — never fabricate or assume controls exist
2. Concise (2-4 sentences)
3. Professional and factual
4. Reference specific controls when applicable

Available evidence:
${evidenceContext.join("\n")}`;

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
    throw new Error(`Groq API error: ${res.status}`);
  }

  const data = (await res.json()) as any;
  return data.choices?.[0]?.message?.content ?? "Unable to generate response.";
}

/**
 * Build evidence summaries per control from D1 compliance_evidence.
 */
export async function buildEvidenceSummaries(
  db: any,
  tenantId: string,
): Promise<Map<string, string>> {
  const { results } = await db
    .prepare(
      `SELECT control_id, evidence_type, source, COUNT(*) AS cnt, MAX(created_at) AS last_at
       FROM compliance_evidence
       WHERE tenant_id = ?
       GROUP BY control_id, evidence_type
       ORDER BY control_id`,
    )
    .bind(tenantId)
    .all<{
      control_id: string;
      evidence_type: string;
      source: string;
      cnt: number;
      last_at: string;
    }>();

  const summaries = new Map<string, string>();

  for (const row of results ?? []) {
    const existing = summaries.get(row.control_id) ?? "";
    const fragment = `${row.cnt} ${row.evidence_type.replace(/_/g, " ")} records from ${row.source} (latest: ${row.last_at?.slice(0, 10) ?? "unknown"}).`;
    summaries.set(row.control_id, existing ? `${existing} ${fragment}` : fragment);
  }

  return summaries;
}
