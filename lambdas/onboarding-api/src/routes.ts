import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";

const json = (status: number, body: unknown): APIGatewayProxyResultV2 => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export async function route(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const { rawPath, requestContext } = event;
  const method = requestContext.http.method;

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "onboarding-api" });
  }

  const svc = bootstrap();
  let auth;
  try {
    auth = await extractAuth(event, svc.authRepo);
  } catch (err) {
    if (err instanceof AuthError)
      return json(err.status, { error: err.message });
    throw err;
  }

  // POST /api/v1/onboarding/start
  if (method === "POST" && rawPath.endsWith("/onboarding/start")) {
    const body = JSON.parse(event.body ?? "{}");
    const applications = body.applications as string[] | undefined;

    if (!applications?.length) {
      return json(400, { error: "applications array is required" });
    }

    const onboardingId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Record onboarding as a workflow execution
    await svc.workflowRepo.recordExecution(
      {
        id: onboardingId,
        tenantId: auth.tenantId,
        workflowType: "joiner",
        subjectRef: body.subjectRef ?? null,
        status: "queued",
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        durationMs: 0,
        idempotencyKey: body.idempotencyKey ?? null,
        context: { applications, ...body.context },
      },
      applications.map((app) => ({
        stepId: `connect-${app}`,
        action: "provision_primary_account",
        status: "pending",
        attempts: 0,
        startedAt: now,
        durationMs: 0,
      })),
    );

    await svc.auditRepo.append({
      id: crypto.randomUUID(),
      tenantId: auth.tenantId,
      action: "onboarding.started",
      actor: auth.userId,
      resource: `onboarding:${onboardingId}`,
      timestamp: now,
      metadata: { applications },
    });

    return json(201, { onboardingId, status: "queued", applications });
  }

  // GET /api/v1/onboarding/status/{id}
  if (method === "GET" && rawPath.includes("/onboarding/status/")) {
    const segments = rawPath.split("/");
    const id = segments[segments.length - 1];
    const execution = await svc.workflowRepo.findById(auth.tenantId, id);
    if (!execution) return json(404, { error: "Onboarding not found" });
    return json(200, execution);
  }

  return json(404, { error: "Not found" });
}
