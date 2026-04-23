/**
 * onboarding-api Lambda routes
 *
 * Ported from onboarding/src/ (Cloudflare Worker).
 * Uses bootstrap() service container instead of Cloudflare env bindings.
 *
 * Key translations:
 *   env.DB.prepare(...)     → pg pool (onboarding sessions)
 *   env.KV_SESSIONS         → svc.sessionRepo (session state)
 */

import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";
import {
  generateSyntheticEvidence,
  insertSyntheticEvidence,
} from "@atlasit/shared/onboarding/synthetic-evidence.js";
import crypto from "crypto";
import pg from "pg";
import bcrypt from "bcryptjs";
import { getPool } from "@atlasit/shared/platform/aws/repos/pg-pool.js";

const svc = bootstrap();

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function ok(body: unknown, status = 200): APIGatewayProxyResultV2 {
  return { statusCode: status, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

// Insert into events + enqueue SQS (orchestrator picks it up for automation).
async function publishEvent(
  tenantId: string,
  type: string,
  source: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.query(
      `INSERT INTO events (id, tenant_id, type, source, payload, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
      [id, tenantId, type, source, JSON.stringify(payload)],
    );
    await svc.queueRepo.send({
      tenantId,
      workflowRunId: id,
      stepIndex: 0,
      action: "process_event",
      payload: { eventId: id, type, source, data: payload },
    });
  } catch (err) {
    console.warn("[onboarding-api] publishEvent failed", {
      type,
      source,
      error: (err as Error).message,
    });
  }
}

function fail(status: number, message: string, code = "ERROR"): APIGatewayProxyResultV2 {
  return {
    statusCode: status,
    headers: JSON_HEADERS,
    body: JSON.stringify({ status: "error", code, message, timestamp: new Date().toISOString() }),
  };
}

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ── Question generation ────────────────────────────────────────────────────
// Industry-specific onboarding questions (ported from onboarding/src/handlers/onboarding.ts)

const BASE_QUESTIONS: Array<{ id: string; text: string; type: string; required: boolean }> = [
  { id: "company_name", text: "What is your company name?", type: "text", required: true },
  {
    id: "employee_count",
    text: "How many employees does your company have?",
    type: "number",
    required: true,
  },
  {
    id: "primary_use_case",
    text: "What is your primary use case for AtlasIT?",
    type: "select",
    required: true,
  },
  {
    id: "current_tools",
    text: "What IT tools are you currently using?",
    type: "multiselect",
    required: false,
  },
  {
    id: "compliance_frameworks",
    text: "Which compliance frameworks are you targeting?",
    type: "multiselect",
    required: false,
  },
];

const INDUSTRY_QUESTIONS: Record<
  string,
  Array<{ id: string; text: string; type: string; required: boolean }>
> = {
  healthcare: [
    {
      id: "hipaa_required",
      text: "Is HIPAA compliance required?",
      type: "boolean",
      required: true,
    },
    {
      id: "phi_data",
      text: "Do you store Protected Health Information (PHI)?",
      type: "boolean",
      required: true,
    },
  ],
  finance: [
    {
      id: "soc2_required",
      text: "Is SOC 2 certification required?",
      type: "boolean",
      required: true,
    },
    {
      id: "pci_dss",
      text: "Do you process credit card payments (PCI-DSS)?",
      type: "boolean",
      required: false,
    },
  ],
  technology: [
    {
      id: "cloud_provider",
      text: "Which cloud providers do you use?",
      type: "multiselect",
      required: false,
    },
    {
      id: "sso_provider",
      text: "What is your primary SSO provider?",
      type: "select",
      required: false,
    },
  ],
  education: [
    {
      id: "ferpa_required",
      text: "Is FERPA compliance required?",
      type: "boolean",
      required: false,
    },
    { id: "student_data", text: "Do you store student PII data?", type: "boolean", required: true },
  ],
};

function generateQuestions(
  industry: string,
  requirements: string[],
): Array<{ id: string; text: string; type: string; required: boolean }> {
  const questions = [...BASE_QUESTIONS];
  const industryQs = INDUSTRY_QUESTIONS[industry.toLowerCase()] ?? [];
  questions.push(...industryQs);

  if (requirements.includes("soc2")) {
    questions.push({
      id: "soc2_type",
      text: "SOC 2 Type I or Type II?",
      type: "select",
      required: false,
    });
  }
  if (requirements.includes("iso27001")) {
    questions.push({
      id: "isms_exists",
      text: "Do you have an existing ISMS?",
      type: "boolean",
      required: false,
    });
  }

  return questions;
}

// ── Session store helpers ─────────────────────────────────────────────────

async function createSession(
  tenantId: string,
  industry: string,
  requirements: string[],
  pool: pg.Pool,
): Promise<string> {
  const id = crypto.randomUUID();
  await pool.query(
    `INSERT INTO onboarding_sessions (id, tenant_id, status, industry, requirements, started_at, updated_at)
     VALUES ($1, $2, 'in_progress', $3, $4, NOW(), NOW())`,
    [id, tenantId, industry, JSON.stringify(requirements)],
  );
  return id;
}

async function getSession(
  sessionId: string,
  pool: pg.Pool,
): Promise<Record<string, unknown> | null> {
  const row = await pool.query(
    `SELECT id, tenant_id as "tenantId", status, industry, requirements,
            generated_config as "generatedConfig", started_at as "startedAt",
            completed_at as "completedAt", updated_at as "updatedAt"
     FROM onboarding_sessions WHERE id = $1`,
    [sessionId],
  );
  return row.rows[0] ?? null;
}

async function getSessionByTenant(
  tenantId: string,
  pool: pg.Pool,
): Promise<Record<string, unknown> | null> {
  const row = await pool.query(
    `SELECT id, tenant_id as "tenantId", status, industry, requirements,
            generated_config as "generatedConfig", started_at as "startedAt",
            completed_at as "completedAt", updated_at as "updatedAt"
     FROM onboarding_sessions WHERE tenant_id = $1 ORDER BY started_at DESC LIMIT 1`,
    [tenantId],
  );
  return row.rows[0] ?? null;
}

// ── Onboarding submission logic ───────────────────────────────────────────

async function processSubmission(
  tenantId: string,
  answers: Record<string, unknown>,
  industry: string,
  requirements: string[],
  pool: pg.Pool,
): Promise<{ sessionId: string; config: Record<string, unknown> }> {
  const config: Record<string, unknown> = {
    tenantId,
    industry,
    requirements,
    answers,
    generatedAt: new Date().toISOString(),
    integrations: suggestIntegrations(industry, answers),
    complianceTargets: deriveComplianceTargets(requirements, answers),
    onboardingComplete: true,
  };

  const sessionId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO onboarding_sessions
       (id, tenant_id, status, industry, requirements, generated_config, started_at, completed_at, updated_at)
     VALUES ($1, $2, 'completed', $3, $4, $5, NOW(), NOW(), NOW())
     ON CONFLICT (id) DO UPDATE
       SET status = 'completed', generated_config = EXCLUDED.generated_config,
           completed_at = NOW(), updated_at = NOW()`,
    [sessionId, tenantId, industry, JSON.stringify(requirements), JSON.stringify(config)],
  );

  return { sessionId, config };
}

function suggestIntegrations(industry: string, answers: Record<string, unknown>): string[] {
  const integrations: string[] = ["slack", "github"];
  if (industry === "healthcare") integrations.push("epic", "salesforce_health");
  if (industry === "finance") integrations.push("stripe", "plaid");
  const sso = answers.sso_provider as string | undefined;
  if (sso === "okta") integrations.push("okta");
  if (sso === "azure_ad" || sso === "microsoft_365") integrations.push("microsoft_365");
  return [...new Set(integrations)];
}

function deriveComplianceTargets(
  requirements: string[],
  answers: Record<string, unknown>,
): string[] {
  const targets: string[] = [];
  if (requirements.includes("soc2") || answers.soc2_required === true) targets.push("SOC2");
  if (requirements.includes("hipaa") || answers.hipaa_required === true) targets.push("HIPAA");
  if (requirements.includes("iso27001") || answers.isms_exists !== undefined)
    targets.push("ISO-27001");
  if (requirements.includes("nist")) targets.push("NIST-CSF");
  if (answers.pci_dss === true) targets.push("PCI-DSS");
  return targets;
}

// ── Self-serve signup helpers ──────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(base: string, pool: pg.Pool): Promise<string> {
  const slug = slugify(base);
  const existing = await pool.query<{ id: string }>(
    `SELECT id FROM tenants WHERE id = $1 OR id LIKE $2 ORDER BY id`,
    [slug, `${slug}-%`],
  );
  if (existing.rows.length === 0) return slug;
  // Find next available suffix
  const usedIds = new Set(existing.rows.map((r) => r.id));
  if (!usedIds.has(slug)) return slug;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${slug}-${i}`;
    if (!usedIds.has(candidate)) return candidate;
  }
  // Fallback: append UUID segment
  return `${slug}-${crypto.randomUUID().slice(0, 8)}`;
}

async function handleSignup(
  event: APIGatewayProxyEventV2,
  pool: pg.Pool,
): Promise<APIGatewayProxyResultV2> {
  const b = parseBody(event) as {
    email?: unknown;
    password?: unknown;
    companyName?: unknown;
    fullName?: unknown;
    industry?: unknown;
    employeeCount?: unknown;
    frameworks?: unknown;
  };

  // Validate inputs
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const companyName = typeof b.companyName === "string" ? b.companyName.trim() : "";
  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  const industry = typeof b.industry === "string" ? b.industry.toLowerCase() : "technology";
  const employeeCount = typeof b.employeeCount === "number" ? b.employeeCount : 50;
  const frameworks = Array.isArray(b.frameworks) ? b.frameworks : ["SOC2"];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return fail(400, "Valid email is required", "VALIDATION_FAILED");
  }
  if (!password || password.length < 8) {
    return fail(400, "Password must be at least 8 characters", "VALIDATION_FAILED");
  }
  if (!companyName || companyName.length < 2) {
    return fail(400, "Company name must be at least 2 characters", "VALIDATION_FAILED");
  }
  if (!fullName || fullName.length < 2) {
    return fail(400, "Full name must be at least 2 characters", "VALIDATION_FAILED");
  }

  // Check for existing user with this email (case-insensitive)
  const existingUser = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [email]);
  if (existingUser.rows.length > 0) {
    return fail(409, "An account with this email already exists", "EMAIL_EXISTS");
  }

  // Tenant ID is a UUID going forward (legacy tenants kept slug-style IDs for
  // migration safety — see AWS-MIGRATION-STATUS.md session 3 + migration 0060).
  // Slug is derived from company name for human-readable trust center URLs.
  const tenantId = crypto.randomUUID();
  const slug = await generateUniqueSlug(companyName, pool);

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate user UUID
  const userId = crypto.randomUUID();

  // Insert tenant with industry metadata
  await pool.query(
    `INSERT INTO tenants (id, name, slug, industry, tier, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'free', 'active', NOW(), NOW())`,
    [tenantId, companyName, slug, industry],
  );

  // Insert user
  await pool.query(
    `INSERT INTO users (id, tenant_id, email, display_name, role, status, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'admin', 'active', $5, NOW(), NOW())`,
    [userId, tenantId, email, fullName, passwordHash],
  );

  // Insert initial evidence record for CDT scoring (tenant creation event)
  const evidenceId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO compliance_evidence
       (id, tenant_id, framework, control_id, evidence_type, source, source_id, actor, metadata, created_at)
     VALUES ($1, $2, 'SOC2', 'CC1.3', 'event', 'platform', $3, $4, $5, NOW())
     ON CONFLICT DO NOTHING`,
    [
      evidenceId,
      tenantId,
      evidenceId,
      email,
      JSON.stringify({
        impact: "positive",
        eventType: "tenant.created",
        reasoning: `Tenant ${companyName} onboarded; admin user ${email} created with proper role assignment`,
      }),
    ],
  );

  // Generate and insert synthetic evidence for quick-start (F-28 fix)
  try {
    const syntheticEvidence = generateSyntheticEvidence({
      tenantId,
      industry,
      employeeCount,
      frameworks,
    });

    const result = await insertSyntheticEvidence(pool, syntheticEvidence);
    console.log(
      `[onboarding-api] Inserted ${result.inserted} synthetic evidence items for tenant ${tenantId}`,
    );
  } catch (err) {
    // Non-fatal: log error but don't block signup
    console.error(
      `[onboarding-api] Failed to generate synthetic evidence for tenant ${tenantId}:`,
      err,
    );
  }

  await publishEvent(tenantId, "tenant.created", "onboarding-api", {
    tenantId,
    slug,
    adminUserId: userId,
    adminEmail: email,
    companyName,
    industry,
    employeeCount,
  });
  await publishEvent(tenantId, "user.created", "onboarding-api", {
    userId,
    email,
    role: "admin",
  });

  return ok(
    {
      status: "success",
      data: { tenantId, userId },
    },
    201,
  );
}

