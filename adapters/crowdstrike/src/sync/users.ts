import type { CrowdStrikeUser, CrowdStrikeDevice, SyncResult } from "../types.js";
import {
  authenticate,
  listUserIds,
  getUserDetails,
  listDeviceIds,
  getDeviceDetails,
} from "../client.js";

/**
 * Sync CrowdStrike console users into directory_users.
 * Also syncs devices as "user" records with device_id as external_id,
 * since CrowdStrike is primarily a device-centric platform.
 */
export async function syncUsers(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  db: D1Database,
  tenantId: string,
): Promise<SyncResult> {
  let created = 0;
  let updated = 0;
  let total = 0;

  const accessToken = await authenticate(clientId, clientSecret, baseUrl);

  // -- Sync console users --
  const userIds = await listUserIds(accessToken, baseUrl);
  const users = await getUserDetails(userIds, accessToken, baseUrl);

  for (const user of users) {
    const displayName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ") || user.uid;

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, user.uid)
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
        user.uid,
        user.uid, // uid is the email for CrowdStrike console users
        displayName,
        null,
        null,
        "active",
        JSON.stringify(user),
      )
      .run();

    if (existing) {
      updated++;
    } else {
      created++;
    }
    total++;
  }

  // -- Sync devices as directory entries --
  const deviceIds = await listDeviceIds(accessToken, baseUrl);
  const devices = await getDeviceDetails(deviceIds, accessToken, baseUrl);

  for (const device of devices) {
    const deviceStatus = mapDeviceStatus(device);

    const existing = await db
      .prepare(
        "SELECT id FROM directory_users WHERE tenant_id = ? AND external_id = ?",
      )
      .bind(tenantId, `device:${device.device_id}`)
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
        `device:${device.device_id}`,
        null, // devices don't have email
        device.hostname || device.device_id,
        device.platform_name ?? null, // use platform as "department"
        device.os_version ?? null, // use OS version as "title"
        deviceStatus,
        JSON.stringify(device),
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

function mapDeviceStatus(device: CrowdStrikeDevice): string {
  if (!device.status) return "unknown";

  switch (device.status.toLowerCase()) {
    case "normal":
    case "contained":
      return "active";
    case "containment_pending":
    case "lift_containment_pending":
      return "suspended";
    default:
      return device.status.toLowerCase();
  }
}
