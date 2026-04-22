import { json } from '@sveltejs/kit';

const GET = async ({ fetch }) => {
  const resp = await fetch("/api/health");
  const data = await resp.json();
  return json(data, { status: resp.status });
};

export { GET };
//# sourceMappingURL=_server.ts-BijDZID2.js.map
