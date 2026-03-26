const handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-Frame-Options", "DENY");
  return response;
};
export { handle };
//# sourceMappingURL=hooks.server.js.map
