export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.pathname === "/health") {
        return new Response(
          JSON.stringify({
            status: "ok",
            service: "ai-gateway",
            timestamp: Date.now(),
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        );
      }
      return new Response("Not Found", { status: 404 });
    }
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });
    const gatewayUrl =
      "https://gateway.ai.cloudflare.com/v1/620865722bd88ef0a77dbbb60c91392e/project-ignite/workers-ai/@cf/meta/llama-3.1-8b-instruct";
    const token = env.AI_GATEWAY_TOKEN;
    const body = await request.text();
    try {
      const resp = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });
      if (!resp.ok) {
        throw new Error(`AI Gateway error: ${resp.status} ${resp.statusText}`);
      }
      return resp;
    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
