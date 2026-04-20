/**
 * AWS Lambda bootstrap — provides service dependencies (repos, clients)
 * equivalent to Cloudflare Worker env bindings.
 *
 * Lazily initializes connections on first call; reuses across warm invocations.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

import { DynamoSessionRepo } from "./repos/session-repo.js";
import { DynamoCacheRepo } from "./repos/cache-repo.js";
import { DynamoFlagRepo } from "./repos/flag-repo.js";
import { PgAuditRepo } from "./repos/audit-repo.js";
import { PgTenantRepo } from "./repos/tenant-repo.js";
import { S3EvidenceRepo } from "./repos/evidence-repo.js";
import { SqsQueueRepo } from "./repos/queue-repo.js";
import { LambdaAuthRepo } from "../../auth/lambda-auth-repo.js";

export interface ServiceContainer {
  ddb: DynamoDBDocumentClient;
  s3: S3Client;
  sqs: SQSClient;
  eventBridge: EventBridgeClient;
  sessionRepo: DynamoSessionRepo;
  cacheRepo: DynamoCacheRepo;
  flagRepo: DynamoFlagRepo;
  auditRepo: PgAuditRepo;
  tenantRepo: PgTenantRepo;
  evidenceRepo: S3EvidenceRepo;
  queueRepo: SqsQueueRepo;
  authRepo: LambdaAuthRepo;
}

let _container: ServiceContainer | null = null;

const env = (key: string, fallback?: string): string => {
  const val = process.env[key] ?? fallback;
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
};

export function bootstrap(): ServiceContainer {
  if (_container) return _container;

  const region = env("AWS_REGION_APP", "us-east-1");

  const ddbRaw = new DynamoDBClient({ region });
  const ddb = DynamoDBDocumentClient.from(ddbRaw, {
    marshallOptions: { removeUndefinedValues: true },
  });

  const s3 = new S3Client({ region });
  const sqs = new SQSClient({ region });
  const eventBridge = new EventBridgeClient({ region });

  const sessionRepo = new DynamoSessionRepo(ddb, env("SESSIONS_TABLE"));
  const cacheRepo = new DynamoCacheRepo(ddb, env("CACHE_TABLE"));
  const flagRepo = new DynamoFlagRepo(ddb, env("FLAGS_TABLE"));
  const auditRepo = new PgAuditRepo(); // uses DATABASE_URL env
  const tenantRepo = new PgTenantRepo(); // uses DATABASE_URL env
  const evidenceRepo = new S3EvidenceRepo(s3, env("EVIDENCE_BUCKET"));
  const queueRepo = new SqsQueueRepo(sqs, env("SQS_STEP_TASKS_URL"));
  const authRepo = new LambdaAuthRepo(sessionRepo);

  _container = {
    ddb,
    s3,
    sqs,
    eventBridge,
    sessionRepo,
    cacheRepo,
    flagRepo,
    auditRepo,
    tenantRepo,
    evidenceRepo,
    queueRepo,
    authRepo,
  };

  return _container;
}

// Secret caching (warm Lambda reuse) — uses SSM SecureString (free) instead of Secrets Manager ($0.40/secret/mo)
// Cache TTL: 5 minutes (supports key rotation without Lambda redeploy)
interface CachedSecret {
  value: string;
  fetchedAt: number;
}
const _secretCache = new Map<string, CachedSecret>();
const ssmClient = new SSMClient({});
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getSecret(name: string): Promise<string> {
  const cached = _secretCache.get(name);
  const now = Date.now();

  // Return cached value if still fresh (within TTL)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  const prefix = process.env.SSM_PREFIX ?? "/atlasit/dev";
  const result = await ssmClient.send(
    new GetParameterCommand({ Name: `${prefix}/secrets/${name}`, WithDecryption: true }),
  );
  const value = result.Parameter?.Value;
  if (!value) throw new Error(`Secret ${prefix}/secrets/${name} not found in SSM`);

  _secretCache.set(name, { value, fetchedAt: now });
  return value;
}
