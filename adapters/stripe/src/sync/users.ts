import type { SyncResult, StripeCustomer, StripePerson } from "../types.js";
import {
  listCustomers,
  listAccounts,
  listPersons,
} from "../client.js";

function buildCustomerDisplayName(customer: StripeCustomer): string {
  return customer.name ?? customer.email ?? customer.id;
}

async function upsertCustomer(
  db: D1Database,
  tenantId: string,
  customer: StripeCustomer,
): Promise<"created" | "updated"> {
  const externalId = `cus:${customer.id}`;
  const displayName = buildCustomerDisplayName(customer);

  const existing = await db
    .prepare(
      "SELECT id FROM directory_users WHERE tenant_id = ?1 AND external_id = ?2",
    )
    .bind(tenantId, externalId)
    .first<{ id: string }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE directory_users
         SET email = ?1, display_name = ?2, department = ?3, title = ?4,
             status = ?5, raw_attributes = ?6, updated_at = datetime('now')
         WHERE tenant_id = ?7 AND external_id = ?8`,
      )
      .bind(
        customer.email,
        displayName,
        "billing",
        customer.delinquent ? "delinquent" : "active",
        "active",
        JSON.stringify({
          customer_id: customer.id,
          name: customer.name,
          phone: customer.phone,
          description: customer.description,
          currency: customer.currency,
          delinquent: customer.delinquent,
          created: customer.created,
          metadata: customer.metadata,
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
      customer.email,
      displayName,
      "billing",
      customer.delinquent ? "delinquent" : "active",
      "active",
      JSON.stringify({
        customer_id: customer.id,
        name: customer.name,
        phone: customer.phone,
        description: customer.description,
        currency: customer.currency,
        delinquent: customer.delinquent,
        created: customer.created,
        metadata: customer.metadata,
      }),
    )
    .run();
  return "created";
}

function buildPersonDisplayName(person: StripePerson): string {
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
  const externalId = `acct:${accountId}:${person.id}`;
  const displayName = buildPersonDisplayName(person);
  const title = mapPersonTitle(person);

  const existing = await db
    .prepare(
      "SELECT id FROM directory_users WHERE tenant_id = ?1 AND external_id = ?2",
    )
    .bind(tenantId, externalId)
    .first<{ id: string }>();

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
        "connect",
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
      "connect",
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

export async function syncUsers(
  db: D1Database,
  secretKey: string,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  // Sync Stripe Customers as directory users (primary billing context)
  const customers = await listCustomers(secretKey);

  for (const customer of customers) {
    const result = await upsertCustomer(db, tenantId, customer);
    if (result === "created") created++;
    else updated++;
    total++;
  }

  // Sync Connected Account Persons as secondary directory users
  let accounts: Awaited<ReturnType<typeof listAccounts>>;
  try {
    accounts = await listAccounts(secretKey);
  } catch {
    // Platform accounts may not have Connect enabled; skip person sync
    accounts = [];
  }

  for (const account of accounts) {
    let persons: StripePerson[];
    try {
      persons = await listPersons(secretKey, account.id);
    } catch {
      // Some account types don't support person listing
      continue;
    }

    for (const person of persons) {
      const result = await upsertPerson(db, tenantId, person, account.id);
      if (result === "created") created++;
      else updated++;
      total++;
    }
  }

  return { created, updated, total };
}
