import { S3Client } from "@aws-sdk/client-s3";
import type {
  EvidenceStore,
  EvidenceWriteResult,
  EvidenceReadResult,
} from "../interfaces.js";
export declare class S3EvidenceStore implements EvidenceStore {
  private readonly client;
  private readonly bucket;
  constructor(client: S3Client, bucket: string);
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
//# sourceMappingURL=evidence-store.d.ts.map
