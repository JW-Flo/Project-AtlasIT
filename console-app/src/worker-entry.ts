// Cloudflare Worker entry that re-exports the SvelteKit generated worker.
// Wrangler `main` in wrangler.toml points here. Ensure a build has produced
// .svelte-kit/cloudflare/_worker.js before deploying.

// Dynamic import wrapper so lint/type passes before build artifact exists.
let _worker: any;
async function load() {
  if (!_worker) {
    // Use dynamic import; during dev before build this may throw. Wrangler build step ensures presence.
    // @ts-expect-error: .svelte-kit/cloudflare/_worker.js is generated at build time; not present before `npm run build`.
    _worker = (await import("../.svelte-kit/cloudflare/_worker.js")).default;
  }
  return _worker;
}

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    // Root redirect: send '/' to '/console'
    try {
      const url = new URL(request.url);
      if (url.pathname === "/" || url.pathname === "") {
        url.pathname = "/console";
        return new Response(null, {
          status: 308,
          headers: { Location: url.toString() },
        });
      }
    } catch (e) {
      // Non-fatal; continue to app fetch
      // Using console.warn instead of failing request to keep lightweight
      try {
        console.warn("root_redirect_parse_error", String(e));
      } catch {}
    }
    const w = await load();
    return w.fetch(request, env, ctx);
  },
};
