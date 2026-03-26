export interface OnboardingSession {
  id: string;
  tenant_id: string;
  status: string;
  industry: string | null;
  requirements: string[] | null;
  answers: unknown | null;
  generated_config: unknown | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface RawSessionRow {
  id: string;
  tenant_id: string;
  status: string;
  industry: string | null;
  requirements: string | null;
  answers: string | null;
  generated_config: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

function parseRow(row: RawSessionRow): OnboardingSession {
  return {
    ...row,
    requirements: row.requirements ? JSON.parse(row.requirements) : null,
    answers: row.answers ? JSON.parse(row.answers) : null,
    generated_config: row.generated_config
      ? JSON.parse(row.generated_config)
      : null,
  };
}

export async function createSession(
  db: D1Database,
  tenantId: string,
  industry: string,
  requirements: string[],
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO onboarding_sessions (id, tenant_id, status, industry, requirements, started_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      tenantId,
      "started",
      industry,
      JSON.stringify(requirements),
      now,
      now,
    )
    .run();

  return id;
}

export async function updateSessionStatus(
  db: D1Database,
  sessionId: string,
  status: string,
  data?: Partial<{
    answers: unknown;
    generatedConfig: unknown;
    errorMessage: string;
  }>,
): Promise<void> {
  const now = new Date().toISOString();
  const completedAt =
    status === "completed" || status === "failed" ? now : null;

  await db
    .prepare(
      "UPDATE onboarding_sessions SET status = ?, answers = COALESCE(?, answers), generated_config = COALESCE(?, generated_config), error_message = COALESCE(?, error_message), completed_at = COALESCE(?, completed_at), updated_at = ? WHERE id = ?",
    )
    .bind(
      status,
      data?.answers !== undefined ? JSON.stringify(data.answers) : null,
      data?.generatedConfig !== undefined
        ? JSON.stringify(data.generatedConfig)
        : null,
      data?.errorMessage ?? null,
      completedAt,
      now,
      sessionId,
    )
    .run();
}

export async function getSession(
  db: D1Database,
  sessionId: string,
): Promise<OnboardingSession | null> {
  const result = await db
    .prepare("SELECT * FROM onboarding_sessions WHERE id = ?")
    .bind(sessionId)
    .first<RawSessionRow>();

  return result ? parseRow(result) : null;
}

export async function getSessionByTenant(
  db: D1Database,
  tenantId: string,
): Promise<OnboardingSession | null> {
  const result = await db
    .prepare(
      "SELECT * FROM onboarding_sessions WHERE tenant_id = ? ORDER BY started_at DESC LIMIT 1",
    )
    .bind(tenantId)
    .first<RawSessionRow>();

  return result ? parseRow(result) : null;
}
