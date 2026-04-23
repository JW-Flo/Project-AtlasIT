/**
 * SvelteKit config — adapter-node for AWS Lambda deployment.
 * Handles SSR + API routes via Lambda Function URL behind CloudFront.
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
