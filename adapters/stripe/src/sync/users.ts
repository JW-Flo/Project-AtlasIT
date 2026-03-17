import type { SyncResult, StripePerson } from "../types.js";
import { listAccounts, listPersons } from "../client.js";

function buildDisplayName(person: StripePerson): string {
  const parts = [person.first_name, person.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : (person.email ?? person.id);
}

function mapPersonTitle(person: StripePerson): string | null {
  if (person.relationship?.title) {
    return person.relationship.title;
  }
  const roles: string[] = [];
  if (person.relationship?.representative) roles.push("Representative");
  if (person.relationship?.director) roles.push("Director");
  if (person.relationship?.executive) roles.push("Executive");
  if (person.relationship?.owner) roles.push("Owner");
  return roles.length > 0 ? roles.join(", ") : null;
}

async function upsertPerson(
  db: D1Database,
  tenantId: string,
  person: StripePerson,
  accountId: string,
): Promise<"created" | "updated"> {
  const externalId = `${accountId}:${person.id}`;
  const displayName = buildDisplayName(person);
  const title = mapPersonTitle(person);

  const existing = await db
    .prepare(
      "SELECT id FROM directory_users WHERE tenant_id = ?1 AND external_id = ?2",
    )
    .bind(tenantId, externalId)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE directory_users
         SET email = ?1, display_name = ?2, department = ?3, title = ?4,
             status = ?5, raw_attributes = ?6, updated_at = datetime('now')
         WHERE tenant_id = ?7 AND external_id = ?8`,
      )
      .bind(
        person.email,
        displayName,
        null, // Stripe persons don't have departments
        title,
        "active",
        JSON.stringify({
          account_id: accountId,
          person_id: person.id,
          first_name: person.first_name,
          last_name: person.last_name,
          phone: person.phone,
          relationship: person.relationship,
          metadata: person.metadata,
        }),
        tenantId,
        externalId,
      )
      .run();
    return "updated";
  }

  await db
    .prepare(
      `INSERT INTO directory_users (tenant_id, external_id, email, display_name, department, title, status, raw_attributes)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(
      tenantId,
      externalId,
      person.email,
      displayName,
      null,
      title,
      "active",
      JSON.stringify({
        account_id: accountId,
        person_id: person.id,
        first_name: person.first_name,
        last_name: person.last_name,
        phone: person.phone,
        relationship: person.relationship,
        metadata: person.metadata,
      }),
    )
    .run();
  return "created";
}

async function updateConnectionStatus(
  db: D1Database,
  tenantId: string,
  userCount: number,
  error?: string,
): Promise<void> {
  const existing = await db
    .prepare("SELECT id FROM directory_connections WHERE tenant_id = ?1")
    .bind(tenantId)
    .first();

  if (existing) {
    await db
      .prepare(
        `UPDATE directory_connections
         SET status = ?1, error_msg = ?2, last_sync_at = datetime('now'),
             user_count = ?3, group_count = 0, updated_at = datetime('now')
         WHERE tenant_id = ?4`,
      )
      .bind(error ? "error" : "active", error ?? null, userCount, tenantId)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO directory_connections (tenant_id, provider, status, error_msg, last_sync_at, user_count, group_count)
         VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5, 0)`,
      )
      .bind(
        tenantId,
        "stripe",
        error ? "error" : "active",
        error ?? null,
        userCount,
      )
      .run();
  }
}

export async function syncPersons(
  db: D1Database,
  secretKey: string,
  tenantId: string,
): Promise<SyncResult> {
  try {
    const accounts = await listAccounts(secretKey);

    let created = 0;
    let updated = 0;
    let total = 0;

    for (const account of accounts) {
      let persons: StripePerson[];
      try {
        persons = await listPersons(secretKey, account.id);
      } catch (err) {
        // Some account types (e.g. Standard) don't support person listing.
        // Skip rather than fail the entire sync.
        console.log(
          JSON.stringify({
            level: "warn",
            message: "Skipping account — cannot list persons",
            accountId: account.id,
            error: err instanceof Error ? err.message : "Unknown error",
          }),
        );
        continue;
      }

      for (const person of persons) {
        const result = await upsertPerson(db, tenantId, person, account.id);
        if (result === "created") created++;
        else updated++;
        total++;
      }
    }

    await updateConnectionStatus(db, tenantId, total);

    return {
      users: { created, updated, total },
      accounts: accounts.length,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown sync error";
    await updateConnectionStatus(db, tenantId, 0, errorMsg);
    throw err;
  }
}
