import adapter from "@sveltejs/adapter-cloudflare";

// Minimal SvelteKit config; removed unsupported 'defaultInspector' option.
const config = {
  kit: {
    adapter: adapter(),
  },
};

export default config;
