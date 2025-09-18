import type { RequestHandler } from './$types';
export const GET: RequestHandler = async () =>
  new Response(
    JSON.stringify({ status: 'ok', ts: new Date().toISOString() }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
import type { RequestHandler } from './$types';
export const GET: RequestHandler = async () => new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), { status: 200, headers: { 'content-type': 'application/json' } });
