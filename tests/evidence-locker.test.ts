import { describe, expect, it } from "vitest";
import { putEvidence, R2BucketLike, EvidenceWriteOptions } from "../src/lib/evidence";

class MockR2Bucket implements R2BucketLike {
  store = new Map<string, { value: Uint8Array; options?: any }>();

  async put(key: string, value: ArrayBuffer | ArrayBufferView | ReadableStream | Blob | string, options?: any) {
    if (typeof value === "string") {
      throw new Error("MockR2Bucket expects binary payloads");
    }
    const array = value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer);
    this.store.set(key, { value: array, options });
  }
}

class MockS3Client {
  writes: Array<{ params: any }> = [];

  async putObject(params: any) {
    this.writes.push({ params });
  }
}

describe("evidence locker", () => {
  it("stores payload in R2 with sha256 key", async () => {
    const bucket = new MockR2Bucket();
    const payload = "hello-world";

    const result = await putEvidence(bucket, payload, {
      contentType: "text/plain",
      metadata: { policy: "baseline" },
    });

    expect(result.key).toHaveLength(64);
    const stored = bucket.store.get(result.key);
    expect(stored).toBeDefined();
    expect(new TextDecoder().decode(stored!.value)).toBe(payload);
    expect(stored!.options.httpMetadata.contentType).toBe("text/plain");
    expect(stored!.options.customMetadata.policy).toBe("baseline");
  });

  it("dual writes to s3 when configured", async () => {
    const bucket = new MockR2Bucket();
    const s3 = new MockS3Client();

    const options: EvidenceWriteOptions = {
      contentType: "application/json",
      s3: { client: s3 as any, bucket: "evidence-bucket" },
    };

    const payload = JSON.stringify({ case: "dual" });
    const result = await putEvidence(bucket, payload, options);

    expect(bucket.store.has(result.key)).toBe(true);
    expect(s3.writes).toHaveLength(1);
    const write = s3.writes[0].params;
    expect(write.Key).toBe(result.key);
    expect(write.Bucket).toBe("evidence-bucket");
    expect(write.ContentType).toBe("application/json");
    expect(Buffer.isBuffer(write.Body)).toBe(true);
  });

  it("accepts Uint8Array payloads", async () => {
    const bucket = new MockR2Bucket();
    const bytes = new TextEncoder().encode("binary");

    const result = await putEvidence(bucket, bytes);
    expect(bucket.store.get(result.key)?.value.byteLength).toBe(bytes.byteLength);
  });
});
