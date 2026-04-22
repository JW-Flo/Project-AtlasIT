async function resolveSlackTenant(db, teamId) {
  if (!db) return null;
  const { results } = await db.prepare(`SELECT tenant_id, raw_response FROM app_oauth_tokens WHERE app_id = 'slack'`).bind().all();
  for (const row of results) {
    try {
      const raw = JSON.parse(row.raw_response);
      const storedTeamId = raw?.team?.id ?? raw?.team_id;
      if (storedTeamId === teamId) {
        return row.tenant_id;
      }
    } catch {
    }
  }
  return null;
}

export { resolveSlackTenant as r };
//# sourceMappingURL=resolve-tenant-D40mFDr1.js.map
