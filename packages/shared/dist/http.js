export function json(data, init = {}) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    });
}
export function withCors(response, origin = "*") {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return new Response(response.body, { status: response.status, headers });
}
export function optionsPreflight(origin = "*") {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
//# sourceMappingURL=http.js.map