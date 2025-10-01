export function log(
  level: string,
  event: string,
  data: Record<string, unknown> = {},
) {
  const base = {
    ts: new Date().toISOString(),
    level,
    event,
    worker: "compliance",
    ...data,
  };
  console.log(JSON.stringify(base));
}
