export const index = 12;
let component_cache;
export const component = async () =>
  (component_cache ??= (
    await import("../entries/pages/workflows/_page.svelte.js")
  ).default);
export const imports = [
  "_app/immutable/nodes/12.DMa3aD8O.js",
  "_app/immutable/chunks/Bzak7iHL.js",
  "_app/immutable/chunks/B37ZqHvF.js",
  "_app/immutable/chunks/DLjC2_M2.js",
];
export const stylesheets = [];
export const fonts = [];
