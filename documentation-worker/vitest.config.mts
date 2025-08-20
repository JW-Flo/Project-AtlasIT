import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
					// Point to existing Wrangler configuration (was incorrectly .jsonc)
					wrangler: { configPath: './wrangler.toml' },
			},
		},
	},
});
