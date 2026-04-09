/**
 * S3-backed evidence repo — replaces R2 atlas-evidence bucket.
 */

import type { S3Client } from "@aws-sdk/client-s3";
import {
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

export class S3EvidenceRepo {
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string,
  ) {}

  async put(key: string, data: Buffer | string, contentType = "application/json"): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: typeof data === "string" ? Buffer.from(data) : data,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return (await result.Body?.transformToString()) ?? null;
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "NoSuchKey") return null;
      throw err;
    }
  }

  async list(prefix: string, maxKeys = 1000): Promise<string[]> {
    const result = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      }),
    );
    return (result.Contents ?? []).map((obj) => obj.Key!);
  }
}
