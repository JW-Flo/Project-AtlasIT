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
    return json(200, { status: "ok", service: "compliance-api" });
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

  // POST /api/v1/evidence/ingest
  if (method === "POST" && rawPath.endsWith("/evidence/ingest")) {
    const body = JSON.parse(event.body ?? "{}");
    const content = body.content as string;
    const stepId = body.stepId ?? "manual";
    const runId = body.runId ?? crypto.randomUUID();

    if (!content) return json(400, { error: "content is required" });

    const data = new TextEncoder().encode(content);
    const digest = await crypto.subtle.digest("SHA-256", data);
    const hash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const result = await svc.evidenceStore.put(
      auth.tenantId,
      runId,
      stepId,
      hash,
      content,
    );

    return json(201, { hash, ...result });
  }

  // GET /api/v1/evidence/search
  if (method === "GET" && rawPath.endsWith("/evidence/search")) {
    // Evidence search queries audit log for evidence-related entries
    const entries = await svc.auditRepo.list(auth.tenantId, { limit: 50 });
    return json(200, { results: entries });
  }

  // GET /api/v1/evidence/{hash}
  if (method === "GET" && rawPath.includes("/evidence/")) {
    const segments = rawPath.split("/");
    const hash = segments[segments.length - 1];
    if (hash === "search") return json(404, { error: "Not found" });

    const result = await svc.evidenceStore.get(hash);
    if (!result) return json(404, { error: "Evidence not found" });
    return json(200, JSON.parse(result.body));
  }

  // GET /api/v1/snapshot
  if (method === "GET" && rawPath.endsWith("/snapshot")) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [workflowCount, incidents, templates] = await Promise.all([
      svc.workflowRepo.countSince(auth.tenantId, since),
      svc.securityRepo.listIncidents(auth.tenantId, { limit: 100 }),
      svc.policyRepo.listTemplates(),
    ]);

    return json(200, {
      tenantId: auth.tenantId,
      period: { since, until: new Date().toISOString() },
      workflows: workflowCount,
      incidents: incidents.length,
      policyTemplates: templates.length,
    });
  }

  return json(404, { error: "Not found" });
}
