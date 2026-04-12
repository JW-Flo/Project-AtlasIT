// Disable SSR globally for static SPA mode.
// This prevents SvelteKit from trying to fetch __data.json files from the static bundle.
export const ssr = false;

// Allow trailing slash variants
export const trailingSlash = "ignore";

// No server-side data to load in SPA mode; everything is fetched client-side.
export const load = () => ({});
