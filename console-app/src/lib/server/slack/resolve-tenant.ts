/**
 * Resolve a Slack team_id to an AtlasIT tenant_id via the OAuth token store.
 *
 * Slack's OAuth response (stored in app_oauth_tokens.raw_response) contains
 * either `{ team: { id } }` (user tokens) or `{ team_id }` (bot tokens).
 */
export async function resolveSlackTenant(db: D1Database, teamId: string): Promise<string | null> {
  if (!db) return null;

  const { results } = await db
    .prepare(`SELECT tenant_id, raw_response FROM app_oauth_tokens WHERE app_id = 'slack'`)
    .bind()
    .all<{ tenant_id: string; raw_response: string }>();

  for (const row of results) {
    try {
      const raw = JSON.parse(row.raw_response);
      const storedTeamId = raw?.team?.id ?? raw?.team_id;
      if (storedTeamId === teamId) {
        return row.tenant_id;
      }
    } catch {
      // Malformed JSON — skip this row
    }
  }

  return null;
}
