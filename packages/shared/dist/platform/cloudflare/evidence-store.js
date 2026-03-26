/**
 * Cloudflare R2 adapter for EvidenceStore interface.
 *
 * Content-addressed immutable evidence objects stored in R2.
 * Path layout: evidence/<tenantId>/<runId>/<stepId>/<hash>.json
 *
 * Writes are idempotent: if the key already exists, the write is a no-op.
 */
export class CloudflareEvidenceStore {
  bucket;
  bucketName;
  constructor(bucket, bucketName = "evidence") {
    this.bucket = bucket;
    this.bucketName = bucketName;
  }
  async exists(key) {
    const head = await this.bucket.head(key);
    return head !== null;
  }
  async put(tenantId, runId, stepId, hash, body) {
    const key = `evidence/${tenantId}/${runId}/${stepId}/${hash}.json`;
    const alreadyExists = await this.exists(key);
    if (!alreadyExists) {
      await this.bucket.put(key, body, {
        httpMetadata: { contentType: "application/json" },
        customMetadata: { tenantId, runId, stepId, hash },
      });
    }
    return {
      key,
      uri: `r2://${this.bucketName}/${key}`,
      alreadyExists,
    };
  }
  async get(key) {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    const body = await obj.text();
    return { body };
  }
}
//# sourceMappingURL=evidence-store.js.map
