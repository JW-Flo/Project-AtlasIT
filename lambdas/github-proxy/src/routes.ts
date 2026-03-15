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

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "github-proxy" });
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

  // ANY /api/v1/github/{proxy+}
  const githubPath = rawPath.replace(/^.*\/api\/v1\/github\//, "");
  if (!githubPath) return json(400, { error: "Missing GitHub API path" });

  let ghToken: string;
  try {
    const tokenBytes = await svc.secretResolver.resolve("github-pat");
    ghToken = new TextDecoder().decode(tokenBytes);
  } catch {
    return json(500, { error: "GitHub token not configured" });
  }

  const method = requestContext.http.method;
  const ghUrl = `https://api.github.com/${githubPath}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${ghToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "atlasit-proxy",
  };

  const fetchOpts: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(15_000),
  };

  if (event.body && method !== "GET" && method !== "HEAD") {
    fetchOpts.body = event.body;
    headers["Content-Type"] = "application/json";
  }

  const resp = await fetch(ghUrl, fetchOpts);
  const respBody = await resp.text();

  await svc.auditRepo.append({
    id: crypto.randomUUID(),
    tenantId: auth.tenantId,
    action: "github.proxy",
    actor: auth.userId,
    resource: `github:${method}:${githubPath}`,
    timestamp: new Date().toISOString(),
    metadata: { status: resp.status },
  });

  return {
    statusCode: resp.status,
    headers: {
      "content-type": resp.headers.get("content-type") ?? "application/json",
    },
    body: respBody,
  };
}
