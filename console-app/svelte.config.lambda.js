/**
 * SvelteKit config for AWS Lambda deployment with SSR.
 * Uses adapter-node to generate a Node.js Lambda handler.
 * Supports SvelteKit server routes (/api/*) and SSR pages.
 */
import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: "build-lambda",
      precompress: false,
      envPrefix: "",
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
