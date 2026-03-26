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
  head(key: string): Promise<{
    key: string;
  } | null>;
  put(
    key: string,
    value: string | ArrayBuffer | ReadableStream,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  get(key: string): Promise<{
    text(): Promise<string>;
  } | null>;
}
export declare class CloudflareEvidenceStore implements EvidenceStore {
  private readonly bucket;
  private readonly bucketName;
  constructor(bucket: R2BucketSubset, bucketName?: string);
  exists(key: string): Promise<boolean>;
  put(
    tenantId: string,
    runId: string,
    stepId: string,
    hash: string,
    body: string,
  ): Promise<EvidenceWriteResult>;
  get(key: string): Promise<EvidenceReadResult | null>;
}
export {};
//# sourceMappingURL=evidence-store.d.ts.map
