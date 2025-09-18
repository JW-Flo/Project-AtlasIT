import adapter from "@sveltejs/adapter-cloudflare";
const config = { kit: { adapter: adapter(), defaultInspector: false } };
export default config;
