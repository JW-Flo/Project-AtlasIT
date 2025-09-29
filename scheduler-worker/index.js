export default {
  async fetch(request) {
    if (new URL(request.url).pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", service: "scheduler" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response("Not Found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    // Placeholder: invoke remote orchestrator endpoints instead of doing heavy work here
    // fetch("https://atlasit-orchestrator.kd8jc7v8cd.workers.dev/status").catch(()=>{});
  },
};
