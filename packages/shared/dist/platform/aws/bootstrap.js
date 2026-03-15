import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { SSMClient } from "@aws-sdk/client-ssm";
import { EvidenceEmitter } from "../../workflow/evidence-emitter.js";
import {
  DynamoWorkflowRepository,
  DynamoPolicyRepository,
  DynamoSecurityRepository,
  DynamoAuditRepository,
  DynamoAuthRepository,
} from "../../data/dynamodb/index.js";
import { S3EvidenceStore } from "./evidence-store.js";
import { SQSQueueBus } from "./queue-bus.js";
import { SSMSecretResolver } from "./secret-resolver.js";
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const ssmClient = new SSMClient({});
let container = null;
export function bootstrap() {
  if (container) return container;
  const tableName = process.env.TABLE_NAME ?? "atlasit-dev";
  const evidenceBucket = process.env.EVIDENCE_BUCKET ?? "";
  const ssmPrefix = process.env.SSM_PREFIX ?? "/atlasit/dev";
  const queueUrls = {};
  if (process.env.WORKFLOW_QUEUE_URL)
    queueUrls["workflow"] = process.env.WORKFLOW_QUEUE_URL;
  if (process.env.COMPLIANCE_QUEUE_URL)
    queueUrls["compliance"] = process.env.COMPLIANCE_QUEUE_URL;
  if (process.env.SCHEDULER_QUEUE_URL)
    queueUrls["scheduler"] = process.env.SCHEDULER_QUEUE_URL;
  const workflowRepo = new DynamoWorkflowRepository(docClient, tableName);
  const policyRepo = new DynamoPolicyRepository(docClient, tableName);
  const securityRepo = new DynamoSecurityRepository(docClient, tableName);
  const auditRepo = new DynamoAuditRepository(docClient, tableName);
  const authRepo = new DynamoAuthRepository(docClient, tableName);
  const evidenceStore = new S3EvidenceStore(s3Client, evidenceBucket);
  const evidenceEmitter = new EvidenceEmitter(evidenceStore);
  const queueBus = new SQSQueueBus(sqsClient, queueUrls);
  const secretResolver = new SSMSecretResolver(ssmClient, ssmPrefix);
  container = {
    workflowRepo,
    policyRepo,
    securityRepo,
    auditRepo,
    authRepo,
    evidenceStore,
    evidenceEmitter,
    queueBus,
    secretResolver,
  };
  return container;
}
//# sourceMappingURL=bootstrap.js.map
