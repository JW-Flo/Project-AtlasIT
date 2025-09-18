import { createHash } from "node:crypto";

export interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
}

export interface S3ClientLike {
  putObject(params: {
    Bucket: string;
    Key: string;
    Body: Buffer | Uint8Array | string;
    ContentType?: string;
    Metadata?: Record<string, string>;
  }): Promise<unknown>;
}

export interface EvidenceWriteOptions {
  /** Optional HTTP metadata applied to the primary R2 object. */
  contentType?: string;
  /** Per-object metadata stored alongside the evidence objects. */
  metadata?: Record<string, string>;
  /** Dual write target (S3 style client + bucket name). */
  s3?: {
    client: S3ClientLike;
    bucket: string;
  };
}

export interface EvidenceWriteResult {
  key: string;
  size: number;
}

function toUint8Array(data: string | ArrayBuffer | Uint8Array): Uint8Array {
  if (typeof data === "string") {
    return new TextEncoder().encode(data);
  }
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Persist evidence payloads into R2 (and optionally to S3) using a sha256 key.
 */
export async function putEvidence(
  bucket: R2BucketLike,
  data: string | ArrayBuffer | Uint8Array,
  options: EvidenceWriteOptions = {},
): Promise<EvidenceWriteResult> {
  const body = toUint8Array(data);
  const key = sha256(body);

  await bucket.put(key, body, {
    httpMetadata: options.contentType ? { contentType: options.contentType } : undefined,
    customMetadata: options.metadata,
  });

  if (options.s3) {
    await options.s3.client.putObject({
      Bucket: options.s3.bucket,
      Key: key,
      Body: Buffer.from(body),
      ContentType: options.contentType,
      Metadata: options.metadata,
    });
  }

  return { key, size: body.byteLength };
}
