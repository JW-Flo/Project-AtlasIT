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

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce(
          (sorted, k) => {
            sorted[k] = (val as Record<string, unknown>)[k];
            return sorted;
          },
          {} as Record<string, unknown>,
        );
    }
    return val;
  });
}

export async function route(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const { rawPath, requestContext } = event;
  const method = requestContext.http.method;

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "policy-api" });
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

  // GET /api/v1/policies/templates
  if (method === "GET" && rawPath.endsWith("/policies/templates")) {
    const templates = await svc.policyRepo.listTemplates();
    return json(200, { templates });
  }

  // POST /api/v1/policies/generate
  if (method === "POST" && rawPath.endsWith("/policies/generate")) {
    const body = JSON.parse(event.body ?? "{}");
    const templateKey = body.templateKey as string;
    const input = body.input ?? {};

    if (!templateKey) return json(400, { error: "templateKey is required" });

    const template = await svc.policyRepo.getTemplate(templateKey);
    if (!template) return json(404, { error: "Template not found" });

    const contextHash = await sha256Hex(canonicalJson(input));

    // Check for cached generation
    const existing = await svc.policyRepo.findGeneratedByContext(
      auth.tenantId,
      templateKey,
      contextHash,
    );
    if (existing) {
      return json(200, { policy: existing, cached: true });
    }

    // Generate policy content via Groq
    let content = template.body;
    try {
      const groqKeyBytes = await svc.secretResolver.resolve("groq-api-key");
      const groqKey = new TextDecoder().decode(groqKeyBytes);

      const resp = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content:
                  "You are a compliance policy generator. Enhance the policy template with the given context. Return only the policy text.",
              },
              {
                role: "user",
                content: `Template:\n${template.body}\n\nContext:\n${JSON.stringify(input)}`,
              },
            ],
            max_tokens: 4096,
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );

      if (resp.ok) {
        const data = (await resp.json()) as {
          choices: { message: { content: string } }[];
        };
        content = data.choices[0]?.message?.content ?? content;
      }
    } catch {
      // Fall back to base template on Groq error
    }

    const contentHash = await sha256Hex(content);
    const policy = {
      hash: contentHash,
      tenantId: auth.tenantId,
      templateKey,
      content,
      contextHash,
      createdAt: new Date().toISOString(),
      sizeBytes: new TextEncoder().encode(content).length,
    };

    await svc.policyRepo.saveGenerated(policy, canonicalJson(input));
    return json(201, { policy, cached: false });
  }

  // POST /api/v1/policies/evaluate
  if (method === "POST" && rawPath.endsWith("/policies/evaluate")) {
    const body = JSON.parse(event.body ?? "{}");
    const policyKey = body.policyKey as string;
    const input = body.input ?? {};

    if (!policyKey) return json(400, { error: "policyKey is required" });

    const inputHash = await sha256Hex(canonicalJson(input));
    const result = { decision: "allow", details: input };
    const resultJson = canonicalJson(result);
    const resultHash = await sha256Hex(resultJson);

    await svc.policyRepo.recordEvaluation({
      tenantId: auth.tenantId,
      policyKey,
      inputHash,
      resultHash,
      resultJson,
    });

    return json(200, { result, inputHash, resultHash });
  }

  // GET /api/v1/coverage/{framework}
  if (method === "GET" && rawPath.includes("/coverage/")) {
    const segments = rawPath.split("/");
    const framework = segments[segments.length - 1];
    const coverage = await svc.policyRepo.getCoverage(framework, auth.tenantId);
    return json(200, coverage);
  }

  return json(404, { error: "Not found" });
}
