// Helper: builds the canonical Lambda environment JSON from env vars.
// Usage: DB_URL=... IAK=... node scripts/build-lambda-env.js
const env = {
  NODE_ENV: process.env.NODE_ENV_VAL || "dev",
  AWS_REGION_APP: process.env.REGION || "us-east-1",
  EVIDENCE_BUCKET: process.env.EVIDENCE_BUCKET,
  POLICIES_BUCKET: process.env.POLICIES_BUCKET,
  ARTIFACTS_BUCKET: process.env.ARTIFACTS_BUCKET,
  IDEMPOTENCY_TABLE: process.env.IDEMPOTENCY_TABLE,
  SESSIONS_TABLE: process.env.SESSIONS_TABLE,
  CACHE_TABLE: process.env.CACHE_TABLE,
  FLAGS_TABLE: process.env.FLAGS_TABLE,
  EVENT_BUS_NAME: process.env.EVENT_BUS_NAME,
  SQS_STEP_TASKS_URL: process.env.SQS_STEP_TASKS_URL,
  SSM_PREFIX: process.env.SSM_PREFIX,
  DATABASE_URL: process.env.DB_URL,
  INTERNAL_API_KEY: process.env.IAK,
  WEBHOOK_SECRET: process.env.WHS,
  CRED_ENCRYPTION_KEY: process.env.CEK,
  ADMIN_SETUP_TOKEN: process.env.AST,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  STRIPE_API_KEY: process.env.STRIPE_API_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};
// Remove undefined/empty/PLACEHOLDER values
const clean = {};
for (const [k, v] of Object.entries(env)) {
  if (v && v !== "PLACEHOLDER") clean[k] = v;
}
process.stdout.write(JSON.stringify({ Variables: clean }));
