/**
 * SvelteKit config for AWS deployment.
 * Uses adapter-node for SSR via Lambda (console-ssr function).
 *
 * Usage: SVELTE_CONFIG=svelte.config.aws.js pnpm build
 * Or: cp svelte.config.aws.js svelte.config.js && pnpm build
 */
import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: "build",
      precompress: true,
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
