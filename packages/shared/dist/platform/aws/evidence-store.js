import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
export class S3EvidenceStore {
  client;
  bucket;
  constructor(client, bucket) {
    this.client = client;
    this.bucket = bucket;
  }
  async exists(key) {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: `sha256/${key}` }),
      );
      return true;
    } catch {
      return false;
    }
  }
  async put(tenantId, runId, stepId, hash, body) {
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
  async get(key) {
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
//# sourceMappingURL=evidence-store.js.map
