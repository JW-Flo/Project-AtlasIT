/**
 * SvelteKit config for AWS S3 + CloudFront deployment.
 * Uses adapter-static in SPA mode (fallback: index.html) so CloudFront
 * serves index.html for all routes and the client-side router takes over.
 *
 * Usage: SVELTE_CONFIG=svelte.config.aws.js pnpm run build
 * Or: cp svelte.config.aws.js svelte.config.js && pnpm run build
 */
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      fallback: "index.html",
    }),
    paths: {
      relative: false,
    },
    env: {
      publicPrefix: "PUBLIC_",
    },
  },
};

export default config;
