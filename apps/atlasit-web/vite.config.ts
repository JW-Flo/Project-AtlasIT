import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

// Using defineConfig to avoid TS mismatch on plugin type (kit provides async plugin array).
export default defineConfig(() => ({
  plugins: [sveltekit() as any],
  build: { sourcemap: true },
}));
