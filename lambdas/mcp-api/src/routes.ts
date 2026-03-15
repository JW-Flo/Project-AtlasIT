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

const MCP_TOOLS = [
  {
    name: "list_incidents",
    description: "List security incidents for the tenant",
    inputSchema: {
      type: "object",
      properties: { status: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "list_access_requests",
    description: "List access requests for the tenant",
    inputSchema: {
      type: "object",
      properties: { status: { type: "string" }, limit: { type: "number" } },
    },
  },
  {
    name: "get_compliance_snapshot",
    description: "Get compliance snapshot for the tenant",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_policy_templates",
    description: "List available policy templates",
    inputSchema: { type: "object", properties: {} },
  },
];

export async function route(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const { rawPath, requestContext } = event;
  const method = requestContext.http.method;

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "mcp-api" });
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

  // POST /api/v1/mcp/tools — List available tools
  if (method === "POST" && rawPath.endsWith("/mcp/tools")) {
    const body = JSON.parse(event.body ?? "{}");

    // MCP tools/list
    if (body.method === "tools/list" || !body.method) {
      return json(200, { tools: MCP_TOOLS });
    }

    // MCP tools/call
    if (body.method === "tools/call") {
      const toolName = body.params?.name;
      const args = body.params?.arguments ?? {};

      switch (toolName) {
        case "list_incidents": {
          const incidents = await svc.securityRepo.listIncidents(
            auth.tenantId,
            {
              status: args.status,
              limit: args.limit ?? 20,
            },
          );
          return json(200, {
            content: [{ type: "text", text: JSON.stringify(incidents) }],
          });
        }
        case "list_access_requests": {
          const requests = await svc.securityRepo.listAccessRequests(
            auth.tenantId,
            {
              status: args.status,
              limit: args.limit ?? 20,
            },
          );
          return json(200, {
            content: [{ type: "text", text: JSON.stringify(requests) }],
          });
        }
        case "get_compliance_snapshot": {
          const since = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString();
          const [workflowCount, incidents, templates] = await Promise.all([
            svc.workflowRepo.countSince(auth.tenantId, since),
            svc.securityRepo.listIncidents(auth.tenantId, { limit: 100 }),
            svc.policyRepo.listTemplates(),
          ]);
          const snapshot = {
            workflows: workflowCount,
            incidents: incidents.length,
            policyTemplates: templates.length,
          };
          return json(200, {
            content: [{ type: "text", text: JSON.stringify(snapshot) }],
          });
        }
        case "list_policy_templates": {
          const templates = await svc.policyRepo.listTemplates();
          return json(200, {
            content: [{ type: "text", text: JSON.stringify(templates) }],
          });
        }
        default:
          return json(404, {
            error: { code: -32601, message: `Unknown tool: ${toolName}` },
          });
      }
    }

    return json(400, { error: "Unknown method" });
  }

  // POST /api/v1/mcp/resources
  if (method === "POST" && rawPath.endsWith("/mcp/resources")) {
    return json(200, { resources: [] });
  }

  return json(404, { error: "Not found" });
}
