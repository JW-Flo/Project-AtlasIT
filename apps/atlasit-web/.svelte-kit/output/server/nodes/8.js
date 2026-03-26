export const index = 8;
let component_cache;
export const component = async () =>
  (component_cache ??= (
    await import("../entries/pages/it/policies/templates/_page.svelte.js")
  ).default);
export const imports = [
  "_app/immutable/nodes/8.DmvTBjD9.js",
  "_app/immutable/chunks/Bzak7iHL.js",
  "_app/immutable/chunks/B37ZqHvF.js",
  "_app/immutable/chunks/DLjC2_M2.js",
  "_app/immutable/chunks/39A_Ntu8.js",
  "_app/immutable/chunks/BHVF3NEQ.js",
  "_app/immutable/chunks/B36Hb1sH.js",
  "_app/immutable/chunks/CLYubSJh.js",
  "_app/immutable/chunks/DXY25tU5.js",
];
export const stylesheets = ["_app/immutable/assets/8.BUCBvTi_.css"];
export const fonts = [];
