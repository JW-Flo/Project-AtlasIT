import { encrypt, decrypt } from "./crypto";
const KEY_VERSION = 1;
export async function storeCredential(db, masterKey, input) {
  const plaintext = JSON.stringify(input.credentials);
  const { ciphertext, iv } = await encrypt(plaintext, masterKey);
  // Store ciphertext + iv as a JSON envelope in the credentials column
  const envelope = JSON.stringify({ enc: ciphertext, iv, v: KEY_VERSION });
  const result = await db
    .prepare(
      `INSERT INTO app_credentials (tenant_id, app_id, credentials)
       VALUES (?, ?, ?)
       ON CONFLICT(tenant_id, app_id) DO UPDATE SET
         credentials = excluded.credentials,
         updated_at = datetime('now')
       RETURNING id`,
    )
    .bind(input.tenantId, input.appId, envelope)
    .first();
  if (!result) {
    throw new Error("Failed to store credential");
  }
  return result.id;
}
export async function getCredential(db, masterKey, tenantId, appId) {
  const row = await db
    .prepare(
      "SELECT credentials FROM app_credentials WHERE tenant_id = ? AND app_id = ?",
    )
    .bind(tenantId, appId)
    .first();
  if (!row) return null;
  const envelope = JSON.parse(row.credentials);
  const plaintext = await decrypt(envelope.enc, envelope.iv, masterKey);
  return JSON.parse(plaintext);
}
export async function deleteCredential(db, tenantId, appId) {
  await db
    .prepare("DELETE FROM app_credentials WHERE tenant_id = ? AND app_id = ?")
    .bind(tenantId, appId)
    .run();
}
export async function listCredentials(db, tenantId) {
  const results = await db
    .prepare(
      "SELECT id, app_id, healthy, updated_at FROM app_credentials WHERE tenant_id = ?",
    )
    .bind(tenantId)
    .all();
  return results.results.map((row) => ({
    id: row.id,
    appId: row.app_id,
    healthy: row.healthy === 1,
    updatedAt: row.updated_at,
  }));
}
export async function rotateCredential(
  db,
  masterKey,
  tenantId,
  appId,
  newCredentials,
) {
  const existing = await db
    .prepare(
      "SELECT id FROM app_credentials WHERE tenant_id = ? AND app_id = ?",
    )
    .bind(tenantId, appId)
    .first();
  if (!existing) {
    throw new Error("Credential not found");
  }
  const plaintext = JSON.stringify(newCredentials);
  const { ciphertext, iv } = await encrypt(plaintext, masterKey);
  const envelope = JSON.stringify({ enc: ciphertext, iv, v: KEY_VERSION });
  await db
    .prepare(
      `UPDATE app_credentials
       SET credentials = ?, updated_at = datetime('now')
       WHERE tenant_id = ? AND app_id = ?`,
    )
    .bind(envelope, tenantId, appId)
    .run();
}
//# sourceMappingURL=store.js.map