// ── Main routing ──────────────────────────────────────────────────────────

export async function route(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const path = event.rawPath;
  const method = event.requestContext.http.method.toUpperCase();
  const qs = event.queryStringParameters ?? {};
  const requestId = event.requestContext.requestId;

  // Handle CORS preflight
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
      },
      body: "",
    };
  }

  // ── Health (no auth) ──────────────────────────────────────────────────────
  if ((path === "/health" || path === "/api/onboarding/health") && method === "GET") {
    return ok({
      status: "healthy",
      service: "onboarding",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      requestId,
    });
  }

  const pool = getPool();

  // ── Public: POST /api/onboarding/signup — self-serve tenant signup ─────────
  if ((path === "/api/onboarding/signup" || path === "/signup") && method === "POST") {
    return handleSignup(event, pool);
  }

  // ── Public: GET /api/onboarding/questions — get onboarding questions ───────
  if (path === "/api/onboarding/questions" && method === "GET") {
    const industry = qs.industry ?? "technology";
    const requirements = (qs.requirements ?? "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    const questions = generateQuestions(industry, requirements);
    return ok({ industry, count: questions.length, questions, requestId });
  }

  // ── Auth (optional for onboarding start/submit) ────────────────────────────
  let auth: Awaited<ReturnType<typeof extractAuth>> | null = null;
  try {
    auth = await extractAuth(event, svc.authRepo);
  } catch (e) {
    // Auth is optional for onboarding start/submit; required for status checks
    if (!(e instanceof AuthError)) {
      return fail(500, "Authentication error", "AUTH_ERROR");
    }
  }

  // ── POST /api/onboarding/start — start onboarding session ─────────────────
  if (path === "/api/onboarding/start" && method === "POST") {
    const b = parseBody(event) as {
      tenantId?: string;
      industry?: string;
      requirements?: string[];
    };
    const industry = b.industry ?? "general";
    const requirements = b.requirements ?? [];
    const questions = generateQuestions(industry, requirements);

    let sessionId: string | undefined;
    const tenantId = b.tenantId ?? auth?.tenantId;
    if (tenantId) {
      sessionId = await createSession(tenantId, industry, requirements, pool);
    }

    return ok({ sessionId, questions, version: "1.0.0", requestId });
  }

  // ── POST /onboarding/submit or /api/onboarding — submit onboarding answers ─
  if ((path === "/api/onboarding/submit" || path === "/api/onboarding") && method === "POST") {
    const b = parseBody(event) as {
      tenantId?: string;
      answers?: Record<string, unknown>;
      industry?: string;
      requirements?: string[];
      companyName?: string;
      contactEmail?: string;
    };

    const tenantId = b.tenantId ?? auth?.tenantId;
    if (!tenantId) return fail(400, "tenantId is required", "VALIDATION_FAILED");

    const industry = b.industry ?? "general";
    const requirements = b.requirements ?? [];
    const answers = b.answers ?? {};

    // Merge top-level fields into answers for backwards compat
    if (b.companyName) answers.company_name = b.companyName;
    if (b.contactEmail) answers.contact_email = b.contactEmail;

    const { sessionId, config } = await processSubmission(
      tenantId,
      answers,
      industry,
      requirements,
      pool,
    );

    await svc.auditRepo.log({
      tenantId,
      actorId: auth?.userId,
      actorType: auth ? "user" : "anonymous",
      action: "onboarding.completed",
      resourceType: "onboarding_session",
      resourceId: sessionId,
      correlationId: requestId,
    });

    return ok({ sessionId, config, status: "completed", requestId });
  }

  // ── GET /api/onboarding/:tenantId — get onboarding status ─────────────────
  const statusMatch = path.match(/^\/api\/onboarding\/([^/]+)$/);
  if (statusMatch && method === "GET") {
    const [, tenantIdParam] = statusMatch;

    // Must be authenticated to view status, and can only view own tenant unless admin
    if (!auth) return fail(401, "Authentication required", "UNAUTHORIZED");
    if (auth.role !== "admin" && auth.tenantId !== tenantIdParam) {
      return fail(403, "Access denied", "FORBIDDEN");
    }

    const session = await getSessionByTenant(tenantIdParam, pool);
    if (!session) return fail(404, "Onboarding session not found", "NOT_FOUND");

    return ok({
      sessionId: session.id,
      status: session.status,
      industry: session.industry,
      config: session.generatedConfig,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      updatedAt: session.updatedAt,
      requestId,
    });
  }

  // ── GET /api/onboarding/sessions/:sessionId — get session by ID ────────────
  const sessionByIdMatch = path.match(/^\/api\/onboarding\/sessions\/([^/]+)$/);
  if (sessionByIdMatch && method === "GET") {
    if (!auth) return fail(401, "Authentication required", "UNAUTHORIZED");
    const [, sessionId] = sessionByIdMatch;
    const session = await getSession(sessionId, pool);
    if (!session) return fail(404, "Session not found", "NOT_FOUND");
    if (auth.role !== "admin" && auth.tenantId !== session.tenantId) {
      return fail(403, "Access denied", "FORBIDDEN");
    }
    return ok({ status: "success", data: session, requestId });
  }

  return fail(404, "Not Found", "NOT_FOUND");
}
