export const index = 9;
let component_cache;
export const component = async () =>
  (component_cache ??= (
    await import("../entries/pages/marketplace/slack/_page.svelte.js")
  ).default);
export const imports = [
  "_app/immutable/nodes/9.DkBVudeM.js",
  "_app/immutable/chunks/Bzak7iHL.js",
  "_app/immutable/chunks/B37ZqHvF.js",
  "_app/immutable/chunks/DLjC2_M2.js",
];
export const stylesheets = [];
export const fonts = [];
