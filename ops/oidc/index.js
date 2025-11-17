addEventListener("fetch", (event) => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  try {
    if (request.method !== "POST")
      return new Response("Method Not Allowed", { status: 405 });

    const body = await request.json();
    const id_token = body.id_token;
    if (!id_token)
      return new Response(JSON.stringify({ error: "missing id_token" }), {
        status: 400,
      });

    const OP_CONNECT_HOST =
      Deno?.env?.get("OP_CONNECT_HOST") ||
      (typeof OP_CONNECT_HOST !== "undefined" && OP_CONNECT_HOST) ||
      GLOBAL_OP_CONNECT_HOST;
    const OP_CONNECT_OIDC_CLIENT =
      Deno?.env?.get("OP_CONNECT_OIDC_CLIENT") ||
      (typeof OP_CONNECT_OIDC_CLIENT !== "undefined" &&
        OP_CONNECT_OIDC_CLIENT) ||
      GLOBAL_OP_CONNECT_OIDC_CLIENT;

    if (!OP_CONNECT_HOST) {
      return new Response(
        JSON.stringify({ error: "OP_CONNECT_HOST not configured" }),
        { status: 500 },
      );
    }

    // Forward to Connect exchange endpoint (deployment-specific)
    const resp = await fetch(`${OP_CONNECT_HOST}/v1/auth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }),
    });

    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
}
