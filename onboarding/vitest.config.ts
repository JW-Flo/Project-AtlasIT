import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        STATE: {
          type: 'kv',
        },
        DB: {
          type: 'd1',
        },
        AI_API_KEY: 'test-key',
      },
    },
  },
});
