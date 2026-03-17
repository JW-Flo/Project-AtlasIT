import type { ADPWorker, SyncResult } from "../types.js";
import { listAllWorkers } from "../client.js";

/**
 * Extract the primary work email from an ADP worker record.
 * Checks businessCommunication first, then person.communication.
 */
function resolveEmail(worker: ADPWorker): string | null {
  const bizEmails = worker.businessCommunication?.emails;
  if (bizEmails?.length) {
    return bizEmails[0].emailUri;
  }

  const personalEmails = worker.person.communication?.emails;
  if (personalEmails?.length) {
    return personalEmails[0].emailUri;
  }

  return null;
}

/**
 * Build a display name from the worker's legal name.
 */
function resolveDisplayName(worker: ADPWorker): string {
  const name = worker.person.legalName;
  if (name.formattedName) return name.formattedName;
  return `${name.givenName} ${name.familyName1}`.trim();
}

/**
 * Derive a normalized status from ADP workerStatus and assignment status.
 * Maps ADP status codes to the directory standard: active | inactive | terminated.
 */
function resolveStatus(worker: ADPWorker): string {
  const statusCode =
    worker.workerStatus?.statusCode?.codeValue?.toLowerCase() ?? "";

  if (statusCode === "terminated" || statusCode === "inactive") {
    return statusCode;
  }

  // Check primary work assignment status
  const primary = worker.workAssignments?.find((a) => a.primaryIndicator);
  const assignmentStatus =
    primary?.assignmentStatus?.statusCode?.codeValue?.toLowerCase() ?? "";

  if (assignmentStatus === "terminated") return "terminated";
  if (assignmentStatus === "inactive") return "inactive";

  return "active";
}

/**
 * Extract department name from the primary work assignment.
 */
function resolveDepartment(worker: ADPWorker): string | null {
  const primary = worker.workAssignments?.find((a) => a.primaryIndicator);
  return (
    primary?.homeOrganizationalUnit?.nameCode?.shortName ??
    primary?.homeOrganizationalUnit?.nameCode?.codeValue ??
    null
  );
}

/**
 * Extract job title from the primary work assignment.
 */
function resolveTitle(worker: ADPWorker): string | null {
  const primary = worker.workAssignments?.find((a) => a.primaryIndicator);
  return primary?.jobTitle ?? null;
}

export async function syncUsers(
  accessToken: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const workers = await listAllWorkers(accessToken);

  for (const worker of workers) {
    const externalId = worker.associateOID;
    const email = resolveEmail(worker);
    const displayName = resolveDisplayName(worker);
    const status = resolveStatus(worker);
    const department = resolveDepartment(worker);
    const title = resolveTitle(worker);

    if (!email) {
      // Skip workers with no email — cannot create a useful directory entry
      continue;
    }

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, externalId)
      .first<{ id: string }>();

    await db
      .prepare(
        `INSERT OR REPLACE INTO directory_users
         (id, tenant_id, external_id, email, display_name, department, title, status, raw_attributes, updated_at)
         VALUES (COALESCE(?, lower(hex(randomblob(16)))), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(
        existing?.id ?? null,
        tenantId,
        externalId,
        email,
        displayName,
        department,
        title,
        status,
        JSON.stringify(worker),
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;
  }

  return { created, updated, total };
}
