export const index = 1;
let component_cache;
export const component = async () =>
  (component_cache ??= (await import("../entries/fallbacks/error.svelte.js"))
    .default);
export const imports = [
  "_app/immutable/nodes/1.CO-QE4jM.js",
  "_app/immutable/chunks/Bzak7iHL.js",
  "_app/immutable/chunks/B37ZqHvF.js",
  "_app/immutable/chunks/DLjC2_M2.js",
  "_app/immutable/chunks/39A_Ntu8.js",
  "_app/immutable/chunks/CLYubSJh.js",
  "_app/immutable/chunks/FcwPhPSy.js",
  "_app/immutable/chunks/rRTekDYD.js",
  "_app/immutable/chunks/ApJzsbmA.js",
];
export const stylesheets = [];
export const fonts = [];
