export const index = 6;
let component_cache;
export const component = async () =>
  (component_cache ??= (
    await import("../entries/pages/it/policies/evaluate/_page.svelte.js")
  ).default);
export const imports = [
  "_app/immutable/nodes/6.DjdVN4v5.js",
  "_app/immutable/chunks/Bzak7iHL.js",
  "_app/immutable/chunks/B37ZqHvF.js",
  "_app/immutable/chunks/DLjC2_M2.js",
  "_app/immutable/chunks/39A_Ntu8.js",
  "_app/immutable/chunks/BHVF3NEQ.js",
  "_app/immutable/chunks/C2VxBUJ8.js",
  "_app/immutable/chunks/CWmzcjye.js",
  "_app/immutable/chunks/CLYubSJh.js",
  "_app/immutable/chunks/DXY25tU5.js",
];
export const stylesheets = ["_app/immutable/assets/6.hWdTLeuB.css"];
export const fonts = [];
