/**
 * Cloudflare R2 adapter for EvidenceStore interface.
 *
 * Content-addressed immutable evidence objects stored in R2.
 * Path layout: evidence/<tenantId>/<runId>/<stepId>/<hash>.json
 *
 * Writes are idempotent: if the key already exists, the write is a no-op.
 */

import type {
  EvidenceStore,
  EvidenceWriteResult,
  EvidenceReadResult,
} from "../interfaces.js";

/**
 * Minimal subset of the Cloudflare R2 bucket interface.
 * Avoids leaking @cloudflare/workers-types into the interface boundary.
 */
interface R2BucketSubset {
  head(key: string): Promise<{ key: string } | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<{ text(): Promise<string> } | null>;
}

export class CloudflareEvidenceStore implements EvidenceStore {
  private readonly bucket: R2BucketSubset;
  private readonly bucketName: string;

  constructor(bucket: R2BucketSubset, bucketName = "evidence") {
    this.bucket = bucket;
    this.bucketName = bucketName;
  }

  async exists(key: string): Promise<boolean> {
    const head = await this.bucket.head(key);
    return head !== null;
  }

  async put(
    tenantId: string,
    runId: string,
    stepId: string,
    hash: string,
    body: string,
  ): Promise<EvidenceWriteResult> {
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

  async get(key: string): Promise<EvidenceReadResult | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    const body = await obj.text();
    return { body };
  }
}
