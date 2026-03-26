import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { bootstrap } from "@atlasit/shared/platform/aws/bootstrap.js";
import { extractAuth, AuthError } from "@atlasit/shared/auth/lambda-auth.js";
import { getStepDefinitions } from "@atlasit/shared/workflow/step-registry.js";
import type { WorkflowType } from "@atlasit/shared/workflow/types.js";

const sfnClient = new SFNClient({});
const SFN_ARN = process.env.SFN_STATE_MACHINE_ARN ?? "";

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
    return json(200, { status: "ok", service: "automation-api" });
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

  // POST /api/v1/workflows/execute
  if (method === "POST" && rawPath.endsWith("/workflows/execute")) {
    const body = JSON.parse(event.body ?? "{}");
    const workflowType = body.workflowType as WorkflowType;
    const idempotencyKey = body.idempotencyKey as string | undefined;
    const subjectRef = body.subjectRef as string | undefined;
    const context = body.context ?? {};

    if (!workflowType) {
      return json(400, { error: "workflowType is required" });
    }

    // Validate workflow type
    try {
      getStepDefinitions(workflowType);
    } catch {
      return json(400, { error: `Invalid workflowType: ${workflowType}` });
    }

    // Idempotency check
    if (idempotencyKey) {
      const existing = await svc.workflowRepo.findByIdempotencyKey(
        auth.tenantId,
        idempotencyKey,
      );
      if (existing) {
        return json(200, {
          executionId: existing.id,
          status: existing.status,
          idempotent: true,
        });
      }
    }

    const executionId = crypto.randomUUID();
    const now = new Date().toISOString();
    const steps = getStepDefinitions(workflowType).map((s) => ({
      stepId: s.id,
      action: s.action,
      status: "pending",
      attempts: 0,
      startedAt: now,
      durationMs: 0,
    }));

    // Persist execution record
    await svc.workflowRepo.recordExecution(
      {
        id: executionId,
        tenantId: auth.tenantId,
        workflowType,
        subjectRef: subjectRef ?? null,
        status: "queued",
        createdAt: now,
        updatedAt: now,
        completedAt: null,
        durationMs: 0,
        idempotencyKey: idempotencyKey ?? null,
        context,
      },
      steps,
    );

    // Start Step Functions execution
    const sfnInput = {
      executionId,
      tenantId: auth.tenantId,
      workflowType,
      context,
      steps: steps.map((s) => ({
        stepId: s.stepId,
        action: s.action,
        executionId,
        tenantId: auth.tenantId,
        context,
      })),
    };

    await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn: SFN_ARN,
        name: executionId,
        input: JSON.stringify(sfnInput),
      }),
    );

    return json(201, { executionId, status: "queued" });
  }

  // GET /api/v1/workflows/executions/{id}
  if (method === "GET" && rawPath.includes("/workflows/executions/")) {
    const segments = rawPath.split("/");
    const id = segments[segments.length - 1];
    const execution = await svc.workflowRepo.findById(auth.tenantId, id);
    if (!execution) return json(404, { error: "Execution not found" });
    return json(200, execution);
  }

  // GET /api/v1/workflows/executions
  if (method === "GET" && rawPath.endsWith("/workflows/executions")) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const count = await svc.workflowRepo.countSince(auth.tenantId, since);
    return json(200, { count, since });
  }

  return json(404, { error: "Not found" });
}
