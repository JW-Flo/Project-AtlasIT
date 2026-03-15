const HEADER = "X-Correlation-ID";
export function correlationId() {
  return async (c, next) => {
    const id = c.req.header(HEADER) ?? crypto.randomUUID();
    c.set("correlationId", id);
    c.header(HEADER, id);
    await next();
  };
}
//# sourceMappingURL=correlation.js.map
