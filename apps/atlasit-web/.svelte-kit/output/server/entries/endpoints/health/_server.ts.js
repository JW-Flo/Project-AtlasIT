const GET = async () =>
  new Response(
    JSON.stringify({
      status: "ok",
      timestamp: /* @__PURE__ */ new Date().toISOString(),
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
export { GET };
//# sourceMappingURL=_server.ts.js.map
