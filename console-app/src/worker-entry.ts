// Cloudflare Worker entry that re-exports the SvelteKit generated worker.
// Wrangler `main` in wrangler.toml points here. Ensure a build has produced
// .svelte-kit/cloudflare/_worker.js before deploying.

// Dynamic import wrapper so lint/type passes before build artifact exists.
let _worker: any;
async function load() {
  if (!_worker) {
    // Use dynamic import; during dev before build this may throw. Wrangler build step ensures presence.
    _worker = (await import("../.svelte-kit/cloudflare/_worker.js")).default;
  }
  return _worker;
}

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    const w = await load();
    return w.fetch(request, env, ctx);
  },
};
