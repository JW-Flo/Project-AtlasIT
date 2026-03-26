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
    return json(200, { status: "ok", service: "security-api" });
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

  // POST /api/v1/incidents
  if (method === "POST" && rawPath.endsWith("/incidents")) {
    const body = JSON.parse(event.body ?? "{}");
    const now = new Date().toISOString();
    const incident = {
      id: crypto.randomUUID(),
      tenantId: auth.tenantId,
      title: body.title as string,
      severity: body.severity ?? "medium",
      status: "open" as const,
      createdAt: now,
      updatedAt: now,
      description: body.description,
    };

    if (!incident.title) return json(400, { error: "title is required" });

    await svc.securityRepo.createIncident(incident);
    await svc.auditRepo.append({
      id: crypto.randomUUID(),
      tenantId: auth.tenantId,
      action: "incident.created",
      actor: auth.userId,
      resource: `incident:${incident.id}`,
      timestamp: now,
    });

    return json(201, incident);
  }

  // GET /api/v1/incidents
  if (method === "GET" && rawPath.endsWith("/incidents")) {
    const params = event.queryStringParameters ?? {};
    const incidents = await svc.securityRepo.listIncidents(auth.tenantId, {
      status: params.status,
      limit: params.limit ? parseInt(params.limit, 10) : 50,
    });
    return json(200, { incidents });
  }

  // POST /api/v1/incidents/{id}/resolve
  if (
    method === "POST" &&
    rawPath.includes("/incidents/") &&
    rawPath.endsWith("/resolve")
  ) {
    const segments = rawPath.split("/");
    const id = segments[segments.length - 2];
    const now = new Date().toISOString();

    const existing = await svc.securityRepo.getIncident(auth.tenantId, id);
    if (!existing) return json(404, { error: "Incident not found" });

    await svc.securityRepo.updateIncident(auth.tenantId, id, {
      status: "resolved",
      resolvedAt: now,
      updatedAt: now,
    });

    await svc.auditRepo.append({
      id: crypto.randomUUID(),
      tenantId: auth.tenantId,
      action: "incident.resolved",
      actor: auth.userId,
      resource: `incident:${id}`,
      timestamp: now,
    });

    return json(200, { ...existing, status: "resolved", resolvedAt: now });
  }

  // POST /api/v1/access-requests
  if (method === "POST" && rawPath.endsWith("/access-requests")) {
    const body = JSON.parse(event.body ?? "{}");
    const now = new Date().toISOString();
    const request = {
      id: crypto.randomUUID(),
      tenantId: auth.tenantId,
      requesterId: auth.userId,
      resourceType: body.resourceType as string,
      resourceId: body.resourceId as string,
      justification: body.justification as string,
      status: "pending" as const,
      createdAt: now,
      updatedAt: now,
    };

    if (
      !request.resourceType ||
      !request.resourceId ||
      !request.justification
    ) {
      return json(400, {
        error: "resourceType, resourceId, and justification are required",
      });
    }

    await svc.securityRepo.createAccessRequest(request);
    return json(201, request);
  }

  // GET /api/v1/access-requests
  if (method === "GET" && rawPath.endsWith("/access-requests")) {
    const params = event.queryStringParameters ?? {};
    const requests = await svc.securityRepo.listAccessRequests(auth.tenantId, {
      status: params.status,
      limit: params.limit ? parseInt(params.limit, 10) : 50,
    });
    return json(200, { requests });
  }

  // GET /api/v1/security/activity
  if (method === "GET" && rawPath.endsWith("/security/activity")) {
    const entries = await svc.auditRepo.list(auth.tenantId, { limit: 50 });
    return json(200, { activity: entries });
  }

  return json(404, { error: "Not found" });
}
