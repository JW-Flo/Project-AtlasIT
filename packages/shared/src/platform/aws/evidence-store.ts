import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import type {
  EvidenceStore,
  EvidenceWriteResult,
  EvidenceReadResult,
} from "../interfaces.js";

export class S3EvidenceStore implements EvidenceStore {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: `sha256/${key}` }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async put(
    tenantId: string,
    runId: string,
    stepId: string,
    hash: string,
    body: string,
  ): Promise<EvidenceWriteResult> {
    const key = `sha256/${hash}`;
    const alreadyExists = await this.exists(hash);
    if (!alreadyExists) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: "application/json",
          Metadata: { tenantid: tenantId, runid: runId, stepid: stepId },
        }),
      );
    }
    return { key, uri: `s3://${this.bucket}/${key}`, alreadyExists };
  }

  async get(key: string): Promise<EvidenceReadResult | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: `sha256/${key}`,
        }),
      );
      const body = await result.Body?.transformToString();
      if (!body) return null;
      return { body };
    } catch {
      return null;
    }
  }
}
