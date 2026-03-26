import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ fetch }) => {
	const resp = await fetch("/api/health");
	const data = await resp.json();
	return json(data, { status: resp.status });
};
