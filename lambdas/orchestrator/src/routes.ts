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

// Rate limit: track recent requests per tenant
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function route(
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> {
  const { rawPath, requestContext } = event;
  const method = requestContext.http.method;

  if (rawPath.endsWith("/health")) {
    return json(200, { status: "ok", service: "orchestrator" });
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

  // POST /api/v1/orchestrate
  if (method === "POST" && rawPath.endsWith("/orchestrate")) {
    // Rate limiting
    const now = Date.now();
    const entry = rateLimitMap.get(auth.tenantId);
    if (entry && now - entry.windowStart < RATE_LIMIT_WINDOW_MS) {
      if (entry.count >= RATE_LIMIT_MAX) {
        return json(429, { error: "Rate limit exceeded" });
      }
      entry.count++;
    } else {
      rateLimitMap.set(auth.tenantId, { count: 1, windowStart: now });
    }

    const body = JSON.parse(event.body ?? "{}");
    const prompt = body.prompt as string;
    const taskType = body.taskType ?? "general";

    if (!prompt) return json(400, { error: "prompt is required" });

    // Call Groq for task classification and response
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
                content: `You are an IT operations assistant for tenant ${auth.tenantId}. Classify and respond to the following task. Task type: ${taskType}.`,
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 2048,
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );

      if (!resp.ok) {
        return json(502, { error: "AI service unavailable" });
      }

      const data = (await resp.json()) as {
        choices: { message: { content: string } }[];
      };
      const response = data.choices[0]?.message?.content ?? "";

      await svc.auditRepo.append({
        id: crypto.randomUUID(),
        tenantId: auth.tenantId,
        action: "orchestrate.completed",
        actor: auth.userId,
        resource: `task:${taskType}`,
        timestamp: new Date().toISOString(),
        metadata: { promptLength: prompt.length },
      });

      return json(200, { response, taskType });
    } catch {
      return json(502, { error: "AI service timeout" });
    }
  }

  return json(404, { error: "Not found" });
}
